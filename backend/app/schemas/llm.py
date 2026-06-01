# =============================================================================
# app/schemas/llm.py — Schemas para o assistente LLM
# =============================================================================
from pydantic import BaseModel, Field
from typing import Literal


class LLMMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class LLMRequest(BaseModel):
    dashboard_id: int
    prompt: str = Field(..., min_length=1)
    messages: list[LLMMessage] | None = None


class LLMResponse(BaseModel):
    answer: str
