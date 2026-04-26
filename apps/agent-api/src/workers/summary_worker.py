"""Periodic conversation and user-memory summarization worker."""

from __future__ import annotations

import hashlib
import logging
from typing import Any

from langchain_core.messages import HumanMessage

from ..infra.db import Database
from ..infra.llm import create_llm
from ..services.summary import SummaryService

logger = logging.getLogger(__name__)


def calculate_conversation_hash(conversation_ids: list[str]) -> str:
    """Calculate MD5 hash of sorted conversation IDs."""
    if not conversation_ids:
        return ""
    sorted_ids = sorted(conversation_ids)
    ids_string = ",".join(sorted_ids)
    return hashlib.md5(ids_string.encode()).hexdigest()


def _message_id(message: dict[str, Any], idx: int) -> int:
    """Get message ID using array index for LangGraph format."""
    return idx


def _is_user_message(message: dict[str, Any]) -> bool:
    """Check if message is a user message in simplified format."""
    return message.get("role") == "user"


def _extract_content(message: dict[str, Any]) -> str:
    """Extract content from message in simplified format."""
    return str(message.get("content") or "").strip()


async def summarize_conversation(
    db: Database,
    conversation_id: str,
    user_id: str,
    *,
    llm: Any | None = None,
    summaries: SummaryService | None = None,
    days: int = 180,
) -> None:
    """Summarize a single active conversation if it changed within the specified days.
    
    Args:
        days: Number of days to look back for updated conversations (default: 180)
    """

    llm = llm or create_llm()
    summaries = summaries or SummaryService(db)

    conversation = await db.fetch_one(
        f"""
        SELECT id, messages
        FROM conversations
        WHERE id = %s
          AND user_id = %s
          AND is_active = TRUE
          AND updated_at >= NOW() - INTERVAL '{days} days'
        """,
        (conversation_id, user_id),
    )
    if not conversation:
        logger.info(
            "Skipping conversation %s for user %s: not found, inactive, or older than %s days",
            conversation_id,
            user_id,
            days,
        )
        return

    existing_summary_row = await summaries.get_conversation_summary_record(conversation_id)
    last_message_id = int(existing_summary_row["last_message_id"]) if existing_summary_row else 0
    existing_summary = str(existing_summary_row.get("summary") or "").strip() if existing_summary_row else ""

    messages = conversation.get("messages")
    if not isinstance(messages, list):
        messages = []

    user_messages = [
        (idx, message)
        for idx, message in enumerate(messages)
        if isinstance(message, dict) and _is_user_message(message)
    ]
    max_message_id = len(user_messages) - 1 if user_messages else 0
    if max_message_id <= 0:
        logger.info("Skipping conversation %s for user %s: no messages", conversation_id, user_id)
        return

    if max_message_id <= last_message_id:
        logger.info(
            "Skipping conversation %s for user %s: max message id %s <= last_message_id %s",
            conversation_id,
            user_id,
            max_message_id,
            last_message_id,
        )
        return

    new_message_rows = [
        {
            "id": idx,
            "role": "user",
            "content": _extract_content(message),
        }
        for idx, message in user_messages
        if idx > last_message_id
    ]
    new_message_rows.sort(key=lambda row: int(row["id"]))

    if not new_message_rows:
        logger.info(
            "Skipping conversation %s for user %s: no new user messages after id %s",
            conversation_id,
            user_id,
            last_message_id,
        )
        return

    existing_summary_block = (
        f"\n\nSummary cũ của conversation:\n{existing_summary}" if existing_summary else ""
    )
    message_rows_block = "\n".join(
        f"{row['role']}: {str(row.get('content') or '').strip() or '[empty]'}" for row in new_message_rows
    )
    prompt = f"""Bạn là hệ thống tóm tắt hội thoại bằng tiếng Việt.
Hãy viết lại một conversation summary tổng thể, trung thực và ngắn gọn.

Yêu cầu:
- Phản ánh tổng thể conversation, không chỉ một phần nhỏ.
- Nêu rõ chủ đề chính, diễn biến quan trọng, quyết định, kết luận, trạng thái hiện tại và việc còn dang dở nếu có.
- Không suy diễn thêm sở thích, mục tiêu hoặc hồ sơ người dùng nếu dữ liệu không nói rõ.
- Không lặp lại ý nguyên văn; viết thành văn bản mạch lạc.{existing_summary_block}

Các user query mới cần được hợp nhất vào summary:
{message_rows_block}
"""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    summary_text = str(getattr(response, "content", "") or "").strip()
    if not summary_text:
        logger.warning("Conversation summary is empty for conversation %s; skipping update", conversation_id)
        return

    await summaries.upsert_conversation_summary(
        conversation_id=conversation_id,
        user_id=user_id,
        summary=summary_text,
        last_message_id=max(int(row["id"]) for row in new_message_rows),
    )
    logger.info(
        "Updated conversation summary for conversation %s user %s",
        conversation_id,
        user_id,
    )


