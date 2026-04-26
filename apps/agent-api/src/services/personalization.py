"""Per-user personalization service."""

from __future__ import annotations

from typing import Iterable

from psycopg.types.json import Jsonb

from ..infra.db import Database


def _stringify_dict(data: dict) -> dict[str, str]:
    return {str(key): str(value) for key, value in data.items()}


class PersonalizationService:
    MAX_KEYS = 32

    def __init__(self, db: Database):
        self.db = db

    async def get_snapshot(self, user_id: str) -> dict[str, str]:
        row = await self.db.fetch_one(
            "SELECT data FROM user_personalization WHERE user_id = %s",
            (user_id,),
        )
        data = row["data"] if row and row.get("data") else {}
        return _stringify_dict(data)

    async def get_context_block(self, user_id: str) -> str:
        snapshot = await self.get_snapshot(user_id)
        if not snapshot:
            return ""
        return "\n".join(f"- {key}: {value}" for key, value in snapshot.items())

    async def upsert(self, user_id: str, updates: dict[str, str]) -> str:
        normalized = {}
        for key, value in updates.items():
            k, v = str(key).strip(), str(value).strip()
            if k and v:
                normalized[k] = v

        if not normalized:
            return "No updates provided."

        snapshot = await self.get_snapshot(user_id)

        existing_updates = {k: v for k, v in normalized.items() if k in snapshot}
        new_updates = {k: v for k, v in normalized.items() if k not in snapshot}

        remaining_capacity = max(0, self.MAX_KEYS - len(snapshot))
        new_accepted = dict(list(new_updates.items())[:remaining_capacity])
        new_rejected = list(new_updates.keys())[remaining_capacity:]

        to_upsert = {**existing_updates, **new_accepted}

        result_parts: list[str] = []

        if to_upsert:
            sql = """
                INSERT INTO user_personalization (user_id, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET data = user_personalization.data || EXCLUDED.data,
                              updated_at = NOW()
            """
            await self.db.execute(sql, (user_id, Jsonb(to_upsert)))
            result_parts.append(
                f"Stored personalization keys: {', '.join(to_upsert.keys())}"
            )

        if new_rejected:
            result_parts.append(
                f"Could not add new keys (memory limit of {self.MAX_KEYS} reached): {', '.join(new_rejected)}"
            )

        return ". ".join(result_parts) if result_parts else "No updates provided."

    async def delete(self, user_id: str, keys: str | Iterable[str]) -> str:
        if isinstance(keys, str):
            normalized = [keys.strip()] if keys.strip() else []
        else:
            normalized = [str(key).strip() for key in keys if str(key).strip()]

        if not normalized:
            return "No keys provided."

        sql = """
            UPDATE user_personalization
            SET data = data - %s::text[],
                updated_at = NOW()
            WHERE user_id = %s
        """
        await self.db.execute(sql, (normalized, user_id))
        return f"Deleted personalization keys: {', '.join(normalized)}"
