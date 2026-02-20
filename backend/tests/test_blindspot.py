"""Tests for blindspot analyzer law database loading."""

import json
from pathlib import Path
import pytest


class TestLawDatabase:
    """Test the Indian law JSON files are valid and complete."""

    LAW_DIR = Path(__file__).resolve().parent.parent / "app" / "data" / "indian_laws"

    def test_all_law_files_exist(self):
        expected = ["rental", "employment", "freelance", "consumer", "loan", "nda", "startup"]
        for name in expected:
            assert (self.LAW_DIR / f"{name}.json").exists(), f"Missing: {name}.json"

    def test_all_law_files_valid_json(self):
        for f in self.LAW_DIR.glob("*.json"):
            data = json.loads(f.read_text(encoding="utf-8"))
            assert "standard_clauses" in data, f"{f.name} missing standard_clauses"
            assert len(data["standard_clauses"]) > 0, f"{f.name} has no clauses"

    def test_rental_has_security_deposit(self):
        data = json.loads((self.LAW_DIR / "rental.json").read_text())
        clause_names = [c["clause_name"] for c in data["standard_clauses"]]
        assert "Security Deposit Limit" in clause_names

    def test_employment_has_pf(self):
        data = json.loads((self.LAW_DIR / "employment.json").read_text())
        clause_names = [c["clause_name"] for c in data["standard_clauses"]]
        assert "Provident Fund (PF)" in clause_names

    def test_clause_schema_valid(self):
        """Each clause must have required fields."""
        required_fields = {"clause_id", "clause_name", "severity_if_missing", "law_section", "keywords_to_detect"}
        for f in self.LAW_DIR.glob("*.json"):
            data = json.loads(f.read_text())
            for clause in data["standard_clauses"]:
                for field in required_fields:
                    assert field in clause, f"{f.name} clause '{clause.get('clause_name', '?')}' missing '{field}'"

    def test_severities_valid(self):
        """All severities must be critical, medium, or low."""
        valid = {"critical", "medium", "low"}
        for f in self.LAW_DIR.glob("*.json"):
            data = json.loads(f.read_text())
            for clause in data["standard_clauses"]:
                assert clause["severity_if_missing"] in valid, f"Invalid severity in {f.name}: {clause['severity_if_missing']}"
