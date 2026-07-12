from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import retrieve_context, generate_answer

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    top_k: int = 6
    category: str | None = None

class QueryResponse(BaseModel):
    answer: str
    sources: list[str]
    categories: list[str]
    confidence: float
    chunks_used: int

@router.post("/query", response_model=QueryResponse)
def query_endpoint(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if len(req.query) > 600:
        raise HTTPException(status_code=400, detail="Query too long")
    chunks = retrieve_context(req.query, top_k=req.top_k, filter_category=req.category)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant information found")
    result = generate_answer(req.query, chunks)
    return result
