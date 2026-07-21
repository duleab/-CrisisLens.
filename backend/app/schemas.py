from datetime import datetime
from pydantic import BaseModel


class EventOut(BaseModel):
    id: str
    crisis_type: str
    sub_type: str | None = None
    severity: str
    system_confidence: float
    location_name: str | None = None
    country_iso: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    magnitude: float | None = None
    casualties_estimated: float | None = None
    event_date: str | None = None
    source_names: list[str] = []
    official_confirmed: bool = False
    corroboration_count: int = 1
    raw_text: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str
    role: str = "citizen"  # citizen | tourist | responder | government
    lang: str = "en"  # en | id


class ChatResponse(BaseModel):
    answer: str
    role: str
    events_considered: int


class IngestResponse(BaseModel):
    fetched: int
    saved: int
    skipped_duplicates: int
