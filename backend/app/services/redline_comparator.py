"""Redline comparator — contract diff engine."""

from __future__ import annotations

import difflib
import json
from typing import List

from app.models.responses import RedlineReport, ContractChange
from app.services.rag_pipeline import RAGPipeline
from app.services.document_parser import DocumentParser
from app.services.chunker import LegalTextChunker
from app.utils.logger import get_logger

log = get_logger("redline")


class RedlineComparator:
    """Detects changes between two contract versions using semantic diff."""

    def __init__(self, rag: RAGPipeline):
        self.rag = rag
        self.chunker = LegalTextChunker()

    async def compare(
        self,
        text_v1: str,
        text_v2: str,
        session_id: str,
        language: str = "en",
    ) -> RedlineReport:
        """Compare two contract texts and classify changes."""
        # Step 1: Text-level diff
        diffs = self._compute_diffs(text_v1, text_v2)

        # Step 2: Classify changes via LLM
        changes: List[ContractChange] = []
        critical_count = 0

        for diff in diffs[:20]:  # Limit to 20 most important diffs
            change = await self._classify_change(diff, session_id)
            if change:
                changes.append(change)
                if change.severity in ("critical", "high"):
                    critical_count += 1

        # Step 3: Summary
        summary = f"Found {len(changes)} differences. {critical_count} are critical."

        log.info("redline_complete", changes=len(changes), critical=critical_count)

        return RedlineReport(
            total_changes=len(changes),
            critical_changes=critical_count,
            changes=changes,
            summary=summary,
        )

    def _compute_diffs(self, text1: str, text2: str) -> List[dict]:
        """Compute clause-level diffs using difflib."""
        lines1 = text1.splitlines()
        lines2 = text2.splitlines()

        differ = difflib.unified_diff(lines1, lines2, lineterm="")
        diffs = []
        current_old = []
        current_new = []

        for line in differ:
            if line.startswith("---") or line.startswith("+++") or line.startswith("@@"):
                continue
            if line.startswith("-"):
                current_old.append(line[1:])
            elif line.startswith("+"):
                current_new.append(line[1:])
            else:
                if current_old or current_new:
                    diffs.append({
                        "old": "\n".join(current_old) if current_old else None,
                        "new": "\n".join(current_new) if current_new else None,
                    })
                    current_old = []
                    current_new = []

        if current_old or current_new:
            diffs.append({
                "old": "\n".join(current_old) if current_old else None,
                "new": "\n".join(current_new) if current_new else None,
            })

        return [d for d in diffs if (d["old"] and d["old"].strip()) or (d["new"] and d["new"].strip())]

    async def _classify_change(self, diff: dict, session_id: str) -> ContractChange | None:
        """Ask LLM to classify a specific change."""
        old_text = diff.get("old", "[not present]")
        new_text = diff.get("new", "[not present]")

        sys_prompt = (
            "You are a contract review expert. Classify this contract change. "
            "Return ONLY JSON: {\"clause_title\": str, \"change_type\": "
            "\"removed\"|\"added\"|\"weakened\"|\"strengthened\"|\"modified\", "
            "\"severity\": \"critical\"|\"high\"|\"medium\"|\"low\", "
            "\"impact_explanation\": str, \"favorable_to\": \"you\"|\"other_party\"|\"neutral\"}"
        )

        question = f"Old version:\n{old_text}\n\nNew version:\n{new_text}\n\nClassify this change."

        try:
            response = await self.rag.ollama.generate(
                prompt=question,
                system_prompt=sys_prompt,
                json_mode=True,
            )
            data = json.loads(response)
            return ContractChange(
                clause_title=data.get("clause_title", "Unknown"),
                change_type=data.get("change_type", "modified"),
                old_text=old_text,
                new_text=new_text,
                severity=data.get("severity", "medium"),
                impact_explanation=data.get("impact_explanation", ""),
                favorable_to=data.get("favorable_to", "neutral"),
            )
        except Exception as e:
            log.warning("change_classification_error", error=str(e))
            return None
