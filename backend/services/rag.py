from groq import Groq
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from config import settings

groq_client = Groq(api_key=settings.groq_api_key)
pc = Pinecone(api_key=settings.pinecone_api_key)

_index = None
_embedder = None

def get_index():
    global _index
    if _index is None:
        _index = pc.Index(settings.pinecone_index_name)
    return _index

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(settings.embedding_model)
    return _embedder

SYSTEM_PROMPT = """You are AccessMitra AI, a compassionate and knowledgeable assistant dedicated exclusively to helping differently-abled individuals in India navigate government schemes, jobs, legal rights, and opportunities.

You assist with:
- Central and state government schemes for differently-abled people
- RPWD Act 2016 rights and entitlements
- UDID card registration process
- Job reservations and employment opportunities
- NHFDC loans and financial assistance
- Niramaya health insurance scheme
- Scholarship schemes for differently-abled students
- Accessible India Campaign
- Application procedures and document requirements

Rules:
- Always use the term "differently-abled" instead of "disabled" or "handicapped"
- Ground every answer strictly in the retrieved context. Never hallucinate scheme details, amounts, or eligibility criteria
- If context is insufficient, say so clearly rather than guessing
- Be warm, encouraging, and patient in tone
- Always mention eligibility criteria when discussing schemes
- Always mention how to apply when explaining a scheme
- Cite source documents at the end of every response
- If asked about state-specific schemes, mention that state portals may have additional schemes beyond what is covered
- Amounts and percentages mentioned should only be from the retrieved context"""

def embed_query(text: str) -> list[float]:
    return get_embedder().encode(text).tolist()

def retrieve_context(query: str, top_k: int = None, filter_category: str = None) -> list[dict]:
    k = top_k or settings.top_k
    vector = embed_query(query)
    filter_dict = {"category": {"$eq": filter_category}} if filter_category else None
    results = get_index().query(vector=vector, top_k=k, include_metadata=True, filter=filter_dict)
    chunks = []
    for match in results.matches:
        chunks.append({
            "score": round(match.score, 3),
            "text": match.metadata.get("text", ""),
            "source": match.metadata.get("source", "Unknown"),
            "category": match.metadata.get("category", "general"),
        })
    return chunks

def format_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks):
        parts.append(f"[{i+1}] Source: {chunk['source']}\n{chunk['text']}")
    return "\n\n".join(parts)

def generate_answer(query: str, chunks: list[dict], system_override: str = None) -> dict:
    context = format_context(chunks)
    system = system_override or SYSTEM_PROMPT
    user_message = f"""Context from AccessMitra knowledge base:
{context}

Question: {query}

Answer based strictly on the context above. Be warm, clear, and actionable."""

    response = groq_client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=1024,
    )

    answer = response.choices[0].message.content
    sources = list({chunk["source"] for chunk in chunks})
    categories = list({chunk["category"] for chunk in chunks})

    return {
        "answer": answer,
        "sources": sources,
        "categories": categories,
        "confidence": round(sum(c["score"] for c in chunks) / len(chunks), 3) if chunks else 0,
        "chunks_used": len(chunks),
    }