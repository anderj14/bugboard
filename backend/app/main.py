from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.database.connection import engine, Base
from app.routers import bugs
from app.routers import metrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
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
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred",
        },
    )

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
