from typing import Optional, List
from pydantic import BaseModel
from typing import Optional, List, Dict


class QuestionRequest(BaseModel):
    doc_id: str
    question: str


class CompareRequest(BaseModel):
    doc_id_1: str
    doc_id_2: str
    query: str


class AnalysisResponse(BaseModel):
    result: str
    doc_id: Optional[str] = None
    filename: Optional[str] = None


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    char_count: int
    chunk_count: int


class FinancialInsights(BaseModel):
    doc_id: str
    filename: str
    risks: List[str]
    guidance: List[str]
    metrics: Dict
    sentiment: Dict
