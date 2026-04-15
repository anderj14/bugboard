import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Enum, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base

class SeverityLevel(PyEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class BugStatus(PyEnum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class Bug(Base):
    __tablename__ = "bugs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # user writed fields
    raw_description = Column(Text, nullable=False)
    reporter_email = Column(String(255), nullable=True)
    reporter_name = Column(String(100), nullable=True)
    source_app = Column(String(100), nullable=True)

    # Automatic Context from browser
    browser = Column(String(100), nullable=True)
    operating_system = Column(String(100), nullable=True)
    current_url = Column(String(500), nullable=True)
    screen_resolution = Column(String(50), nullable=True)

    # AI Enriched Fields
    title = Column(String(255), nullable=True)
    severity = Column(Enum(SeverityLevel), nullable=True, index=True)
    module = Column(String(100), nullable=True, index=True)
    reproduction_steps = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_confidence = Column(Integer, nullable=True)

    # Dupplicate detection
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(UUID(as_uuid=True), nullable=True)

    # Status
    status = Column(Enum(BugStatus), default=BugStatus.OPEN, nullable=False, index=True)
    is_ai_classified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Bug {self.id} [{self.severity}] {self.title}>"

