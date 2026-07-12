# AccessMitra AI — Your AI Companion for Opportunities

AI-powered RAG assistant helping differently-abled individuals in India navigate government schemes, legal rights, jobs, and opportunities. Every answer is grounded in verified official sources — no hallucinated scheme details.

Built for the AI Apocalypse hackathon.

## The Problem

India has an estimated 4-5 crore differently-abled persons. Government schemes exist — UDID, Niramaya, NHFDC, ADIP, RPWD Act reservations — but they are scattered across 12+ ministries, written in bureaucratic language, and nearly impossible to navigate without expert help. AccessMitra solves this.

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI |
| LLM | Groq — llama-3.3-70b-versatile |
| Vector DB | Pinecone (free tier) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Orchestration | LangChain |
| Frontend | Next.js 14 + Tailwind CSS |
| Deployment | Render (backend) + Vercel (frontend) |

## Data Sources

All grounded in verified public documents:

- MSJE (Ministry of Social Justice & Empowerment) scheme documents
- RPWD Act 2016 full text
- National Trust scheme documents (Niramaya, AASRA)
- NHFDC loan scheme guidelines
- National Scholarship Portal scheme details
- ALIMCO ADIP scheme guidelines
- Wikipedia articles on disability policy in India (30+ articles)
- Census 2011 disability statistics

## Features

- **Ask AI** — RAG chat over verified disability scheme documents
- **Eligibility Finder** — 5-question form that matches you to eligible schemes instantly
- **Scheme Explorer** — All 10+ central schemes explained in plain language
- **Your Rights** — RPWD Act 2016 rights simplified and actionable
- **Jobs & Employment** — Reservation details, NCS portal, recruitment resources
- **Document Checklist** — Exact documents and step-by-step application guide per scheme
- **Topic Explorer** — Deep-dive overviews on UDID, health, finance, education, employment
- Source citations on every AI answer
- Confidence score per response
- Answer rating system

## Setup

### 1. Ingest Knowledge Base (run once on Day 1)

```powershell
cd scripts
pip install -r requirements.txt --break-system-packages
copy .env.example .env
# Add PINECONE_API_KEY and PINECONE_INDEX_NAME to .env
python ingest.py
```

### 2. Backend

```powershell
cd backend
pip install -r requirements.txt --break-system-packages
copy .env.example .env
# Add GROQ_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME
uvicorn main:app --reload --port 8000
```

Test:
```powershell
curl http://localhost:8000/health
```

### 3. Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`

## Deployment

### Backend — Render
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`

### Frontend — Vercel
- Root directory: `frontend`
- Framework: Next.js
- Env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/query` | RAG query over scheme knowledge base |
| GET | `/api/schemes` | All schemes with filters |
| GET | `/api/schemes/{id}` | Single scheme details |
| POST | `/api/eligibility` | Match user profile to eligible schemes |
| GET | `/api/rights` | RPWD Act 2016 rights |
| GET | `/api/rights/{id}` | Single right detail |
| GET | `/api/checklist/{scheme_id}` | Document checklist + application steps |
| GET | `/api/jobs` | Employment resources and portals |
| GET | `/api/explore/{topic}` | AI-generated topic overview |
| POST | `/api/feedback` | Submit answer rating |
| GET | `/health` | Health check |
