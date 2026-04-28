"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { AssignmentRead, CourseRead, GradeRead, SubmissionRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  submitted: "Đã nộp",
  late: "Trễ hạn",
  graded: "Đã chấm",
};

function GradeModal({
  submission,
  maxScore,
  onClose,
  onSaved,
}: {
  submission: SubmissionRead;
  maxScore: number;
  onClose: () => void;
  onSaved: (grade: GradeRead) => void;
}) {
  const [score, setScore] = useState(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const grade = await apiClient.gradeSubmission(submission.id, {
        score,
        feedback: feedback.trim() || undefined,
      });
      onSaved(grade);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lưu điểm thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Chấm điểm</h3>
        <p className="mb-4 rounded-lg bg-neutral-50 p-3 font-mono text-xs text-neutral-600">
          Submission: {submission.id.slice(0, 8)}…
          <br />
          Student: {submission.student_id.slice(0, 8)}…
        </p>

        <ErrorBanner message={error} />

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Điểm (tối đa {maxScore})
            </label>
            <input
              type="number"
              min={0}
              max={maxScore}
              step={0.5}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              required
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Nhận xét (tùy chọn)
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Viết nhận xét cho sinh viên..."
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu điểm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GradebookPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  const role = getUserRole();

  const [course, setCourse] = useState<CourseRead | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRead[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionRead[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [grading, setGrading] = useState<SubmissionRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (role === "student") {
      router.replace(`/courses/${courseId}`);
      return;
    }
    if (!courseId) return;

    let cancelled = false;
    (async () => {
      try {
        const [c, a] = await Promise.all([
          apiClient.getCourse(courseId),
          apiClient.listCourseAssignments(courseId),
        ]);
        if (cancelled) return;
        setCourse(c);
        setAssignments(a);
        if (a.length > 0) setSelectedAssignmentId(a[0].id);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, role, router]);

  useEffect(() => {
    if (!selectedAssignmentId) return;
    let cancelled = false;
    setLoadingSubmissions(true);
    setSubmissions([]);
    (async () => {
      try {
        const data = await apiClient.listAssignmentSubmissions(selectedAssignmentId);
        if (!cancelled) setSubmissions(data);
      } catch {
        // submissions stay empty
      } finally {
        if (!cancelled) setLoadingSubmissions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAssignmentId]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) ?? null;

  function handleGradeSaved(grade: GradeRead) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === grading?.id
          ? { ...s, score: grade.score, status: "graded", graded_at: grade.recorded_at }
          : s,
      ),
    );
    setGrading(null);
  }

  if (loading) {
    return (
      <PageShell title="Sổ điểm lớp">
        <Card>Đang tải...</Card>
      </PageShell>
    );
  }

  if (!course) {
    return (
      <PageShell title="Không tìm thấy khóa học">
        <ErrorBanner message={error} />
      </PageShell>
    );
  }

  return (
    <>
      {grading && selectedAssignment && (
        <GradeModal
          submission={grading}
          maxScore={selectedAssignment.max_score}
          onClose={() => setGrading(null)}
          onSaved={handleGradeSaved}
        />
      )}

      <PageShell
        title="Sổ điểm lớp"
        subtitle={`${course.name} · ${course.code}`}
        actions={
          <Link
            href={`/courses/${courseId}`}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            ← Khóa học
          </Link>
        }
      >
        <ErrorBanner message={error} />

        <Card>
          <label className="block text-sm font-medium text-neutral-700">Chọn bài tập</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.type.toUpperCase()}) · {a.max_score} điểm
              </option>
            ))}
          </select>
          {selectedAssignment && (
            <p className="mt-2 text-xs text-neutral-500">
              Hạn nộp: {formatDate(selectedAssignment.due_at)} · Trọng số: {selectedAssignment.weight}
            </p>
          )}
        </Card>

        {loadingSubmissions ? (
          <Card>Đang tải bài nộp...</Card>
        ) : submissions.length === 0 ? (
          <EmptyState message="Chưa có bài nộp nào cho bài tập này." />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-3 pr-4">Student ID</th>
                  <th className="pb-3 pr-4">Trạng thái</th>
                  <th className="pb-3 pr-4">Lần thử</th>
                  <th className="pb-3 pr-4">Nộp lúc</th>
                  <th className="pb-3 pr-4">Điểm</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-700">
                      {s.student_id.slice(0, 8)}…
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium
                          ${s.status === "graded" ? "bg-emerald-100 text-emerald-700" : ""}
                          ${s.status === "submitted" ? "bg-blue-100 text-blue-700" : ""}
                          ${s.status === "late" ? "bg-amber-100 text-amber-700" : ""}
                          ${s.status === "draft" ? "bg-neutral-100 text-neutral-600" : ""}`}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-neutral-600">{s.attempt_count}</td>
                    <td className="py-3 pr-4 text-neutral-500">{formatDate(s.submitted_at)}</td>
                    <td className="py-3 pr-4 font-medium">
                      {s.score !== null
                        ? `${s.score} / ${selectedAssignment?.max_score}`
                        : <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="py-3">
                      {s.status !== "draft" && (
                        <button
                          onClick={() => setGrading(s)}
                          className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100"
                        >
                          {s.status === "graded" ? "Sửa điểm" : "Chấm"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </PageShell>
    </>
  );
}
