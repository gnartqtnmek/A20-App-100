"""Prompt context composition from personalization and summaries."""

from __future__ import annotations

from dataclasses import dataclass

from .personalization import PersonalizationService
from .summary import SummaryService


@dataclass
class PromptContextBuilder:
    personalization: PersonalizationService
    summaries: SummaryService

    async def build(self, user_id: str, conversation_id: str) -> str:
        sections: list[str] = []

        personalization_block = await self.personalization.get_context_block(user_id)
        if personalization_block:
            sections.append(f"## User Personalization\n{personalization_block}")

        conversation_summary = await self.summaries.get_conversation_summary(conversation_id)
        if conversation_summary:
            sections.append(f"## Conversation Summary\n{conversation_summary}")

        memory_summary = await self.summaries.get_memory_summary(user_id)
        if memory_summary:
            sections.append(f"## Global Memory Summary\n{memory_summary}")

        return "\n\n".join(sections)
