"""FastAPI dependency injection container and helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Request

from ..agent.runtime import AgentRuntimeService
from ..infra.db import Database
from ..services.conversation import ConversationService
from ..services.personalization import PersonalizationService
from ..services.rag import RAGService
from ..services.summary import SummaryService


@dataclass
class AppContainer:
    database: Database
    conversations: ConversationService
    personalization: PersonalizationService
    summaries: SummaryService
    rag: RAGService
    agent_runtime: AgentRuntimeService


def get_container(request: Request) -> AppContainer:
    return request.app.state.container


def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(record)
    if "id" in normalized and normalized["id"] is not None:
        normalized["id"] = str(normalized["id"])
    if "conversation_id" in normalized and normalized["conversation_id"] is not None:
        normalized["conversation_id"] = str(normalized["conversation_id"])
    return normalized
