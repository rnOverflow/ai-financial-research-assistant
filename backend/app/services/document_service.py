"""
Document processing: PDF ingestion → chunking → embedding → FAISS index
"""
import re
import uuid
import json
import math
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Optional
import numpy as np

import fitz  # pymupdf
import faiss
from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

settings = get_settings()

# ── In-memory store (replace with Redis/DB in production) ──────────────────
_store: Dict[str, dict] = {}   # doc_id → metadata + chunks
_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


# ── PDF helpers ────────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text("text"))
    doc.close()
    return "\n".join(pages)


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Sentence-aware sliding window chunker."""
    # Split into sentences first
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current, current_len = [], [], 0

    for sent in sentences:
        wc = len(sent.split())
        if current_len + wc > chunk_size and current:
            chunks.append(" ".join(current))
            # Overlap: keep last N words
            overlap_words = " ".join(current).split()[-overlap:]
            current = [" ".join(overlap_words)]
            current_len = len(overlap_words)
        current.append(sent)
        current_len += wc

    if current:
        chunks.append(" ".join(current))

    return [c.strip() for c in chunks if c.strip()]


# ── Finance extraction helpers ─────────────────────────────────────────────

RISK_KEYWORDS = [
    "risk", "uncertainty", "litigation", "regulatory", "competition",
    "volatility", "adverse", "exposure", "default", "inflation",
    "cybersecurity", "climate", "geopolitical", "supply chain",
    "interest rate", "foreign exchange", "fx", "credit risk"
]

GUIDANCE_KEYWORDS = [
    "expect", "anticipate", "forecast", "outlook", "guidance",
    "project", "estimate", "target", "aim", "plan to",
    "next year", "next quarter", "going forward", "full year"
]

METRIC_PATTERNS = {
    "revenue": r'\$[\d,\.]+\s*(?:billion|million|B|M)?\s*(?:in\s*)?(?:revenue|net\s*revenue|total\s*revenue)',
    "eps": r'(?:EPS|earnings per share)\s*(?:of\s*)?\$?[\d\.]+',
    "ebitda": r'EBITDA\s*(?:of\s*)?\$?[\d,\.]+\s*(?:billion|million|B|M)?',
    "margin": r'(?:gross|operating|net)\s*margin\s*(?:of\s*)?[\d\.]+\s*%',
    "yoy": r'(?:increased?|decreased?|grew?|declined?)\s*(?:by\s*)?[\d\.]+\s*%',
}


def extract_risks(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    risks = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw in s_lower for kw in RISK_KEYWORDS):
            cleaned = s.strip()
            if len(cleaned) > 40:
                risks.append(cleaned)
    # Deduplicate similar entries
    seen, unique = set(), []
    for r in risks:
        key = r[:60]
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique[:20]


def extract_guidance(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    guidance = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw in s_lower for kw in GUIDANCE_KEYWORDS):
            cleaned = s.strip()
            if len(cleaned) > 40:
                guidance.append(cleaned)
    seen, unique = set(), []
    for g in guidance:
        key = g[:60]
        if key not in seen:
            seen.add(key)
            unique.append(g)
    return unique[:15]


def extract_metrics(text: str) -> Dict[str, List[str]]:
    results = {}
    for metric, pattern in METRIC_PATTERNS.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            results[metric] = list(set(matches))[:5]
    return results


def compute_sentiment(text: str) -> dict:
    """Simple rule-based finance sentiment (avoids heavy dependency)."""
    positive = ["growth", "record", "strong", "beat", "exceeded", "surpassed",
                "increased", "improvement", "robust", "momentum", "profitable",
                "dividend", "buyback", "raised guidance", "outperform"]
    negative = ["decline", "miss", "below expectations", "headwind", "challenging",
                "restructuring", "impairment", "loss", "writedown", "layoff",
                "reduced guidance", "uncertainty", "weak", "slowdown"]

    text_lower = text.lower()
    pos_count = sum(text_lower.count(w) for w in positive)
    neg_count = sum(text_lower.count(w) for w in negative)
    total = pos_count + neg_count or 1

    score = (pos_count - neg_count) / total  # -1 to 1
    if score > 0.15:
        label = "Positive"
    elif score < -0.15:
        label = "Negative"
    else:
        label = "Neutral"

    return {
        "label": label,
        "score": round(score, 3),
        "positive_signals": pos_count,
        "negative_signals": neg_count,
    }


# ── Main ingest function ───────────────────────────────────────────────────

def ingest_document(pdf_bytes: bytes, filename: str) -> str:
    """Process PDF and store embeddings. Returns doc_id."""
    doc_id = hashlib.md5(pdf_bytes).hexdigest()[:12]

    if doc_id in _store:
        return doc_id  # Already processed

    raw_text = extract_text_from_pdf(pdf_bytes)
    chunks = chunk_text(raw_text, settings.chunk_size, settings.chunk_overlap)

    model = _get_model()
    embeddings = model.encode(chunks, show_progress_bar=False, normalize_embeddings=True)
    embeddings_np = np.array(embeddings, dtype="float32")

    dim = embeddings_np.shape[1]
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine for normalized vecs)
    index.add(embeddings_np)

    _store[doc_id] = {
        "doc_id": doc_id,
        "filename": filename,
        "raw_text": raw_text,
        "chunks": chunks,
        "embeddings": embeddings_np,
        "index": index,
        "char_count": len(raw_text),
        "chunk_count": len(chunks),
        "risks": extract_risks(raw_text),
        "guidance": extract_guidance(raw_text),
        "metrics": extract_metrics(raw_text),
        "sentiment": compute_sentiment(raw_text),
    }

    return doc_id


def get_document(doc_id: str) -> Optional[dict]:
    return _store.get(doc_id)


def list_documents() -> list[dict]:
    return [
        {
            "doc_id": v["doc_id"],
            "filename": v["filename"],
            "char_count": v["char_count"],
            "chunk_count": v["chunk_count"],
        }
        for v in _store.values()
    ]


def retrieve_chunks(doc_id: str, query: str, top_k: int = None) -> List[str]:
    """FAISS semantic search over a document's chunks."""
    doc = _store.get(doc_id)
    if not doc:
        return []

    k = top_k or settings.top_k_results
    model = _get_model()
    q_emb = model.encode([query], normalize_embeddings=True).astype("float32")

    scores, indices = doc["index"].search(q_emb, min(k, len(doc["chunks"])))
    return [doc["chunks"][i] for i in indices[0] if i >= 0]


def retrieve_chunks_multi(doc_ids: List[str], query: str, top_k: int = None) -> Dict[str, List[str]]:
    """Retrieve from multiple docs for comparison."""
    return {did: retrieve_chunks(did, query, top_k) for did in doc_ids}


def delete_document(doc_id: str) -> bool:
    if doc_id in _store:
        del _store[doc_id]
        return True
    return False
