import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Event
from app.schemas import ChatRequest, ChatResponse
from app.gemma import ask_crisislens

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Event).order_by(Event.system_confidence.desc()).limit(20)
    events = (await db.execute(stmt)).scalars().all()

    # ask_crisislens calls the google-genai SDK which is synchronous —
    # run it in a thread pool so we don't block the uvicorn event loop.
    answer = await asyncio.to_thread(
        ask_crisislens, payload.question, list(events),
        role=payload.role, lang=payload.lang
    )

    return ChatResponse(
        answer=answer,
        role=payload.role,
        events_considered=len([e for e in events if e.crisis_type not in ("other", "unknown", "")]),
    )
