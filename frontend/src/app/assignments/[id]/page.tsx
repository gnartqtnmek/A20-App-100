"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { AssignmentRead, SubmissionRead } from "@/lib/types";
import { Card, ErrorBanner, PageShell } from "@/components/page-shell";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assignmentId = params.id;
  const role = getUserRole();

  const [assignment, setAssignment] = useState<AssignmentRead | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (!assignmentId) return;

    let cancelled = false;
    (async () => {
      try {
        const a = await apiClient.getAssignment(assignmentId);
        if (!cancelled) setAssignment(a);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Không tải được bài tập.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const result = await apiClient.submitAssignment(assignment.id, { content });
      setSubmission(result);
      setInfo("Đã nộp bài thành công.");
      setContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nộp bài thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Bài tập">
        <Card>Đang tải...</Card>
      </PageShell>
    );
  }

  if (!assignment) {
    return (
      <PageShell title="Không tìm thấy bài tập">
        <ErrorBanner message={error} />
        <Card>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Về dashboard
          </Link>
        </Card>
      </PageShell>
    );
  }

  const overdue =
    assignment.due_at !== null && new Date(assignment.due_at) < new Date();

  return (
    <PageShell
      title={assignment.title}
      subtitle={`${assignment.type.toUpperCase()} · ${assignment.max_score} điểm`}
      actions={
        <Link
          href={`/courses/${assignment.course_id}`}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          ← Khóa học
        </Link>
      }
    >
      <ErrorBanner message={error} />
      {info && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {info}
        </div>
      )}

      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Hạn nộp</dt>
            <dd className={`mt-1 font-medium ${overdue ? "text-rose-600" : "text-neutral-900"}`}>
              {formatDate(assignment.due_at)} {overdue && "(đã quá hạn)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Trọng số</dt>
            <dd className="mt-1 font-medium text-neutral-900">{assignment.weight}</dd>
          </div>
        </dl>
        {assignment.description && (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
            {assignment.description}
          </div>
        )}
      </Card>

      {role === "student" && assignment.type !== "quiz" && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Nộp bài</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder={
                assignment.type === "essay"
                  ? "Viết bài luận của bạn..."
                  : "Mô tả bài làm hoặc dán link file..."
              }
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "Đang nộp..." : "Nộp bài"}
            </button>
          </form>

          {submission && (
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              <p className="font-medium text-neutral-800">
                Trạng thái: {submission.status} · Lần thử {submission.attempt_count}
              </p>
              {submission.score !== null && (
                <p className="text-neutral-700">
                  Điểm: {submission.score} / {assignment.max_score}
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {assignment.type === "quiz" && (
        <Card>
          <p className="text-sm text-neutral-700">
            Quiz player chưa được scaffold trong UI này (Sprint 3 sẽ làm). Hiện tại bạn vẫn có thể
            mở Swagger UI để test endpoint quiz.
          </p>
        </Card>
      )}
    </PageShell>
  );
}
