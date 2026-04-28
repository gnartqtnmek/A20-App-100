"""LangChain tools that query the LMS backend for the current user."""

from __future__ import annotations

import logging

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from ...services.lms import LMSService
from ...services.rag import RAGService

logger = logging.getLogger(__name__)


def _user_id(config: RunnableConfig) -> str:
    return (config.get("configurable") or {}).get("user_id", "")


def _fmt_grades(grades: list[dict]) -> str:
    if not grades:
        return "Không có điểm nào."
    lines = ["Danh sách điểm:"]
    for g in grades:
        pct = g.get("percent")
        pct_str = f" ({pct:.1f}%)" if pct is not None else ""
        lines.append(
            f"- [{g.get('course_name', '?')}] {g.get('assignment_title', '?')}: "
            f"{g.get('score', '?')}/{g.get('max_score', '?')}{pct_str}"
        )
    return "\n".join(lines)


def _fmt_assignments(assignments: list[dict]) -> str:
    if not assignments:
        return "Không có bài tập nào."
    lines = ["Danh sách bài tập:"]
    for a in assignments:
        due = a.get("due_at") or "không có hạn"
        status = a.get("submission_status") or "chưa nộp"
        overdue = " ⚠️ QUÁ HẠN" if a.get("is_overdue") else ""
        lines.append(
            f"- [{a.get('course_name', '?')}] {a.get('title', '?')} | "
            f"Hạn: {due} | Trạng thái: {status}{overdue}"
        )
    return "\n".join(lines)


def _fmt_lesson(lesson: dict | None) -> str:
    if not lesson:
        return "Không tìm thấy bài học."
    parts = [
        f"Bài học: {lesson.get('title', '?')}",
        f"Môn: {lesson.get('course_name', '?')} > {lesson.get('module_title', '?')}",
    ]
    content = lesson.get("content_md") or ""
    if content:
        parts.append("\nNội dung:\n" + content[:3000] + ("..." if len(content) > 3000 else ""))
    attachments = lesson.get("attachments") or []
    if attachments:
        parts.append("Tài liệu đính kèm: " + ", ".join(
            a.get("name", a.get("url", "?")) for a in attachments
        ))
    return "\n".join(parts)


def _fmt_knowledge(result: dict) -> str:
    matches = result.get("matches") or []
    if not matches:
        return "Không tìm thấy nội dung liên quan trong tài liệu học."
    used_vector = result.get("used_vector_search", False)
    search_type = "ngữ nghĩa" if used_vector else "từ khóa"
    lines = [f"Tìm thấy {len(matches)} đoạn liên quan (tìm kiếm {search_type}):"]
    for i, m in enumerate(matches, 1):
        score = m.get("similarity")
        score_str = f" (similarity: {score:.3f})" if score is not None else ""
        course = m.get("course_name") or m.get("course_code", "?")
        lines.append(
            f"\n[{i}] {course} — Bài học: {m.get('lesson_title', '?')}{score_str}\n"
            f"{m.get('content', '')[:600]}"
        )
    return "\n".join(lines)


