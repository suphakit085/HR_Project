"""HR chatbot service using LangChain chain + memory."""

import re
from typing import Dict, Optional

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.config import get_settings

settings = get_settings()

class ChatbotResponse(BaseModel):
    is_appropriate: bool = Field(
        description="True if the user's message is a greeting, polite interaction, or related to HR/recruitment. False if it asks a question explicitly unrelated to HR (like math, coding, personal advice)."
    )
    response: str = Field(
        description="The response to the user. If is_appropriate is True, answer naturally. If False, politely decline and redirect to HR topics."
    )


SYSTEM_PROMPT = """You are an AI HR Assistant for a recruitment platform. You help HR professionals with:

1. Job Description Creation: Help write or improve job descriptions when asked.
2. Candidate Summarization: Summarize candidate profiles and their qualifications.
3. HR FAQ: Answer common HR questions about recruitment best practices, compliance, and processes.
4. General HR Support: Provide guidance on hiring workflows, interview techniques, and onboarding.

Guidelines:
- Be professional, helpful, and concise
- Use inclusive language
- If you don't know something specific to the company, say so
- When creating JDs, ask clarifying questions if needed
- Support both Thai and English languages based on user input
- Only answer HR/recruitment-related questions
- If users ask off-topic questions (math, coding, entertainment, etc.), politely refuse and redirect to HR topics

You do NOT have direct access to the actual database.
When "[Platform context]" is provided, treat it as trusted runtime data for counts/statuses.
If users ask for details not present in context, guide them to use the platform dashboard."""

# Keep one chat history per session so memory persists by session.
_session_histories: Dict[str, InMemoryChatMessageHistory] = {}
MAX_HISTORY_MESSAGES = 20

def _get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in _session_histories:
        _session_histories[session_id] = InMemoryChatMessageHistory()
    return _session_histories[session_id]


def _trim_session_history(session_id: str):
    history = _session_histories.get(session_id)
    if not history:
        return
    if len(history.messages) > MAX_HISTORY_MESSAGES:
        history.messages = history.messages[-MAX_HISTORY_MESSAGES:]


def chat(
    message: str,
    session_id: str,
    context: Optional[str] = None,
) -> str:
    """Process a chat message and return AI response."""
    if not settings.OPENAI_API_KEY:
        return "Chatbot is not configured. Please set OPENAI_API_KEY."

    user_input = message
    if context:
        user_input = f"{message}\n\n[Platform context]\n{context}"

    history = _get_session_history(session_id)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model="gpt-4o",
        temperature=0.2,
        max_tokens=1000,
    )
    
    # Method 1: LLM as a Judge using Structured Output
    structured_llm = llm.with_structured_output(ChatbotResponse)
    chain = prompt | structured_llm

    try:
        response_obj: ChatbotResponse = chain.invoke(
            {"history": history.messages, "input": user_input}
        )
    except Exception as e:
        return f"เกิดข้อผิดพลาดในการประมวลผล: {str(e)}"

    final_message = response_obj.response

    # If the LLM deems it totally inappropriate, we could override the response here,
    # but the prompt already tells it to politely decline in the response field.
    if not response_obj.is_appropriate:
        # We can add an explicit log or override here if we want absolute strictness:
        # final_message = "ขออภัยด้วยครับ ฉันสามารถช่วยได้เฉพาะเรื่องงาน HR และการสรรหาบุคลากรเท่านั้นครับ"
        pass

    # Manually append to history to keep it clean (without injected runtime context)
    history.add_user_message(message)
    history.add_ai_message(final_message)
    
    _trim_session_history(session_id)
    return final_message


def clear_session(session_id: str):
    """Clear conversation history for a session."""
    history = _session_histories.pop(session_id, None)
    if history:
        history.clear()
