from fastapi import APIRouter
from services.rag import retrieve_context, generate_answer

router = APIRouter()

EXPLORE_QUERIES = {
    "udid": "What is the UDID card, how do I apply for it, and why is it important for differently-abled persons in India?",
    "schemes": "What are the main government schemes available for differently-abled persons in India under MSJE?",
    "rpwd": "Explain the Rights of Persons with Disabilities Act 2016 and what rights it gives differently-abled persons.",
    "jobs": "What employment opportunities and reservations are available for differently-abled persons in India?",
    "education": "What educational scholarships and rights are available for differently-abled students in India?",
    "health": "What health insurance and medical schemes are available for differently-abled persons in India?",
    "finance": "What financial assistance and loan schemes are available for differently-abled persons in India?",
    "nhfdc": "How does NHFDC help differently-abled persons? What loans are available and how to apply?",
}

@router.get("/explore")
def get_explore_topics():
    return {"topics": list(EXPLORE_QUERIES.keys())}

@router.get("/explore/{topic}")
def explore_topic(topic: str):
    if topic not in EXPLORE_QUERIES:
        return {"error": f"Topic '{topic}' not available"}
    query = EXPLORE_QUERIES[topic]
    chunks = retrieve_context(query, top_k=8)
    if not chunks:
        return {"error": "No content found for this topic"}
    result = generate_answer(query, chunks)
    result["topic"] = topic
    return result