def build_lms_tools(lms: LMSService, rag: RAGService) -> list:
    @tool
    async def get_my_grades(config: RunnableConfig, course_id: str | None = None) -> str:
        """Lấy danh sách điểm của người dùng hiện tại từ LMS.

        Dùng khi người dùng hỏi về điểm số, kết quả học tập, hay GPA.

        Tham số tùy chọn:
        - `course_id`: UUID của môn học, để lọc chỉ lấy điểm của môn đó.
          Bỏ qua để lấy điểm toàn bộ các môn.

        Ví dụ:
        - {} — lấy tất cả điểm
        - {"course_id": "uuid-cua-mon-hoc"} — chỉ lấy điểm môn đó
        """
        uid = _user_id(config)
        if not uid:
            return "Không xác định được người dùng."
        try:
            grades = await lms.get_my_grades(uid, course_id=course_id)
            return _fmt_grades(grades)
        except Exception as exc:
            logger.warning("get_my_grades failed: %s", exc)
            return f"Không thể lấy điểm: {exc}"

    @tool
    async def get_my_assignments(
        config: RunnableConfig,
        course_id: str | None = None,
        only_pending: bool = False,
    ) -> str:
        """Lấy danh sách bài tập của người dùng hiện tại từ LMS.

        Dùng khi người dùng hỏi về bài tập, deadline, bài chưa nộp.

        Tham số tùy chọn:
        - `course_id`: UUID của môn học để lọc.
        - `only_pending`: True để chỉ lấy bài chưa chấm điểm / chưa nộp.

        Ví dụ:
        - {} — tất cả bài tập
        - {"only_pending": true} — chỉ bài chưa hoàn thành
        - {"course_id": "uuid", "only_pending": true}
        """
        uid = _user_id(config)
        if not uid:
            return "Không xác định được người dùng."
        try:
            assignments = await lms.get_my_assignments(
                uid, course_id=course_id, only_pending=only_pending
            )
            return _fmt_assignments(assignments)
        except Exception as exc:
            logger.warning("get_my_assignments failed: %s", exc)
            return f"Không thể lấy danh sách bài tập: {exc}"

    @tool
    async def get_lesson_content(lesson_id: str) -> str:
        """Lấy toàn bộ nội dung markdown và tài liệu đính kèm của một bài học cụ thể.

        Dùng khi người dùng hỏi về nội dung bài học, muốn xem lại lý thuyết,
        hoặc agent cần đọc tài liệu trước khi trả lời câu hỏi chuyên môn.

        Tham số bắt buộc:
        - `lesson_id`: UUID của bài học.

        Ví dụ:
        - {"lesson_id": "uuid-cua-bai-hoc"}
        """
        if not lesson_id:
            return "Cần cung cấp lesson_id."
        try:
            lesson = await lms.get_lesson_content(lesson_id)
            return _fmt_lesson(lesson)
        except Exception as exc:
            logger.warning("get_lesson_content failed: %s", exc)
            return f"Không thể lấy nội dung bài học: {exc}"

    @tool
    async def search_knowledge(
        query: str,
        course_id: str | None = None,
        limit: int = 5,
    ) -> str:
        """Tìm kiếm ngữ nghĩa trên toàn bộ tài liệu học thuật trong LMS.

        Dùng khi người dùng hỏi câu hỏi chuyên môn, cần giải thích khái niệm,
        hoặc cần trích dẫn từ tài liệu giảng dạy. Ưu tiên tool này trước khi
        trả lời câu hỏi liên quan đến nội dung học.

        Tham số bắt buộc:
        - `query`: câu hỏi hoặc chủ đề cần tìm (tiếng Việt hoặc tiếng Anh).

        Tham số tùy chọn:
        - `course_id`: UUID môn học để giới hạn phạm vi tìm kiếm.
        - `limit`: số kết quả trả về (mặc định 5, tối đa 10).

        Ví dụ:
        - {"query": "định nghĩa machine learning"}
        - {"query": "cách tính gradient descent", "course_id": "uuid"}
        """
        if not query or not query.strip():
            return "Cần cung cấp câu truy vấn."
        try:
            embedding: list[float] | None = None
            try:
                [embedding] = await rag.embed([query.strip()])
            except Exception as emb_exc:
                logger.warning("Embedding failed, falling back to text search: %s", emb_exc)

            result = await lms.search_knowledge(
                query.strip(),
                course_id=course_id,
                limit=min(limit, 10),
                embedding=embedding,
            )
            return _fmt_knowledge(result)
        except Exception as exc:
            logger.warning("search_knowledge failed: %s", exc)
            return f"Không thể tìm kiếm tài liệu: {exc}"

    return [get_my_grades, get_my_assignments, get_lesson_content, search_knowledge]
