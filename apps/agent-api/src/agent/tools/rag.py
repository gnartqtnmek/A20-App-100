"""RAG tool: search relevant past conversations for the current user."""

from __future__ import annotations

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from ...services.rag import RAGService


def build_rag_tools(rag: RAGService):
    @tool
    async def search_past_conversations(query: str, config: RunnableConfig) -> str:
        """Search the user's past conversations for information relevant to the query.

        Use this when the user references something from a previous session,
        asks about history, or when context from older conversations would help.

        Required argument:
        - `query`: a concise natural-language description of what to look for.

        Returns relevant excerpts from past turns, including surrounding context.
        Returns an empty string if no relevant history is found.

        Examples:
        - {"query": "machine learning project we discussed last week"}
        - {"query": "preferred programming language"}
        - {"query": "deadline for the mobile app feature"}
        """
        user_id = (config.get("configurable") or {}).get("user_id", "")
        if not user_id:
            return ""
        return await rag.search(user_id, query)

    return [search_past_conversations]
