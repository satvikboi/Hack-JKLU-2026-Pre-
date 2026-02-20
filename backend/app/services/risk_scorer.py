"""India-specific risk scoring engine — LLM + rule-based hybrid."""

from __future__ import annotations

import json
import time
from typing import List

from app.models.responses import RedFlag, AnalysisResponse, MissingClause, SafeClause
from app.services.rag_pipeline import RAGPipeline
from app.services.blindspot_analyzer import BlindspotAnalyzer
from app.services.indian_acts_lookup import get_acts_context_for_prompt
from app.utils.helpers import generate_id, clamp, utcnow
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("risk_scorer")

_RISK_PROMPT_PATH = "app/data/prompts/risk_analysis.txt"

SCORING_WEIGHTS = {
    "critical": 20,
    "medium": 8,
    "low": 3,
    "missing_critical": 15,
    "missing_medium": 5,
    "missing_low": 2,
}


class RiskScorer:
    """Combines LLM red-flag detection + rule-based checks + blindspot count."""

    def __init__(self, rag: RAGPipeline, blindspot: BlindspotAnalyzer):
        self.rag = rag
        self.blindspot = blindspot

    async def score(
        self,
        session_id: str,
        contract_type: str,
        language: str = "en",
    ) -> AnalysisResponse:
        """Full risk scoring pipeline."""
        start = time.time()

        # ── Step 1: LLM red flag detection ────────────────
        red_flags = await self._detect_red_flags(session_id, contract_type)

        # ── Step 2: Blindspot analysis ────────────────────
        missing_clauses = await self.blindspot.analyze(session_id, contract_type)

        # ── Step 3: Safe clause detection ─────────────────
        safe_clauses = await self._detect_safe_clauses(session_id, contract_type)

        # ── Step 4: Score calculation ─────────────────────
        score = 0
        for rf in red_flags:
            score += SCORING_WEIGHTS.get(rf.severity, 5)
        for mc in missing_clauses:
            score += SCORING_WEIGHTS.get(f"missing_{mc.severity}", 3)

        risk_score = int(clamp(score, 0, 100))
        risk_level = "low" if risk_score <= 30 else "medium" if risk_score <= 60 else "high"

        # ── Step 5: Summary ───────────────────────────────
        summary = self._build_summary(red_flags, missing_clauses, risk_score, risk_level)

        elapsed = int((time.time() - start) * 1000)
        analysis_id = generate_id()

        m.ANALYSES_TOTAL.labels(contract_type=contract_type, language=language, risk_level=risk_level).inc()
        m.ANALYSIS_DURATION.observe(elapsed / 1000)

        log.info(
            "risk_scoring_complete",
            session_id=session_id[:8],
            score=risk_score,
            level=risk_level,
            flags=len(red_flags),
            missing=len(missing_clauses),
        )

        return AnalysisResponse(
            analysis_id=analysis_id,
            session_id=session_id,
            contract_type=contract_type,
            risk_score=risk_score,
            risk_level=risk_level,
            summary=summary,
            red_flags=red_flags,
            missing_clauses=missing_clauses,
            safe_clauses=safe_clauses,
            processing_time_ms=elapsed,
            language=language,
            expires_at=utcnow(),
        )

    async def _detect_red_flags(self, session_id: str, contract_type: str) -> List[RedFlag]:
        """Ask LLM to find red flags with Indian law violations."""
        acts_context = get_acts_context_for_prompt(contract_type)

        sys_prompt = (
            "You are an Indian legal expert specializing in contract law. "
            "Analyze the contract for violations of Indian laws. "
            f"\n\n{acts_context}\n\n"
            "Use these specific Indian Acts and their sections when citing violations. "
            "Return ONLY a JSON array of red flags. Each red flag must have: "
            '"clause_title", "quoted_text" (exact quote from contract), '
            '"violation_type", "law_reference" (specific act and section from the acts listed above), '
            '"severity" ("critical" or "medium" or "low"), '
            '"plain_explanation", "recommendation", "replacement_clause". '
            "Only cite laws you are certain about. If unsure, omit. "
            "Return an empty array [] if no red flags found."
        )

        question = (
            f"This is a {contract_type} contract. Analyze ALL clauses for violations "
            f"of Indian law. Look for illegal terms, unfair clauses, and rights violations. "
            f"Cite specific Indian Acts and their sections. "
            f"Return the red flags as a JSON array."
        )

        try:
            response = await self.rag.query(
                session_id=session_id,
                question=question,
                system_prompt=sys_prompt,
                json_mode=True,
            )

            flags_data = json.loads(response)
            if isinstance(flags_data, dict):
                flags_data = flags_data.get("red_flags", flags_data.get("flags", []))
            if not isinstance(flags_data, list):
                flags_data = []

            red_flags = []
            for i, f in enumerate(flags_data):
                try:
                    red_flags.append(RedFlag(
                        flag_id=f"rf_{i}",
                        clause_title=f.get("clause_title", "Unknown Clause"),
                        quoted_text=f.get("quoted_text", ""),
                        violation_type=f.get("violation_type", ""),
                        law_reference=f.get("law_reference", ""),
                        severity=f.get("severity", "medium"),
                        plain_explanation=f.get("plain_explanation", ""),
                        recommendation=f.get("recommendation", ""),
                        replacement_clause=f.get("replacement_clause"),
                    ))
                except Exception:
                    continue

            return red_flags

        except json.JSONDecodeError:
            log.warning("red_flag_json_parse_error", session_id=session_id[:8])
            return []
        except Exception as e:
            log.error("red_flag_detection_error", error=str(e))
            return []

    async def _detect_safe_clauses(self, session_id: str, contract_type: str) -> List[SafeClause]:
        """Ask LLM to identify fair/favorable clauses."""
        sys_prompt = (
            "You are an Indian legal expert. Identify clauses that are FAIR and "
            "FAVORABLE to the weaker party. Return a JSON array with: "
            '"clause_title", "quoted_text", "explanation". '
            "Return max 5 safe clauses. Return empty array [] if none found."
        )

        question = f"Find the clauses in this {contract_type} contract that are fair and protect the weaker party."

        try:
            response = await self.rag.query(session_id=session_id, question=question, system_prompt=sys_prompt, json_mode=True)
            data = json.loads(response)
            if isinstance(data, dict):
                data = data.get("safe_clauses", [])
            if not isinstance(data, list):
                data = []

            return [
                SafeClause(
                    clause_title=c.get("clause_title", ""),
                    quoted_text=c.get("quoted_text", ""),
                    explanation=c.get("explanation", ""),
                )
                for c in data[:5]
            ]
        except Exception:
            return []

    def _build_summary(self, red_flags: List[RedFlag], missing: List[MissingClause], score: int, level: str) -> str:
        """Build a human-readable summary."""
        critical = sum(1 for f in red_flags if f.severity == "critical")
        medium = sum(1 for f in red_flags if f.severity == "medium")
        missing_count = len(missing)

        parts = [f"Risk Score: {score}/100 ({level.upper()})."]
        if critical:
            parts.append(f"{critical} critical violation(s) found.")
        if medium:
            parts.append(f"{medium} medium-risk clause(s) identified.")
        if missing_count:
            parts.append(f"{missing_count} standard clause(s) are missing.")

        if score > 60:
            parts.append("You should NOT sign this contract as-is. Seek legal revision.")
        elif score > 30:
            parts.append("Review flagged items carefully before signing.")
        else:
            parts.append("This contract appears mostly fair.")

        return " ".join(parts)
