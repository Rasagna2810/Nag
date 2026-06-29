from functools import lru_cache
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import SentenceTransformer
from core.config import get_settings

settings = get_settings()


@lru_cache()
def get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.2,
        max_output_tokens=8192
        
    )


@lru_cache()
def _get_embedder() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(text: str) -> list[float]:
    """Return a 384-dim embedding vector for the given text."""
    return _get_embedder().encode(text).tolist()