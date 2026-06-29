from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from core.database import startup_db
from api.auth import router as auth_router
from api.customers import router as customers_router
from api.analysis import router as analysis_router
from api.knowledge import router as knowledge_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀  NBA Platform — starting up")
    await startup_db()
    print("✅  Databases ready")
    yield
    print("🛑  NBA Platform — shutting down")


app = FastAPI(
    title="Next Best Action Platform",
    description="Enterprise Agentic Decision Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(analysis_router,  prefix="/api")
app.include_router(knowledge_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {
        "status":   "ok",
        "platform": "Next Best Action Platform",
        "version":  "1.0.0",
    }