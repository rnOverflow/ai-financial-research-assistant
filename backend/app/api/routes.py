"""
API routes: upload, Q&A, summarize, compare, insights, investment memo
"""
from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.models.schemas import (
    QuestionRequest, CompareRequest, AnalysisResponse,
    DocumentInfo, FinancialInsights
)
from app.services import document_service as ds
from app.services import llm_service as llm
from app.core.config import get_settings

router = APIRouter(prefix="/api", tags=["Financial Research"])
settings = get_settings()


# ── Upload ─────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=dict)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(413, f"File too large. Max {settings.max_upload_size_mb}MB.")

    try:
        doc_id = ds.ingest_document(content, file.filename)
        doc = ds.get_document(doc_id)
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "chunk_count": doc["chunk_count"],
            "char_count": doc["char_count"],
            "message": "Document processed successfully.",
        }
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")


# ── List / Delete ──────────────────────────────────────────────────────────

@router.get("/documents", response_model=List[DocumentInfo])
async def list_documents():
    return ds.list_documents()


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    if ds.delete_document(doc_id):
        return {"message": "Document deleted."}
    raise HTTPException(404, "Document not found.")


# ── Q&A ───────────────────────────────────────────────────────────────────

@router.post("/ask", response_model=AnalysisResponse)
async def ask_question(req: QuestionRequest):
    doc = ds.get_document(req.doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    chunks = ds.retrieve_chunks(req.doc_id, req.question)
    if not chunks:
        raise HTTPException(422, "Could not retrieve relevant context.")

    answer = llm.answer_question(req.question, chunks, doc["filename"])
    return AnalysisResponse(
        result=answer,
        doc_id=req.doc_id,
        filename=doc["filename"],
    )


# ── Summarize ──────────────────────────────────────────────────────────────

@router.get("/summarize/{doc_id}", response_model=AnalysisResponse)
async def summarize(doc_id: str):
    doc = ds.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    summary = llm.summarize_document(doc["raw_text"], doc["filename"])
    return AnalysisResponse(
        result=summary,
        doc_id=doc_id,
        filename=doc["filename"],
    )


# ── Financial Insights ────────────────────────────────────────────────────

@router.get("/insights/{doc_id}", response_model=FinancialInsights)
async def get_insights(doc_id: str):
    doc = ds.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    return FinancialInsights(
        doc_id=doc_id,
        filename=doc["filename"],
        risks=doc["risks"],
        guidance=doc["guidance"],
        metrics=doc["metrics"],
        sentiment=doc["sentiment"],
    )


# ── Investment Memo ───────────────────────────────────────────────────────

@router.get("/memo/{doc_id}", response_model=AnalysisResponse)
async def investment_memo(doc_id: str):
    doc = ds.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    summary = llm.summarize_document(doc["raw_text"], doc["filename"])
    memo = llm.generate_investment_memo(
        filename=doc["filename"],
        summary=summary,
        risks=doc["risks"],
        guidance=doc["guidance"],
        metrics=doc["metrics"],
        sentiment=doc["sentiment"],
    )
    return AnalysisResponse(
        result=memo,
        doc_id=doc_id,
        filename=doc["filename"],
    )


# ── Compare ───────────────────────────────────────────────────────────────

@router.post("/compare", response_model=AnalysisResponse)
async def compare_documents(req: CompareRequest):
    doc1 = ds.get_document(req.doc_id_1)
    doc2 = ds.get_document(req.doc_id_2)

    if not doc1:
        raise HTTPException(404, f"Document {req.doc_id_1} not found.")
    if not doc2:
        raise HTTPException(404, f"Document {req.doc_id_2} not found.")

    chunks_map = ds.retrieve_chunks_multi(
        [req.doc_id_1, req.doc_id_2], req.query
    )

    result = llm.compare_documents(
        query=req.query,
        doc1_chunks=chunks_map[req.doc_id_1],
        doc1_name=doc1["filename"],
        doc2_chunks=chunks_map[req.doc_id_2],
        doc2_name=doc2["filename"],
    )
    return AnalysisResponse(result=result)


# ── Entity Extraction ─────────────────────────────────────────────────────

@router.get("/entities/{doc_id}", response_model=AnalysisResponse)
async def extract_entities(doc_id: str):
    doc = ds.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found.")

    result = llm.extract_entities(doc["raw_text"])
    return AnalysisResponse(
        result=result,
        doc_id=doc_id,
        filename=doc["filename"],
    )


# ── Health check ──────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "model": settings.groq_model}
