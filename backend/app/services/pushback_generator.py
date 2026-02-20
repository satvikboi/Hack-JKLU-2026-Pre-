"""Pushback email generator — legally grounded reply drafts."""

from __future__ import annotations

import json
from typing import List

from app.models.responses import RedFlag, PushbackEmail
from app.services.ollama_client import OllamaClient
from app.utils.logger import get_logger

log = get_logger("pushback")


class PushbackGenerator:
    """Generates legally-grounded pushback emails citing Indian law."""

    def __init__(self, ollama: OllamaClient):
        self.ollama = ollama

    async def generate(
        self,
        red_flags: List[RedFlag],
        recipient_type: str = "landlord",
        tone: str = "firm",
        language: str = "en",
        sender_name: str | None = None,
    ) -> PushbackEmail:
        """Generate a pushback email addressing all red flags."""
        if not sender_name:
            role_map = {
                "landlord": "Tenant",
                "employer": "Employee",
                "client": "Contractor",
                "lender": "Borrower",
            }
            sender_name = role_map.get(recipient_type, "Concerned Party")

        flags_text = ""
        citations = []
        for i, rf in enumerate(red_flags, 1):
            flags_text += (
                f"\nIssue {i}: {rf.clause_title}\n"
                f"  Quoted: \"{rf.quoted_text}\"\n"
                f"  Violation: {rf.violation_type}\n"
                f"  Law: {rf.law_reference}\n"
                f"  Explanation: {rf.plain_explanation}\n"
            )
            if rf.law_reference:
                citations.append(rf.law_reference)

        sys_prompt = (
            f"You are a professional legal communication writer. "
            f"Write a {tone} pushback email from a {sender_name} to their {recipient_type}. "
            f"Address EACH violation below and cite the EXACT law section provided. "
            f"Do NOT invent any laws not listed. Structure: "
            f"Opening → Issue 1 with law cite → Issue 2... → Demand for revision → Close. "
            f"Return JSON: {{\"subject\": str, \"body\": str}}"
        )

        prompt = f"Red flags to address:\n{flags_text}\n\nGenerate the pushback email."

        try:
            response = await self.ollama.generate(
                prompt=prompt,
                system_prompt=sys_prompt,
                json_mode=True,
            )
            data = json.loads(response)

            body = data.get("body", response)
            subject = data.get("subject", f"Re: Concerns Regarding Draft Agreement")

            return PushbackEmail(
                subject=subject,
                body=body,
                law_citations=list(set(citations)),
                word_count=len(body.split()),
                language=language,
            )
        except json.JSONDecodeError:
            return PushbackEmail(
                subject="Re: Concerns Regarding Draft Agreement",
                body=response if isinstance(response, str) else "Failed to generate email.",
                law_citations=citations,
                word_count=0,
                language=language,
            )
