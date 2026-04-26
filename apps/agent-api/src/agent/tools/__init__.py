"""LangChain tool builders exposed to the agent."""

from __future__ import annotations

from ...services.personalization import PersonalizationService
from ...services.rag import RAGService
from .personalization import build_personalization_tools
from .rag import build_rag_tools


def build_tools(
    personalization: PersonalizationService,
    rag: RAGService,
):
    return [
        *build_personalization_tools(personalization),
        *build_rag_tools(rag),
    ]
