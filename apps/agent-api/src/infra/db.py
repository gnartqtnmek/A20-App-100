"""PostgreSQL connection management."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from .settings import get_settings

logger = logging.getLogger(__name__)


class Database:
    """Thin wrapper around an async Psycopg 3 connection pool."""

    def __init__(self, conninfo: str):
        if not conninfo:
            raise ValueError("DATABASE_URL is not configured. Check your .env file.")

        self.conninfo = conninfo
        self.pool = AsyncConnectionPool(
            conninfo=conninfo,
            min_size=1,
            max_size=10,
            kwargs={"row_factory": dict_row},
            open=False,
        )

    async def open(self) -> None:
        await self.pool.open(wait=True)

    async def close(self) -> None:
        await self.pool.close()

    @asynccontextmanager
    async def connection(self):
        async with self.pool.connection() as conn:
            yield conn

    async def fetch_one(self, sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        async with self.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)
                return await cur.fetchone()

    async def fetch_all(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        async with self.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)
                return list(await cur.fetchall())

    async def execute(self, sql: str, params: tuple[Any, ...] = ()) -> None:
        async with self.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)

    async def execute_script(self, script: str) -> None:
        async with self.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(script)

    async def bootstrap_from_file(self, path: str | Path) -> None:
        script = Path(path).read_text(encoding="utf-8")
        await self.execute_script(script)


_database: Database | None = None


def get_database() -> Database:
    global _database
    if _database is None:
        settings = get_settings()
        _database = Database(settings.database_url)
    return _database


def set_database(database: Database) -> None:
    global _database
    _database = database
