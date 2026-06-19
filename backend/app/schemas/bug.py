from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class BugContext (BaseModel):
    "Automatic context for a bug report"
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    current_url: Optional[str] = None
    screen_resolution: Optional[str] = None

# This is the schema for creating a bug report
class CreateBugRequest(BaseModel):
    raw_description: str
    reporter_email: Optional[str] = None
    reporter_name: Optional[str] = None
    source_app: Optional[str] = None
    context: Optional[BugContext] = None

class UpdateStatusRequest(BaseModel):
    status: str


# This is the schema for the response when a bug report is created
class BugResponse(BaseModel):
    id: UUID
    raw_description: str
    title: Optional[str] = None
    severity: Optional[str] = None
    module: Optional[str] = None
    reproduction_steps: Optional[str] = None
    suggested_fix: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: str
    is_duplicate: bool
    duplicate_of_id: Optional[UUID] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    current_url: Optional[str] = None
    screen_resolution: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    source_app: Optional[str] = None
    is_ai_classified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True