import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import AsyncMock
from contextlib import asynccontextmanager

from app.database.connection import Base, get_db
from app.main import app
from app.models.bug import BugStatus, SeverityLevel

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def override_lifespan(_app):
    yield


app.lifespan = override_lifespan


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def mock_ollama():
    mock = AsyncMock()
    mock.return_value = {
        "title": "Login button not working",
        "severity": "high",
        "module": "auth",
        "reproduction_steps": "1. Go to login page 2. Click login button 3. Nothing happens",
        "suggested_fix": "Check button event handler binding",
        "ai_summary": "Login button is unresponsive on the login page",
        "ai_confidence": 85,
    }
    return mock


def create_test_bug(db, **overrides):
    from app.models.bug import Bug
    import uuid
    from datetime import datetime, timezone

    defaults = {
        "id": uuid.uuid4(),
        "raw_description": "Test bug description",
        "title": "Test bug",
        "severity": SeverityLevel.LOW,
        "module": "ui",
        "status": BugStatus.OPEN,
        "is_duplicate": False,
        "created_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    bug = Bug(**defaults)
    db.add(bug)
    db.commit()
    db.refresh(bug)
    return bug
