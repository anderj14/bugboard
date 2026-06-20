from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database.connection import get_db
from app.models.bug import Bug, BugStatus
from app.schemas.bug import CreateBugRequest, BugResponse, UpdateStatusRequest
from app.services.ollama import classify_bug
from app.core.limiter import limiter

router = APIRouter()

def find_duplicate(db: Session, module: str, title: str, exclude_id=None) -> Bug | None:
    "Find a duplicate bug based on module and title similarity"
    if not module or not title:
        return None
    
    existing = db.query(Bug).filter(
        Bug.module == module,
        Bug.is_duplicate == False,
        Bug.status != BugStatus.CLOSED
    ).all()

    title_words = set(title.lower().split())

    for bug in existing:
        if exclude_id and bug.id == exclude_id:
            continue
        if not bug.title:
            continue
        bug_words = set(bug.title.lower().split())
        common = title_words & bug_words
        if len(common) / max(len(title_words), 1) > 0.4:  # 40% word overlap
            return bug
        
    return None

# This endpoint receives a bug report, classifies it using the Ollama API, and saves it to the database
@router.post("/", response_model=BugResponse, status_code=201)
@limiter.limit("10/minute")
async def create_bug(payload: CreateBugRequest, request: Request, db: Session = Depends(get_db)):
    try:
        context_dict = payload.context.model_dump() if payload.context else None
        classification = await classify_bug(payload.raw_description, context_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")
    
    bug = Bug(
        raw_description=payload.raw_description,
        reporter_email=payload.reporter_email,
        reporter_name=payload.reporter_name,
        source_app=payload.source_app,

        browser=payload.context.browser if payload.context else None,
        operating_system=payload.context.operating_system if payload.context else None,
        current_url=payload.context.current_url if payload.context else None,
        screen_resolution=payload.context.screen_resolution if payload.context else None,

        title=classification.get("title"),
        severity=classification.get("severity").upper(),
        module=classification.get("module").lower(),
        reproduction_steps=classification.get("reproduction_steps"),
        suggested_fix=classification.get("suggested_fix"),
        ai_summary=classification.get("ai_summary"),
        ai_confidence=classification.get("ai_confidence"),
        is_ai_classified=True,
        status=BugStatus.OPEN,
    )

    duplicate = find_duplicate(db, bug.module, bug.title)
    if duplicate:
        bug.is_duplicate = True
        bug.duplicate_of_id = duplicate.id
    
    db.add(bug)
    db.commit()
    db.refresh(bug)

    return bug

# This endpoint returns a list of all bug reports, with optional filters for status and severity
@router.get("/", response_model=List[BugResponse])
def get_bugs(
    severity: str = None,
    status: str = None,
    module: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bug)

    if severity:
        query = query.filter(Bug.severity == severity)
    if status:
        query = query.filter(Bug.status == status)
    if module:
        query = query.filter(Bug.module == module)

    return query.order_by(Bug.created_at.desc()).all()

# This endpoint returns a single bug report by its ID
@router.get("/{bug_id}", response_model=BugResponse)
def get_bug(bug_id: UUID, db: Session = Depends(get_db)):
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug

# This endpoint updates the status of a bug report
@router.patch("/{bug_id}/status", response_model=BugResponse)
def update_status(bug_id: UUID, payload: UpdateStatusRequest, db: Session = Depends(get_db)):
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    bug.status = payload.status

    db.commit()
    db.refresh(bug)
    return bug

# This endpoint allows users to preview the AI classification of a bug report without saving it to the database
@router.post("/preview", response_model=BugResponse, status_code=200)
@limiter.limit("20/minute")
async def preview_bug(payload: CreateBugRequest, request: Request, db: Session = Depends(get_db)):
    try:
        context_dict = payload.context.model_dump() if payload.context else None
        classification = await classify_bug(payload.raw_description, context_dict)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {str(e)}")
    
    #response a temporary bug without id
    from uuid import uuid4
    from datetime import datetime, timezone
    
    return {
        "id": uuid4(),
        "raw_description": payload.raw_description,
        "title": classification.get("title"),
        "severity": classification.get("severity").upper(),
        "module": classification.get("module").lower(),
        "reproduction_steps": classification.get("reproduction_steps"),
        "suggested_fix": classification.get("suggested_fix"),
        "ai_summary": classification.get("ai_summary"),
        "ai_confidence": classification.get("ai_confidence"),
        "status": "Open",
        "is_duplicate": False,
        "browser": None,
        "operating_system": None,
        "current_url": None,
        "created_at": datetime.now(timezone.utc),
    }