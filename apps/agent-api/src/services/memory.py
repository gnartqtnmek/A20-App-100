"""Memory service backed by the ERD-compatible ``memories`` table."""

from __future__ import annotations

from collections import Counter
from typing import Any

from ..infra.db import Database


class MemoryService:
    def __init__(self, db: Database):
        self.db = db

    async def list_memories(
        self,
        user_id: str,
        *,
        page: int = 1,
        limit: int = 20,
        memory_type: str | None = None,
    ) -> tuple[int, list[dict[str, Any]], dict[str, int]]:
        where = [
            "user_id = %s::uuid",
            "(expires_at IS NULL OR expires_at > NOW())",
        ]
        params: list[Any] = [user_id]
        if memory_type:
            where.append("memory_type = %s")
            params.append(memory_type)

        where_sql = " AND ".join(where)

        total_row = await self.db.fetch_one(
            f"SELECT COUNT(*) AS total FROM memories WHERE {where_sql}",
            tuple(params),
        )
        total = int((total_row or {}).get("total", 0))

        offset = (page - 1) * limit
        rows = await self.db.fetch_all(
            f"""
            SELECT
                id::text AS id,
                mem0_memory_id,
                memory_type,
                content,
                topic,
                course_id::text AS course_id,
                source,
                relevance_score,
                created_at,
                updated_at,
                expires_at
            FROM memories
            WHERE {where_sql}
            ORDER BY updated_at DESC
            LIMIT %s OFFSET %s
            """,
            tuple([*params, limit, offset]),
        )

        type_rows = await self.db.fetch_all(
            """
            SELECT memory_type, COUNT(*) AS count
            FROM memories
            WHERE user_id = %s::uuid
              AND (expires_at IS NULL OR expires_at > NOW())
            GROUP BY memory_type
            """,
            (user_id,),
        )
        by_type = {str(r["memory_type"]): int(r["count"]) for r in type_rows}

        if total > 0:
            return total, [dict(row) for row in rows], by_type

        # Backward compatibility: old data may still live in user_personalization.
        legacy = await self._legacy_personalization_projection(
            user_id=user_id,
            page=page,
            limit=limit,
            memory_type=memory_type,
        )
        if legacy is None:
            return 0, [], {}
        legacy_total, legacy_rows = legacy
        legacy_counter = Counter(str(row["memory_type"]) for row in legacy_rows)
        return legacy_total, legacy_rows, dict(legacy_counter)

    async def delete_memory(self, user_id: str, memory_id: str) -> bool:
        row = await self.db.fetch_one(
            """
            DELETE FROM memories
            WHERE id = %s::uuid
              AND user_id = %s::uuid
            RETURNING id
            """,
            (memory_id, user_id),
        )
        if row is not None:
            return True

        # Legacy fallback: allow deleting old key-based memories by key.
        legacy_row = await self.db.fetch_one(
            """
            UPDATE user_personalization
            SET data = data - %s,
                updated_at = NOW()
            WHERE user_id = %s
              AND data ? %s
            RETURNING user_id
            """,
            (memory_id, user_id, memory_id),
        )
        return legacy_row is not None

    async def delete_all_memories(self, user_id: str) -> int:
        row = await self.db.fetch_one(
            """
            WITH deleted AS (
                DELETE FROM memories
                WHERE user_id = %s::uuid
                RETURNING id
            )
            SELECT COUNT(*) AS deleted_count FROM deleted
            """,
            (user_id,),
        )
        deleted = int((row or {}).get("deleted_count", 0))

        legacy = await self.db.fetch_one(
            """
            WITH existing AS (
                SELECT COALESCE(jsonb_object_length(data), 0) AS count
                FROM user_personalization
                WHERE user_id = %s
            )
            UPDATE user_personalization
            SET data = '{}'::jsonb,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING (SELECT count FROM existing) AS deleted_count
            """,
            (user_id, user_id),
        )
        legacy_deleted = int((legacy or {}).get("deleted_count", 0))
        return deleted + legacy_deleted

    async def _legacy_personalization_projection(
        self,
        *,
        user_id: str,
        page: int,
        limit: int,
        memory_type: str | None,
    ) -> tuple[int, list[dict[str, Any]]] | None:
        row = await self.db.fetch_one(
            "SELECT data, updated_at FROM user_personalization WHERE user_id = %s",
            (user_id,),
        )
        if not row:
            return None

        data = row.get("data") or {}
        updated_at = row.get("updated_at")
        items: list[dict[str, Any]] = []
        for key, value in data.items():
            items.append(
                {
                    "id": str(key),
                    "mem0_memory_id": None,
                    "memory_type": "preference",
                    "content": str(value),
                    "topic": str(key),
                    "course_id": None,
                    "source": "legacy",
                    "relevance_score": None,
                    "created_at": updated_at,
                    "updated_at": updated_at,
                    "expires_at": None,
                }
            )

        if memory_type:
            items = [it for it in items if it["memory_type"] == memory_type]

        total = len(items)
        offset = (page - 1) * limit
        return total, items[offset : offset + limit]
