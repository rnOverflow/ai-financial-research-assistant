# AI Financial Research Assistant

> RAG-powered document intelligence for financial reports, 10-Ks, and earnings transcripts.

Built with **FastAPI · FAISS · Groq (LLaMA 3 70B) · React · Vite**

---

## Features

| Feature | Description |
|---|---|
|  **PDF Ingestion** | Upload 10-Ks, earnings transcripts, financial news (up to 50MB) |
|  **Research Chat** | RAG-powered Q&A — retrieves relevant passages before answering |
|  **Financial Insights** | Auto-extracts risk factors, forward guidance, financial metrics |
|  **Sentiment Analysis** | Rule-based finance sentiment scoring on full document |
|  **Investment Memo** | AI generates buy/hold/sell analyst note with bull/bear case |
|  **Entity Extraction** | Identifies companies, executives, financial figures |
|  **Compare Mode** | Side-by-side analysis of two documents on any dimension |
|  **Executive Summary** | Structured summary of any uploaded report |

## Tech Stack

- **Backend**: FastAPI, FAISS (vector search), Sentence Transformers (embeddings), Groq API (LLaMA 3 70B), PyMuPDF (PDF parsing)
- **Frontend**: React 18, Vite, react-dropzone, react-markdown

## Quick Start

### 1. Clone & set up backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

Get a free Groq API key at: https://console.groq.com

### 2. Run backend

```bash
cd backend
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

### 3. Set up & run frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173

## Project Structure

```
ai-financial-research-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/routes.py        # All API endpoints
│   │   ├── services/
│   │   │   ├── document_service.py  # PDF → FAISS pipeline
│   │   │   └── llm_service.py       # Groq LLM prompts
│   │   ├── models/schemas.py    # Pydantic models
│   │   └── core/config.py       # Settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── UploadPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── InsightsPage.jsx
│   │   │   └── ComparePage.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Toast.jsx
│   │   └── utils/api.js
│   └── package.json
└── README.md
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload and index a PDF |
| GET | `/api/documents` | List all documents |
| POST | `/api/ask` | Ask a question (RAG) |
| GET | `/api/summarize/{id}` | Executive summary |
| GET | `/api/insights/{id}` | Risks, guidance, metrics, sentiment |
| GET | `/api/memo/{id}` | Investment memo |
| GET | `/api/entities/{id}` | Entity extraction |
| POST | `/api/compare` | Compare two documents |

## Resume Bullet Points

```
• Built RAG pipeline using FAISS vector search and Sentence Transformers to enable semantic 
  Q&A over 50MB+ financial PDFs, achieving sub-second retrieval across 1,000+ document chunks

• Engineered financial NLP pipeline extracting risk factors, forward guidance, and metrics 
  from 10-K filings using custom regex patterns and rule-based sentiment analysis

• Developed LLM-powered investment memo generator using Groq's LLaMA 3 70B API, producing 
  structured buy/hold/sell recommendations with bull/bear case analysis

• Architected full-stack platform with FastAPI backend and React/Vite frontend, supporting 
  multi-document comparative analysis across earnings transcripts and annual reports
```
