"""Chatbot API routes for HR Assistant."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.user import User
from app.api.auth import require_admin
from app.services.chatbot import chat, clear_session
from app.services.chatbot_context import (
    get_chatbot_context_summary,
    build_chatbot_context_text,
)
from app.services.audit import create_audit_log

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


class ChatContextSummaryResponse(BaseModel):
    summary: dict[str, Any]
    context: str


@router.get("/context/summary", response_model=ChatContextSummaryResponse)
async def get_context_summary(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a role-aware runtime summary for grounding chatbot responses."""
    summary = get_chatbot_context_summary(db, current_user)
    context = build_chatbot_context_text(summary)
    return ChatContextSummaryResponse(summary=summary, context=context)


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Send a message to the HR chatbot."""
    session_id = request.session_id or str(uuid.uuid4())
    summary = get_chatbot_context_summary(db, current_user)
    runtime_context = build_chatbot_context_text(summary)
    merged_context = runtime_context
    if request.context:
        if request.context.strip().startswith("System runtime data"):
            merged_context = request.context
        else:
            merged_context = f"{runtime_context}\n\nAdditional frontend context:\n{request.context}"

    reply = chat(
        message=request.message,
        session_id=session_id,
        context=merged_context,
    )

    create_audit_log(
        db, action="chatbot_message", user_id=current_user.id,
        entity_type="chatbot",
        details=f"Chat session: {session_id}",
        prompt_text=request.message[:500],
        response_text=reply[:500],
    )

    return ChatResponse(reply=reply, session_id=session_id)


@router.delete("/session/{session_id}")
async def end_session(
    session_id: str,
    current_user: User = Depends(require_admin),
):
    """Clear conversation history for a chat session."""
    clear_session(session_id)
    return {"message": "Session cleared"}
