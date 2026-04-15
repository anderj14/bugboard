from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import engine, Base
from app.routers import bugs

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("BugBoard database tables created successfully.")
    print(f"Ollama in {settings.OLLAMA_BASE_URL}")
    print(f"Model in {settings.OLLAMA_MODEL}")
    yield
    print("Shutting down BugBoard...")

app = FastAPI(
    title="BugBoard API",
    description="API for BugBoard - AI-powered bug reporting and management system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bugs.router, prefix="/api/bugs", tags=["bugs"])

@app.get("/")
def root():
    return {
        "app": "BugBoard",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "ollama": settings.OLLAMA_BASE_URL,
        "model": settings.OLLAMA_MODEL,
    }
