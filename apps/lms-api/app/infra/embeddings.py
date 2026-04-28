"""Minimal async embedding client — calls any OpenAI-compatible /v1/embeddings endpoint."""
from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(60.0)
_BATCH_SIZE = 32


async def embed_texts(
    texts: list[str],
    *,
    base_url: str,
    api_key: str,
    model: str,
) -> list[list[float]]:
    """Return one embedding vector per input text.

    Sends texts in batches of ``_BATCH_SIZE`` to stay within API limits.
    Raises ``httpx.HTTPStatusError`` on non-2xx responses.
    """
    if not texts:
        return []

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    url = base_url.rstrip("/") + "/embeddings"
    results: list[list[float]] = []

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        for i in range(0, len(texts), _BATCH_SIZE):
            batch = texts[i : i + _BATCH_SIZE]
            resp = await client.post(url, headers=headers, json={"input": batch, "model": model})
            resp.raise_for_status()
            data: list[dict[str, Any]] = sorted(
                resp.json()["data"], key=lambda x: x["index"]
            )
            results.extend(item["embedding"] for item in data)

    return results
