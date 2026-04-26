"""Conversation and memory summary service."""

from __future__ import annotations

from typing import Any

from ..infra.db import Database


class SummaryService:
    def __init__(self, db: Database):
        self.db = db

    async def get_conversation_summary_record(self, conversation_id: str) -> dict[str, Any] | None:
        return await self.db.fetch_one(
            """
            SELECT summary, last_message_id, updated_at
            FROM conversation_summaries
            WHERE conversation_id = %s
            """,
            (conversation_id,),
        )

    async def get_conversation_summary(self, conversation_id: str) -> str:
        row = await self.get_conversation_summary_record(conversation_id)
        return str(row["summary"]).strip() if row else ""

    async def list_active_conversation_summaries(self, user_id: str) -> list[dict[str, Any]]:
        return await self.db.fetch_all(
            """
            SELECT
                cs.conversation_id,
                cs.summary,
                cs.updated_at
            FROM conversation_summaries AS cs
            INNER JOIN conversations AS c
                ON c.id = cs.conversation_id
            WHERE cs.user_id = %s
              AND c.user_id = %s
              AND c.is_active = TRUE
            ORDER BY cs.updated_at DESC, cs.conversation_id ASC
            """,
            (user_id, user_id),
        )

    async def get_memory_summary_record(self, user_id: str) -> dict[str, Any] | None:
        return await self.db.fetch_one(
            """
            SELECT summary, conversation_ids_hash, updated_at
            FROM memory_summaries
            WHERE user_id = %s
            """,
            (user_id,),
        )

    async def get_memory_summary(self, user_id: str) -> str:
        row = await self.get_memory_summary_record(user_id)
        return str(row["summary"]).strip() if row else ""

    async def upsert_conversation_summary(
        self,
        conversation_id: str,
        user_id: str,
        summary: str,
        last_message_id: int,
    ) -> None:
        await self.db.execute(
            """
            INSERT INTO conversation_summaries (
                conversation_id,
                user_id,
                summary,
                last_message_id
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (conversation_id)
            DO UPDATE SET
                user_id = EXCLUDED.user_id,
                summary = EXCLUDED.summary,
                last_message_id = EXCLUDED.last_message_id,
                updated_at = NOW()
            """,
            (conversation_id, user_id, summary, last_message_id),
        )

    async def upsert_memory_summary(
        self,
        user_id: str,
        summary: str,
        conversation_ids: list[str],
        conversation_ids_hash: str = "",
    ) -> None:
        await self.db.execute(
            """
            INSERT INTO memory_summaries (
                user_id,
                summary,
                conversation_ids_hash
            )
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id)
            DO UPDATE SET
                summary = EXCLUDED.summary,
                conversation_ids_hash = EXCLUDED.conversation_ids_hash,
                updated_at = NOW()
            """,
            (user_id, summary, conversation_ids_hash),
        )