async def summarize_user_memory(
    db: Database,
    user_id: str,
    *,
    llm: Any | None = None,
    summaries: SummaryService | None = None,
) -> None:
    """Rebuild a user's long-lived memory summary from active conversation summaries."""

    llm = llm or create_llm()
    summaries = summaries or SummaryService(db)

    memory_row = await summaries.get_memory_summary_record(user_id)
    summary_rows = await summaries.list_active_conversation_summaries(user_id)
    current_active_conversation_ids = sorted(str(row["conversation_id"]) for row in summary_rows)
    
    # Calculate hash of current conversation IDs
    new_hash = calculate_conversation_hash(current_active_conversation_ids)
    old_hash = memory_row.get("conversation_ids_hash", "") if memory_row else ""
    
    memory_updated_at = memory_row["updated_at"] if memory_row else None
    should_rebuild = (
        memory_row is None or  # No existing memory summary
        new_hash != old_hash or  # Conversation list changed (added/removed conversations)
        any(row["updated_at"] > memory_updated_at for row in summary_rows)  # Newer conversation summaries
    )
    
    if not should_rebuild:
        logger.info("Skipping memory summary for user %s: no changes detected", user_id)
        return

    if summary_rows:
        summary_block = "\n\n".join(
            str(row.get("summary") or "").strip()
            for row in summary_rows
            if str(row.get("summary") or "").strip()
        )
        prompt = f"""Bạn đang tạo user memory summary bằng tiếng Việt từ nhiều conversation summary.

Mục tiêu:
- Tổng hợp các thông tin có thể tái sử dụng ở các conversation sau.
- Ưu tiên các bối cảnh, nhu cầu, chủ đề hoặc thông tin nền xuất hiện lặp lại.
- Chỉ đưa vào các đặc điểm như sở thích, mục tiêu, thói quen, điểm mạnh/yếu nếu chúng xuất hiện rõ ràng trong dữ liệu.
- Loại bỏ các chi tiết ngắn hạn nếu không còn giá trị sử dụng.
- Viết một đoạn tổng hợp mạch lạc, trung thực, không bịa thêm.

Danh sách conversation summary hiện tại:
{summary_block}
"""
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        summary_text = str(getattr(response, "content", "") or "").strip()
    else:
        summary_text = ""
    if summary_rows and not summary_text:
        logger.warning("Memory summary is empty for user %s; skipping update", user_id)
        return

    await summaries.upsert_memory_summary(
        user_id=user_id,
        summary=summary_text,
        conversation_ids=current_active_conversation_ids,
        conversation_ids_hash=new_hash,
    )
    logger.info(
        "Updated memory summary for user %s: hash %s -> %s",
        user_id,
        old_hash[:8] + "..." if old_hash else "none",
        new_hash[:8] + "..." if new_hash else "none",
    )


async def run_daily_summary(db: Database, days: int = 180) -> None:
    """Run the daily summary batch for all users with recent activity.
    
    Args:
        days: Number of days to look back for updated conversations (default: 180)
    """

    user_rows = await db.fetch_all(
        f"""
        SELECT DISTINCT user_id
        FROM conversations
        WHERE is_active = TRUE
          AND updated_at >= NOW() - INTERVAL '{days} days'
        ORDER BY user_id ASC
        """
    )
    user_ids = [str(row["user_id"]) for row in user_rows]
    if not user_ids:
        logger.info("No users matched the daily summary window")
        return

    llm = create_llm()
    summaries = SummaryService(db)
    logger.info("Daily summary started for %s user(s)", len(user_ids))
    for user_id in user_ids:
        logger.info("Processing daily summary for user %s", user_id)
        conversation_rows = await db.fetch_all(
            f"""
            SELECT id
            FROM conversations
            WHERE user_id = %s
              AND is_active = TRUE
              AND updated_at >= NOW() - INTERVAL '{days} days'
            ORDER BY updated_at DESC, id ASC
            """,
            (user_id,),
        )
        for row in conversation_rows:
            conversation_id = str(row["id"])
            try:
                await summarize_conversation(
                    db,
                    conversation_id,
                    user_id,
                    llm=llm,
                    summaries=summaries,
                    days=days,
                )
            except Exception:
                logger.exception(
                    "Failed to summarize conversation %s for user %s",
                    conversation_id,
                    user_id,
                )

        try:
            await summarize_user_memory(db, user_id, llm=llm, summaries=summaries)
        except Exception:
            logger.exception("Failed to summarize user memory for user %s", user_id)

    logger.info("Daily summary finished")


if __name__ == "__main__":
    import asyncio
    import sys
    from ..infra.settings import get_settings
    
    async def main():
        # Parse days argument from command line (default: 180)
        days = 180
        if len(sys.argv) > 1:
            try:
                days = int(sys.argv[1])
            except ValueError:
                print(f"Invalid days argument: {sys.argv[1]}, using default: 180")
        
        settings = get_settings()
        db = Database(settings.database_url)
        
        try:
            await db.open()
            print(f"Running summary worker for conversations updated within last {days} days...")
            await run_daily_summary(db, days=days)
        finally:
            await db.close()
    
    asyncio.run(main())
