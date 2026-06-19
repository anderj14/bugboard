from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.bug import Bug, BugStatus, SeverityLevel

router = APIRouter()

"General summary for the dashboard cards"
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Bug).count()
    open_bugs = db.query(Bug).filter(Bug.status == BugStatus.OPEN).count()
    resolved = db.query(Bug).filter(Bug.status == BugStatus.RESOLVED).count()
    critical = db.query(Bug).filter(Bug.severity == SeverityLevel.CRITICAL).count()
    
    return {
        "total": total,
        "open": open_bugs,
        "resolved": resolved,
        "critical": critical
    }

"Number of bugs by severity"
@router.get("/by-severity")
def by_severity(db: Session = Depends(get_db)):
    results = (
        db.query(Bug.severity, func.count(Bug.id))
        .group_by(Bug.severity)
        .all()
    )
    return [{"severity": r[0].value if r[0] else "unknown", "count": r[1]} for r in results]

"Number of bugs per module"
@router.get("/by-module")
def by_module(db: Session = Depends(get_db)):
    results = (
        db.query(Bug.module, func.count(Bug.id))
            .group_by(Bug.module)
            .all()
    )
    
    return [{"module": r[0] or "unknown", "count": r[1]} for r in results]

"Number of bugs per state"
@router.get("/by-status")
def by_status(db: Session = Depends(get_db)):
    results = (
        db.query(Bug.status, func.count(Bug.id))
            .group_by(Bug.status)
            .all()
    )
    
    return [{"status": r[0].value if r[0] else "unknown", "count": r[1]} for r in results]

"Bugs per day — last 30 days"
@router.get("/timeline")
def timeline(db: Session = Depends(get_db)):
    results = (
        db.query (
            func.date(Bug.created_at).label("date"),
            func.count(Bug.id).label("count")
        )
        .group_by(func.date(Bug.created_at))
        .order_by(func.date(Bug.created_at))
        .limit(30)
        .all()
    )
    return [{"date": str(r.date), "count": r.count} for r in results]
