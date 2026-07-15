from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CrisisEventBase(BaseModel):
    crisis_type: str
    severity: str
    confidence: float
    location_name: Optional[str] = None
    country_iso: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    magnitude: Optional[float] = None
    casualties: Optional[int] = None
    raw_text: str
    source_name: str
    source_type: str
    trust_score: float
    source_count: int = 1
    official_confirmed: bool = False
    event_date: Optional[datetime] = None

class CrisisEventCreate(CrisisEventBase):
    pass

class CrisisEvent(CrisisEventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CrisisEventResponse(BaseModel):
    events: List[CrisisEvent]
    total_count: int
    high_confidence_count: int
    verified_count: int
    by_type: dict
    by_severity: dict
    by_country: dict

class UserSession(BaseModel):
    id: Optional[int] = None
    session_id: str
    user_role: str = "citizen"
    user_location: Optional[str] = None
    preferences: dict = {}
    created_at: Optional[datetime] = None
    last_active: Optional[datetime] = None

class ChatMessage(BaseModel):
    session_id: str
    message_type: str  # "user" or "assistant"
    content: str
    user_role: str = "citizen"
    timestamp: Optional[datetime] = None

class ChatResponse(BaseModel):
    message: str
    confidence: Optional[float] = None
    sources: Optional[List[str]] = None
    timestamp: datetime