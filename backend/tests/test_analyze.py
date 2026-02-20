"""Test the analyze API endpoint."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# These tests require Redis running.
# Skip gracefully if Redis is not available.

pytestmark = pytest.mark.asyncio


class TestAnalyzeAPI:
    """Integration tests for the analysis pipeline."""

    @pytest.fixture
    def app(self):
        """Import the FastAPI app."""
        import sys
        sys.path.insert(0, ".")
        from main import app
        return app

    async def test_root_endpoint(self, app):
        """Test that the root endpoint returns app info."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/")
            assert resp.status_code == 200
            data = resp.json()
            assert data["app"] == "LegalSaathi"
            assert "version" in data

    async def test_health_endpoint(self, app):
        """Test health check (may show degraded without Redis/Ollama)."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] in ("healthy", "degraded", "unhealthy")
            assert "checks" in data
            assert "version" in data

    async def test_analyze_without_session_returns_401(self, app):
        """Test that analyze requires a session."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/v1/analyze", data={"text": "test"})
            assert resp.status_code == 401

    async def test_laws_endpoint(self, app):
        """Test the laws browsing endpoint."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/laws")
            assert resp.status_code == 200
            data = resp.json()
            assert "laws" in data
            assert "total" in data

    async def test_laws_filter_by_category(self, app):
        """Test laws with category filter."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/v1/laws?category=rental")
            assert resp.status_code == 200
            data = resp.json()
            assert data["category"] == "rental"
