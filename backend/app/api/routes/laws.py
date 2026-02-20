"""Indian law database + acts endpoint."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.models.responses import LawsResponse, LawEntry
from app.services.indian_acts_lookup import search_acts, get_all_acts, get_relevant_acts_for_contract

router = APIRouter()

_LAWS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "indian_laws"
_law_cache: dict = {}


def _load_laws():
    """Load all law JSONs into memory."""
    global _law_cache
    if _law_cache:
        return
    if not _LAWS_DIR.exists():
        return
    for f in _LAWS_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            _law_cache[f.stem] = data
        except Exception:
            pass


class ActEntry(BaseModel):
    act_id: str
    short_title: str
    act_year: str
    ministry: str | None = None
    summary: str | None = None
    url: str | None = None


class ActsResponse(BaseModel):
    acts: list[ActEntry]
    total: int
    query: str = ""


@router.get("/laws", response_model=LawsResponse)
async def get_laws(
    category: Optional[str] = Query(None),
    lang: str = Query("en"),
):
    """Browse Indian law clauses by category."""
    _load_laws()

    entries = []
    for cat_name, data in _law_cache.items():
        if category and cat_name != category:
            continue

        for clause in data.get("standard_clauses", []):
            plain = clause.get("plain_english", "")
            if lang == "hi":
                plain = clause.get("plain_hindi", plain)

            entries.append(LawEntry(
                clause_id=clause.get("clause_id", ""),
                clause_name=clause.get("clause_name", ""),
                law_section=clause.get("law_section", ""),
                plain_english=plain,
                plain_hindi=clause.get("plain_hindi"),
                severity_if_missing=clause.get("severity_if_missing", "medium"),
                keywords=clause.get("keywords_to_detect", []),
            ))

    return LawsResponse(
        laws=entries,
        total=len(entries),
        category=category or "all",
    )


@router.get("/acts/search", response_model=ActsResponse)
async def search_indian_acts(
    q: str = Query(..., min_length=2, description="Search keyword"),
    limit: int = Query(20, ge=1, le=100),
):
    """Search 684 Indian Central Acts by keyword."""
    results = search_acts(q, limit=limit)
    return ActsResponse(
        acts=[ActEntry(
            act_id=a.get("act_id", ""),
            short_title=a.get("short_title", ""),
            act_year=a.get("act_year", ""),
            ministry=a.get("ministry"),
            summary=a.get("long_title") or a.get("summary"),
            url=a.get("url"),
        ) for a in results],
        total=len(results),
        query=q,
    )


@router.get("/acts/relevant", response_model=ActsResponse)
async def get_relevant_acts(
    contract_type: str = Query("loan", description="Contract type: loan, rental, employment, freelance, nda, consumer, startup"),
):
    """Get Indian Acts relevant to a specific contract type."""
    results = get_relevant_acts_for_contract(contract_type)
    return ActsResponse(
        acts=[ActEntry(
            act_id=a.get("act_id", ""),
            short_title=a.get("short_title", ""),
            act_year=a.get("act_year", ""),
            ministry=a.get("ministry"),
            summary=a.get("long_title") or a.get("summary"),
            url=a.get("url"),
        ) for a in results],
        total=len(results),
        query=contract_type,
    )


@router.get("/acts", response_model=ActsResponse)
async def list_all_acts(
    ministry: Optional[str] = Query(None),
    year_from: Optional[str] = Query(None),
    year_to: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Browse all 684 Indian Central Acts with optional filters."""
    results, total = get_all_acts(ministry=ministry, year_from=year_from, year_to=year_to, limit=limit, offset=offset)
    return ActsResponse(
        acts=[ActEntry(
            act_id=a.get("act_id", ""),
            short_title=a.get("short_title", ""),
            act_year=a.get("act_year", ""),
            ministry=a.get("ministry"),
            summary=a.get("long_title") or a.get("summary"),
            url=a.get("url"),
        ) for a in results],
        total=total,
    )
