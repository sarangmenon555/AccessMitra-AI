from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import query, schemes, eligibility, jobs, rights, checklist, explore, feedback, ingest

app = FastAPI(title="AccessMitra AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(schemes.router, prefix="/api")
app.include_router(eligibility.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(rights.router, prefix="/api")
app.include_router(checklist.router, prefix="/api")
app.include_router(explore.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "service": "accessmitra-ai"}