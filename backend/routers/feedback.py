from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

feedback_store: list[dict] = []

class FeedbackRequest(BaseModel):
    query: str
    answer: str
    rating: int
    comment: str = ""

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    if req.rating not in [1, 2, 3, 4, 5]:
        return {"error": "Rating must be between 1 and 5"}
    feedback_store.append({
        "query": req.query,
        "rating": req.rating,
        "comment": req.comment,
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"status": "received", "total_feedback": len(feedback_store)}

@router.get("/feedback/stats")
def get_stats():
    if not feedback_store:
        return {"total": 0, "average_rating": 0}
    avg = sum(f["rating"] for f in feedback_store) / len(feedback_store)
    return {"total": len(feedback_store), "average_rating": round(avg, 2)}
