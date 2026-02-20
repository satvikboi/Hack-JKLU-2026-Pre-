"""Indian Acts Lookup Service — searches 684 Central Acts from indiacode.nic.in."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from app.utils.logger import get_logger

log = get_logger("indian_acts")

_ACTS_FILE = Path(__file__).resolve().parent.parent / "data" / "indian_acts.json"
_acts_cache: Optional[List[dict]] = None

# ── Key acts relevant to common contract types ─────────
CONTRACT_RELEVANT_ACTS = {
    "loan": [
        "The Indian Contract Act, 1872",
        "The Reserve Bank of India Act, 1934",
        "The Negotiable Instruments Act, 1881",
        "The Consumer Protection Act, 2019",
        "The Transfer of Property Act, 1882",
        "The Recovery of Debts and Bankruptcy Act, 1993",
        "The Insolvency and Bankruptcy Code, 2016",
        "The Interest Act, 1978",
        "The Banking Regulation Act, 1949",
        "The Micro, Small and Medium Enterprises Development Act, 2006",
    ],
    "rental": [
        "The Indian Contract Act, 1872",
        "The Transfer of Property Act, 1882",
        "The Registration Act, 1908",
        "The Indian Stamp Act, 1899",
        "The Consumer Protection Act, 2019",
    ],
    "employment": [
        "The Indian Contract Act, 1872",
        "The Industrial Disputes Act, 1947",
        "The Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
        "The Payment of Gratuity Act, 1972",
        "The Minimum Wages Act, 1948",
        "The Payment of Wages Act, 1936",
        "The Employees' State Insurance Act, 1948",
        "The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
        "The Maternity Benefit Act, 1961",
        "The Consumer Protection Act, 2019",
    ],
    "freelance": [
        "The Indian Contract Act, 1872",
        "The Income-tax Act, 1961",
        "The Goods and Services Tax Act, 2017",
        "The Information Technology Act, 2000",
        "The Consumer Protection Act, 2019",
    ],
    "nda": [
        "The Indian Contract Act, 1872",
        "The Information Technology Act, 2000",
        "The Indian Evidence Act, 1872",
        "The Specific Relief Act, 1963",
    ],
    "consumer": [
        "The Consumer Protection Act, 2019",
        "The Indian Contract Act, 1872",
        "The Sale of Goods Act, 1930",
        "The Legal Metrology Act, 2009",
    ],
    "startup": [
        "The Indian Contract Act, 1872",
        "The Companies Act, 2013",
        "The Indian Partnership Act, 1932",
        "The Limited Liability Partnership Act, 2008",
        "The Income-tax Act, 1961",
        "The Information Technology Act, 2000",
        "The Competition Act, 2002",
    ],
}


def _load_acts() -> List[dict]:
    """Load all acts from JSON file (cached)."""
    global _acts_cache
    if _acts_cache is not None:
        return _acts_cache

    if not _ACTS_FILE.exists():
        log.warning("indian_acts_file_missing", path=str(_ACTS_FILE))
        _acts_cache = []
        return _acts_cache

    try:
        data = json.loads(_ACTS_FILE.read_text(encoding="utf-8"))
        _acts_cache = data.get("acts", [])
        log.info("indian_acts_loaded", count=len(_acts_cache))
    except Exception as e:
        log.error("indian_acts_load_error", error=str(e))
        _acts_cache = []

    return _acts_cache


def search_acts(query: str, limit: int = 20) -> List[dict]:
    """Search acts by keyword in title, summary, or ministry."""
    acts = _load_acts()
    query_lower = query.lower()
    results = []

    for act in acts:
        score = 0
        title = (act.get("short_title") or "").lower()
        summary = (act.get("summary") or act.get("long_title") or "").lower()
        ministry = (act.get("ministry") or "").lower()

        if query_lower in title:
            score += 3
        if query_lower in summary:
            score += 2
        if query_lower in ministry:
            score += 1

        if score > 0:
            results.append((score, act))

    results.sort(key=lambda x: x[0], reverse=True)
    return [act for _, act in results[:limit]]


def get_relevant_acts_for_contract(contract_type: str) -> List[dict]:
    """Get acts relevant to a specific contract type."""
    acts = _load_acts()
    relevant_titles = CONTRACT_RELEVANT_ACTS.get(contract_type, CONTRACT_RELEVANT_ACTS.get("loan", []))

    matched = []
    for act in acts:
        title = act.get("short_title", "")
        for rt in relevant_titles:
            if rt.lower() in title.lower() or title.lower() in rt.lower():
                matched.append(act)
                break

    return matched


def get_acts_context_for_prompt(contract_type: str) -> str:
    """Generate a context string of relevant Indian acts for LLM prompts."""
    relevant = get_relevant_acts_for_contract(contract_type)

    if not relevant:
        return "Reference Indian laws as applicable."

    lines = ["Relevant Indian Laws for this analysis:"]
    for act in relevant:
        title = act.get("short_title", "")
        year = act.get("act_year", "")
        summary = act.get("long_title") or act.get("summary") or ""
        ministry = act.get("ministry", "")
        url = act.get("url", "")

        lines.append(f"• {title} ({year}) — {summary}")
        if ministry:
            lines.append(f"  Ministry: {ministry}")
        if url:
            lines.append(f"  Reference: {url}")

    return "\n".join(lines)


def get_all_acts(
    ministry: Optional[str] = None,
    year_from: Optional[str] = None,
    year_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[List[dict], int]:
    """Get all acts with optional filtering."""
    acts = _load_acts()

    filtered = acts
    if ministry:
        ministry_lower = ministry.lower()
        filtered = [a for a in filtered if ministry_lower in (a.get("ministry") or "").lower()]
    if year_from:
        filtered = [a for a in filtered if (a.get("act_year") or "0") >= year_from]
    if year_to:
        filtered = [a for a in filtered if (a.get("act_year") or "9999") <= year_to]

    total = len(filtered)
    return filtered[offset:offset + limit], total
