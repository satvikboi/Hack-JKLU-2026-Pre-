# 🛡️ LegalSaathi — India's AI Legal Guardian

> **AI-powered contract analysis platform** that reads your legal documents, detects risky clauses, finds missing protections, and explains everything in plain language — all verified against real Indian laws.

---

## 📚 Table of Contents

- [What Does This App Do?](#what-does-this-app-do)
- [How the Backend Works](#how-the-backend-works)
  - [Step 1: File Upload & Validation](#step-1-file-upload--validation)
  - [Step 2: Document Parsing](#step-2-document-parsing)
  - [Step 3: Smart Chunking](#step-3-smart-chunking)
  - [Step 4: Embedding & Vector Storage](#step-4-embedding--vector-storage)
  - [Step 5: Risk Scoring (How the Percentage Works)](#step-5-risk-scoring-how-the-percentage-works)
  - [Step 6: Red Flag Detection](#step-6-red-flag-detection)
  - [Step 7: Blindspot Analysis (Missing Clauses)](#step-7-blindspot-analysis-missing-clauses)
  - [Step 8: Safe Clause Detection](#step-8-safe-clause-detection)
- [The Indian Law Database](#the-indian-law-database)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Setup & Run](#setup--run)
- [Environment Variables](#environment-variables)

---

## What Does This App Do?

LegalSaathi takes a legal document (rental agreement, employment contract, loan document, NDA, freelance contract, startup agreement, or any consumer contract) and:

1. **Reads it** — Extracts text from PDF, DOCX, DOC, PPTX, images (OCR), or plain text
2. **Understands it** — Uses AI (Qwen3 235B via OpenRouter) to analyze each clause
3. **Checks it against Indian law** — Cross-references with 684 Central Acts and 43+ standard clauses from 7 law categories
4. **Scores the risk** — Gives a 0-100 risk score based on how dangerous the contract is
5. **Shows you what's wrong** — Red flags with exact law violations, quoted text, and replacement clauses
6. **Shows you what's missing** — Clauses that should be there but aren't
7. **Shows you what's safe** — Fair clauses that protect you

---

## How the Backend Works

Here's the complete journey of what happens when you upload a contract:

### Step 1: File Upload & Validation

**File:** `app/security/file_validator.py`

When you upload a file, the system first validates it for safety:

- ✅ Checks file extension (`.pdf`, `.docx`, `.doc`, `.pptx`, `.txt`, `.png`, `.jpg`, `.jpeg`)
- ✅ Checks file size (max 10 MB)
- ✅ Reads the first few bytes ("magic bytes") to verify it's actually the file type it claims to be
- ✅ Blocks dangerous files that pretend to be documents

**Example:** A `.exe` file renamed to `.pdf` would be caught because its magic bytes (`MZ`) don't match PDF magic bytes (`%PDF`).

The PK-based ZIP formats (`.docx`, `.pptx`) are disambiguated by file extension since they share the same `PK\x03\x04` signature.

---

### Step 2: Document Parsing

**File:** `app/services/document_parser.py`

Once validated, the document is parsed into clean text:

| File Type | How It's Parsed |
|-----------|----------------|
| **PDF** | `pymupdf4llm` extracts text with layout. Falls back to OCR if text is empty (scanned PDFs) |
| **DOCX** | `python-docx` reads paragraphs, headings, and tables while preserving structure |
| **DOC** | Uses `antiword` CLI tool (legacy Word format) |
| **PPTX** | `python-pptx` reads text from all slides and tables |
| **Images** | `easyocr` performs Optical Character Recognition |
| **Text** | Direct read with encoding detection |

The output is a `ParsedDocument` object containing:
- `text` — the raw extracted text
- `markdown` — structured markdown version
- `page_count` — number of pages
- `language` — auto-detected language (English, Hindi, etc.)

---

### Step 3: Smart Chunking

**File:** `app/services/chunker.py`

Legal documents can't be split randomly — a clause split in half would lose its meaning. The `LegalTextChunker` is smart about this:

1. **Protects tables** — Tables are temporarily replaced with placeholders so they don't get split
2. **Splits at clause boundaries** — Uses regex to detect clause numbers like `1.`, `1.1`, `(a)`, `A.`
3. **Respects size limits** — If a clause is too long, it splits at sentence boundaries
4. **Adds overlap** — Adjacent chunks share some text so the AI has context

**Example:**
```
Original: "1. The tenant shall pay... 2. The landlord shall..."
Chunk 1: "1. The tenant shall pay..." (stays together)
Chunk 2: "2. The landlord shall..." (stays together)
```

---

### Step 4: Embedding & Vector Storage

**Files:** `app/services/embedder.py`, `app/services/vector_store.py`

Each text chunk is converted into a mathematical vector (a list of numbers) that represents its meaning. This allows the AI to search for relevant parts of the contract.

**How it works:**

1. **Embedding** — `sentence-transformers` converts text into 384-dimensional vectors
2. **Storage** — Vectors are stored in **ChromaDB** (a local vector database), organized per session
3. **Search** — When the AI needs to check a clause, it converts the question into a vector, then finds the most similar chunks using **cosine similarity**

Each user session gets its own isolated ChromaDB collection. Collections are auto-deleted after the session expires (60 minutes).

---

### Step 5: Risk Scoring (How the Percentage Works)

**File:** `app/services/risk_scorer.py`

This is the core of the system. The risk score (0–100) is calculated using a **weighted point system**:

#### Point Values

| Issue Found | Points Added |
|---|---|
| 🔴 Critical red flag (e.g., illegal clause) | **+20 points** |
| 🟡 Medium red flag (e.g., unfair clause) | **+8 points** |
| 🟢 Low red flag (e.g., minor concern) | **+3 points** |
| 🔴 Critical clause MISSING (e.g., no refund policy) | **+15 points** |
| 🟡 Medium clause MISSING | **+5 points** |
| 🟢 Low clause MISSING | **+2 points** |

#### How the Final Score Maps to Risk Level

| Score Range | Risk Level | What It Means |
|---|---|---|
| **0 – 30** | 🟢 LOW | Contract appears mostly fair. Safe to sign. |
| **31 – 60** | 🟡 MEDIUM | Some issues found. Review flagged items carefully. |
| **61 – 100** | 🔴 HIGH | Dangerous contract. Do NOT sign as-is. Seek legal revision. |

#### Example Calculation

Suppose a rental agreement has:
- 2 critical red flags (e.g., deposit > 2 months, no refund timeline) → `2 × 20 = 40`
- 1 medium red flag (e.g., rent increase > 10%) → `1 × 8 = 8`
- 1 critical missing clause (e.g., no registration clause) → `1 × 15 = 15`
- 1 medium missing clause → `1 × 5 = 5`

**Total: 40 + 8 + 15 + 5 = 68 → Risk Level: 🔴 HIGH**

The score is clamped between 0 and 100, so it can never go above 100 or below 0.

---

### Step 6: Red Flag Detection

**File:** `app/services/risk_scorer.py` → `_detect_red_flags()`

This is where the AI brain (Qwen3 235B) analyzes the contract. Here's what happens:

1. The system loads the **relevant Indian Acts** for the contract type (e.g., Model Tenancy Act for rental)
2. It builds a prompt telling the AI: *"You are an Indian legal expert. Find violations of Indian law."*
3. The AI uses **RAG (Retrieval-Augmented Generation)** — it searches the contract chunks for relevant parts and then analyzes them
4. The AI returns a JSON array of red flags, each containing:

```json
{
  "clause_title": "Security Deposit",
  "quoted_text": "Tenant shall pay 6 months as security deposit",
  "violation_type": "Excessive security deposit",
  "law_reference": "Section 11, Model Tenancy Act 2021",
  "severity": "critical",
  "plain_explanation": "Your landlord is asking for 6 months deposit, but the law says maximum 2 months for residential",
  "recommendation": "Negotiate deposit down to 2 months maximum",
  "replacement_clause": "The Security Deposit shall not exceed two (2) months' rent..."
}
```

---

### Step 7: Blindspot Analysis (Missing Clauses)

**File:** `app/services/blindspot_analyzer.py`

Not all problems are in the contract — sometimes the danger is what's **NOT there**. The Blindspot Analyzer:

1. Loads the **standard clauses database** for the contract type (e.g., 8 clauses for rental, 10 for employment)
2. For each standard clause, asks the AI: *"Does this contract have a clause about [X]?"*
3. The AI searches through the contract using RAG and answers YES or NO
4. If NO, that clause is flagged as missing with:
   - What's missing and why it matters
   - Which law requires it
   - A template clause you can add

**Example for Rental:**
```
Missing: "Security Deposit Refund Timeline"
Law: Section 12, Model Tenancy Act 2021
Risk: "Your landlord has no obligation to return deposit on time"
Fix: "The Security Deposit shall be refunded within one (1) month..."
```

---

### Step 8: Safe Clause Detection

**File:** `app/services/risk_scorer.py` → `_detect_safe_clauses()`

The system also highlights what's **good** about the contract — clauses that protect the weaker party. This helps users understand which parts are fair and shouldn't be changed during negotiation.

---

## The Indian Law Database

The backend contains a comprehensive Indian law database:

### Central Acts Registry (`app/data/indian_acts.json`)
- **684 Central Acts** from 1838 to present
- Sourced from [India Code](https://www.indiacode.nic.in)
- Includes act name, year, ministry, and section URLs

### Standard Clauses Database (`app/data/indian_laws/`)

| File | Law | Clauses | Key Protections |
|---|---|:---:|---|
| `rental.json` | Model Tenancy Act 2021 | 8 | Deposit limits, refund timelines, essential services |
| `employment.json` | Labour Codes 2020 | 10 | PF contributions, gratuity, working hours, non-compete |
| `consumer.json` | Consumer Protection Act 2019 | 4 | Refund rights, warranty, product liability |
| `loan.json` | RBI Guidelines | 5 | Interest disclosure, prepayment rights, fair recovery |
| `freelance.json` | Contract Act 1872 & IT Act | 6 | Scope of work, IP rights, payment terms |
| `nda.json` | Indian Contract Act 1872 | 4 | NDA duration, permitted disclosures |
| `startup.json` | Companies Act 2013 | 5 | Equity vesting, anti-dilution, board control |

**Total: 42 standard clauses** across 7 contract types.

---

## Tech Stack

### Backend
| Component | Technology | Purpose |
|---|---|---|
| **API Framework** | FastAPI | REST API with async support |
| **LLM** | Qwen3-235B-A22B (via OpenRouter) | Contract analysis, red flag detection |
| **Vector DB** | ChromaDB (local persistent) | Per-session document storage & retrieval |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Text → vector conversion |
| **Document Parsing** | pymupdf4llm, python-docx, easyocr | PDF/DOCX/image text extraction |
| **Voice** | faster-whisper | Hindi/English voice input |
| **Translation** | deep-translator, argostranslate | Hindi ↔ English translation |
| **Security** | python-magic, cryptography | File validation, magic byte detection |
| **Monitoring** | Prometheus + structlog | Metrics and structured logging |
| **Rate Limiting** | slowapi | API abuse prevention |
| **PDF Reports** | WeasyPrint + Jinja2 | Downloadable PDF analysis reports |

### Frontend
| Component | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Routing** | React Router v7 |

---

## Project Structure

```
backend/
├── main.py                          # FastAPI app entry point
├── config.py                        # Global settings (env vars)
├── requirements.txt                 # Python dependencies
│
├── app/
│   ├── api/
│   │   ├── router.py                # Route registration
│   │   ├── deps.py                  # Dependency injection
│   │   └── routes/
│   │       ├── analyze.py           # POST /api/analyze — main analysis
│   │       ├── query.py             # POST /api/query — follow-up questions
│   │       ├── voice.py             # POST /api/voice/* — voice input
│   │       ├── pushback.py          # POST /api/pushback — legal letter gen
│   │       ├── compare.py           # POST /api/compare — draft comparison
│   │       ├── session.py           # Session management
│   │       └── health.py            # Health checks
│   │
│   ├── services/
│   │   ├── document_parser.py       # PDF/DOCX/DOC/PPTX/OCR/text parsing
│   │   ├── chunker.py              # Clause-aware text splitting
│   │   ├── embedder.py             # sentence-transformers embeddings
│   │   ├── vector_store.py         # ChromaDB wrapper (per-session)
│   │   ├── rag_pipeline.py         # RAG: chunk → embed → retrieve → generate
│   │   ├── ollama_client.py        # OpenRouter LLM client (Qwen3 235B)
│   │   ├── risk_scorer.py          # Risk scoring engine (LLM + rules)
│   │   ├── blindspot_analyzer.py   # Missing clause detector
│   │   ├── indian_acts_lookup.py   # Indian Acts DB querying
│   │   ├── pushback_generator.py   # Legal pushback letter generator
│   │   ├── redline_comparator.py   # Draft comparison engine
│   │   ├── voice_service.py        # Voice → text (Whisper)
│   │   ├── translator.py           # Hindi ↔ English translation
│   │   ├── pdf_report.py           # PDF report generation
│   │   └── ocr_service.py          # EasyOCR wrapper
│   │
│   ├── data/
│   │   ├── indian_acts.json         # 684 Central Acts database
│   │   ├── indian_laws/             # Standard clauses (7 categories)
│   │   ├── prompts/                 # LLM prompt templates
│   │   └── clause_templates/        # Safe clause templates
│   │
│   ├── models/
│   │   ├── responses.py             # API response Pydantic models
│   │   └── internal.py              # Internal data models
│   │
│   ├── security/
│   │   └── file_validator.py        # Upload validation + magic bytes
│   │
│   ├── utils/
│   │   ├── helpers.py               # Utility functions
│   │   ├── logger.py                # Structured logging (structlog)
│   │   ├── metrics.py               # Prometheus metrics
│   │   └── exceptions.py            # Custom exception classes
│   │
│   └── tasks/
│       └── cleanup.py               # Session auto-cleanup (60 min)

frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx              # Homepage
│   │   ├── Dashboard.tsx            # Session summary + history
│   │   ├── Analyze.tsx              # Upload & analyze
│   │   ├── Results.tsx              # Analysis results + document viewer
│   │   ├── IndianLawHub.tsx         # Indian law reference guide
│   │   ├── PushbackGenerator.tsx    # Legal letter generator
│   │   ├── CompareDrafts.tsx        # Draft comparison
│   │   └── VoiceAssistant.tsx       # Hindi voice assistant
│   │
│   ├── services/
│   │   ├── api.ts                   # Backend API client
│   │   └── mockApi.ts               # Mock data for development
│   │
│   └── components/                  # Shared UI components
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Upload document + get full risk analysis |
| `POST` | `/api/query` | Ask follow-up questions about analyzed contract |
| `POST` | `/api/voice/transcribe` | Transcribe Hindi/English voice input |
| `POST` | `/api/voice/ask` | Voice-based contract questions |
| `POST` | `/api/pushback` | Generate legal pushback letter |
| `POST` | `/api/compare` | Compare two contract drafts |
| `GET`  | `/api/session/{id}` | Get session info |
| `DELETE` | `/api/session/{id}` | Delete session & data |
| `GET`  | `/api/health` | Health check |
| `GET`  | `/metrics` | Prometheus metrics |

---

## Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (for Qwen3-235B)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The frontend runs on `http://localhost:5173`, the backend on `http://localhost:8000`.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | LLM model to use | `qwen/qwen3-235b-a22b` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |
| `SESSION_TTL_MINUTES` | Session lifetime | `60` |
| `CHROMA_PERSIST_DIR` | ChromaDB storage path | `./chroma_data` |
| `LLM_TEMPERATURE` | AI creativity level | `0.3` |
| `LLM_MAX_TOKENS` | Max response length | `4096` |
| `LLM_TIMEOUT` | API timeout in seconds | `120` |

---

## 🔐 Privacy & Security

- **No accounts needed** — completely sessionless
- **Auto-delete** — all data (documents, vectors, analysis) is deleted after 60 minutes
- **No external storage** — everything runs locally (ChromaDB is local)
- **File validation** — magic byte verification prevents malicious uploads
- **Rate limiting** — prevents API abuse

---

## 📄 License

Built for **Hack-JKLU 2026** hackathon.

---

> *"The law should be accessible to everyone, not just those who can afford a lawyer."*
