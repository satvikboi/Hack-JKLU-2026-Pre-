"""Blindspot analyzer — detects missing clauses using Indian law DB."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

from app.models.responses import MissingClause
from app.services.rag_pipeline import RAGPipeline
from app.utils.logger import get_logger

log = get_logger("blindspot")

_LAWS_DIR = Path(__file__).resolve().parent.parent / "data" / "indian_laws"


class BlindspotAnalyzer:
    """Detects missing clauses by comparing against Indian law standard clauses."""

    def __init__(self, rag: RAGPipeline):
        self.rag = rag
        self.law_db = self._load_law_database()

    def _load_law_database(self) -> dict:
        """Load all JSON law files keyed by contract type."""
        db = {}
        if not _LAWS_DIR.exists():
            log.warning("law_dir_missing", path=str(_LAWS_DIR))
            return db
        for f in _LAWS_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                ctype = data.get("contract_type", f.stem)
                db[ctype] = data.get("standard_clauses", [])
            except Exception as e:
                log.error("law_file_load_error", file=f.name, error=str(e))
        log.info("law_database_loaded", types=list(db.keys()), total_clauses=sum(len(v) for v in db.values()))
        return db

    async def analyze(self, session_id: str, contract_type: str) -> List[MissingClause]:
        """Check each standard clause — is it present in the contract?"""
        clauses = self.law_db.get(contract_type, [])
        if not clauses:
            clauses = self.law_db.get("general", [])

        missing: List[MissingClause] = []

        for clause in clauses:
            clause_name = clause.get("clause_name", "")
            keywords = clause.get("keywords_to_detect", [])

            question = (
                f"Does this contract contain a clause about '{clause_name}'? "
                f"Look for any mention of: {', '.join(keywords)}. "
                f"Answer with ONLY 'YES' or 'NO'."
            )

            sys_prompt = (
                "You are a legal document reviewer. You must answer ONLY 'YES' or 'NO'. "
                "NO other text. Check if the contract has a clause covering the asked topic."
            )

            try:
                answer = await self.rag.query(session_id=session_id, question=question, system_prompt=sys_prompt)
                answer_clean = answer.strip().upper()

                if "NO" in answer_clean and "YES" not in answer_clean:
                    missing.append(MissingClause(
                        clause_name=clause_name,
                        description=clause.get("plain_english", ""),
                        law_reference=clause.get("law_section", ""),
                        risk_if_absent=clause.get("red_flag_if", "This clause is missing from your contract."),
                        severity=clause.get("severity_if_missing", "medium"),
                        suggested_clause=clause.get("template_clause", ""),
                    ))

            except Exception as e:
                log.warning("blindspot_check_error", clause=clause_name, error=str(e))

        log.info("blindspot_analysis_complete", session_id=session_id[:8], missing=len(missing), total_checked=len(clauses))
        return missing
