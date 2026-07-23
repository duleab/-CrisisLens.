import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, Boolean, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Event(Base):
    """
    Mirrors the exact final_events schema from the Kaggle pipeline —
    crisis_type, location_name, country_iso, system_confidence, severity,
    source_names, official_confirmed, magnitude, casualties_estimated,
    event_date, latitude, longitude, raw_text — so this is a drop-in
    replacement for final_events.json, not a redesign.
    """
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)

    crisis_type: Mapped[str] = mapped_column(String, default="unknown")
    sub_type: Mapped[str | None] = mapped_column(String, nullable=True)
    severity: Mapped[str] = mapped_column(String, default="low")
    status: Mapped[str] = mapped_column(String, default="new")
    system_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    trust_score: Mapped[float] = mapped_column(Float, default=0.5)

    location_name: Mapped[str | None] = mapped_column(String, nullable=True)
    country_iso: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    magnitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    casualties_estimated: Mapped[int | None] = mapped_column(Integer, nullable=True)
    event_date: Mapped[str | None] = mapped_column(String, nullable=True)

    source_names: Mapped[list] = mapped_column(JSON, default=list)
    official_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    corroboration_count: Mapped[int] = mapped_column(Integer, default=1)

    raw_text: Mapped[str | None] = mapped_column(String, nullable=True)

    source_event_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
