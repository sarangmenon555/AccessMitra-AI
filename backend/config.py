from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str = "accessmitra-ai"
    hf_api_key: str
    hf_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    groq_model: str = "llama-3.3-70b-versatile"
    top_k: int = 6

    class Config:
        env_file = ".env"

settings = Settings()