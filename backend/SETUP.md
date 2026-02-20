# LegalSaathi Backend — Setup Guide

## Prerequisites
- Python 3.12+
- Docker & Docker Compose (optional)
- Redis
- OpenRouter API key (for Qwen3 235B A22B)

## Quick Start (Docker)

### 1. Clone and configure
```bash
cd backend
cp .env.example .env
# Edit .env with your keys:
#   SECRET_KEY — generate with: python -c "import secrets; print(secrets.token_hex(32))"
#   ENCRYPTION_KEY — generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
#   OPENROUTER_API_KEY — your OpenRouter API key
```

### 2. Start all services
```bash
docker-compose up --build -d
```

### 3. Verify health
```bash
curl http://localhost:8000/api/v1/health
# Should return: {"status": "healthy", ...}
```

### 4. View API docs
Open http://localhost:8000/docs

---

## Local Development (without Docker)

### 1. Install Redis
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis
```

### 2. Setup Python environment
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — set DEBUG=true, ENVIRONMENT=development
# Set your OPENROUTER_API_KEY
```

### 4. Run the server
```bash
uvicorn main:app --reload --port 8000
```

### 5. Download embedding model (first run)
The multilingual-e5-large model (~1.2GB) downloads automatically on first use.

---

## LLM Configuration

This backend uses **OpenRouter** to access the **Qwen3 235B A22B** model.

| Setting | Default |
|---------|---------|
| `OPENROUTER_MODEL` | `qwen/qwen3-235b-a22b` |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `LLM_TEMPERATURE` | `0.1` |
| `LLM_MAX_TOKENS` | `4096` |
| `LLM_TIMEOUT` | `120s` |

No local LLM (Ollama) is required — all inference is via the OpenRouter API.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/session | Create anonymous session |
| DELETE | /api/v1/session | Wipe all session data |
| POST | /api/v1/analyze | Analyze contract (file/text) |
| POST | /api/v1/compare | Compare two drafts |
| POST | /api/v1/pushback | Generate pushback email |
| POST | /api/v1/voice/query | Voice query pipeline |
| GET | /api/v1/laws | Browse Indian law database |
| GET | /api/v1/health | Health check |
| GET | /metrics | Prometheus metrics |

## Architecture
- **API**: FastAPI (async) on port 8000
- **LLM**: Qwen3 235B via OpenRouter API
- **Cache/Queue**: Redis on port 6379
- **Vector DB**: ChromaDB (persistent, encrypted)
- **Embeddings**: multilingual-e5-large (local)
- **Workers**: Celery (async heavy tasks)
- **Proxy**: Nginx (TLS termination)
