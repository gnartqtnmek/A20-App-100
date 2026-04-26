"""Embedding worker: re-embeds all active conversations for all users.

Run manually:
    python -m src.workers.embedding_worker
"""

from __future__ import annotations

import asyncio
import logging

from openai import AsyncOpenAI

from ..infra.db import Database
from ..infra.settings import get_settings
from ..services.rag import build_turn_text, chunk_by_tokens, chunk_uuid, vec_literal

logger = logging.getLogger(__name__)


async def embed_all_conversations(db: Database | None = None) -> None:
    settings = get_settings()
    own_db = db is None
    if own_db:
        db = Database(settings.database_url)
        await db.open()

    client = AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.embedding_base_url or "https://api.openai.com/v1",
    )

    try:
        rows = await db.fetch_all(
            "SELECT id, user_id, messages FROM conversations WHERE is_active = TRUE"
        )
        logger.info("Embedding %d conversation(s)", len(rows))

        for row in rows:
            conv_id = str(row["id"])
            user_id = str(row["user_id"])
            messages = row.get("messages") or []
            if not isinstance(messages, list) or not messages:
                continue

            # Calculate turn indices from message sequence
            turn_indices = []
            current_turn = 0
            
            for msg in messages:
                if msg.get("role") == "user":
                    current_turn += 1
                    if current_turn not in turn_indices:
                        turn_indices.append(current_turn)

            for turn_index in sorted(turn_indices):
                turn_text, msg_indices = build_turn_text(messages, turn_index)
                if not turn_text:
                    continue

                chunks = chunk_by_tokens(turn_text)
                if not chunks:
                    continue

                if not msg_indices:
                    msg_indices = [0]

                try:
                    response = await client.embeddings.create(
                        model=settings.embedding_model,
                        input=chunks,
                        dimensions=settings.embedding_dimensions,
                    )
                except Exception:
                    logger.exception("Embedding API failed for conv %s turn %d", conv_id, turn_index)
                    continue

                embeddings = [
                    item.embedding
                    for item in sorted(response.data, key=lambda x: x.index)
                ]

                for chunk_seq, (chunk_text, embedding) in enumerate(zip(chunks, embeddings), start=1):
                    cid = chunk_uuid(conv_id, turn_index, chunk_seq)
                    await db.execute(
                        """
                        INSERT INTO message_embeddings
                            (chunk_id, conversation_id, turn_index, message_ids,
                             chunk_text, embedding, user_id, chunk_seq)
                        VALUES (%s, %s, %s, %s, %s, %s::vector, %s, %s)
                        ON CONFLICT (chunk_id) DO UPDATE
                            SET chunk_text  = EXCLUDED.chunk_text,
                                embedding   = EXCLUDED.embedding
                        """,
                        (cid, conv_id, turn_index, msg_indices,
                         chunk_text, vec_literal(embedding), user_id, chunk_seq),
                    )

                logger.info("conv %s turn %d: %d chunk(s) embedded", conv_id, turn_index, len(chunks))

    finally:
        if own_db:
            await db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(embed_all_conversations())
