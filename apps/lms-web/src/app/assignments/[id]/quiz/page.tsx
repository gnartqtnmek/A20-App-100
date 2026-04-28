"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { AssignmentRead, QuizQuestionRead, SubmissionRead } from "@/lib/types";
import { Card, ErrorBanner, PageShell } from "@/components/page-shell";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

type Answers = Record<string, string | string[]>;

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  disabled,
}: {
  question: QuizQuestionRead;
  index: number;
  answer: string | string[] | undefined;
  onChange: (qId: string, value: string | string[]) => void;
  disabled: boolean;
}) {
  const options =
    question.type === "true_false"
      ? [
          { value: "true", text: "Đúng" },
          { value: "false", text: "Sai" },
        ]
      : question.options;

  function handleSingle(value: string) {
    onChange(question.id, value);
  }

  function handleMulti(value: string, checked: boolean) {
    const current = Array.isArray(answer) ? answer : [];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    onChange(question.id, next);
  }

  return (
    <Card>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
          {index + 1}
        </span>
        <p className="pt-0.5 text-sm font-medium leading-6 text-neutral-900">
          {question.question}
          <span className="ml-2 text-xs font-normal text-neutral-500">({question.points} điểm)</span>
        </p>
      </div>

      <div className="ml-10 space-y-2">
        {options.map((opt) => {
          const checked =
            question.type === "multi_choice"
              ? Array.isArray(answer) && answer.includes(opt.value)
              : answer === opt.value;

          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition
                ${checked ? "border-black bg-neutral-50 font-medium" : "border-neutral-200 hover:border-neutral-400"}
                ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {question.type === "multi_choice" ? (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => handleMulti(opt.value, e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
              ) : (
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => handleSingle(opt.value)}
                  className="h-4 w-4 accent-black"
                />
              )}
              {opt.text}
            </label>
          );
        })}
      </div>
    </Card>
  );
}

export default function QuizPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assignmentId = params.id;
  const role = getUserRole();

  const [assignment, setAssignment] = useState<AssignmentRead | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionRead[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [submission, setSubmission] = useState<SubmissionRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (role !== "student") {
      router.replace(`/assignments/${assignmentId}`);
      return;
    }
    if (!assignmentId) return;

    let cancelled = false;
    (async () => {
      try {
        const [a, q] = await Promise.all([
          apiClient.getAssignment(assignmentId),
          apiClient.listQuizQuestions(assignmentId),
        ]);
        if (cancelled) return;
        if (a.type !== "quiz") {
          router.replace(`/assignments/${assignmentId}`);
          return;
        }
        setAssignment(a);
        setQuestions(q);

        if (a.time_limit_minutes) {
          timerRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
          }, 1000);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Không tải được bài quiz.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assignmentId, role, router]);

  const timeLimitSeconds = (assignment?.time_limit_minutes ?? 0) * 60;
  const remaining = timeLimitSeconds > 0 ? Math.max(0, timeLimitSeconds - elapsed) : null;

  useEffect(() => {
    if (remaining === 0 && !submission && !submitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  function handleAnswer(qId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  async function handleSubmit() {
    if (!assignment) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiClient.submitAssignment(assignment.id, {
        quiz_answers: answers as Record<string, unknown>,
      });
      setSubmission(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nộp bài thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const isOverdue = assignment?.due_at ? new Date(assignment.due_at) < new Date() : false;

  if (loading) {
    return (
      <PageShell title="Quiz">
        <Card>Đang tải bài quiz...</Card>
      </PageShell>
    );
  }

  if (!assignment) {
    return (
      <PageShell title="Không tìm thấy">
        <ErrorBanner message={error} />
      </PageShell>
    );
  }

  if (submission) {
    return (
      <PageShell
        title="Đã nộp bài"
        subtitle={assignment.title}
        actions={
          <Link
            href={`/courses/${assignment.course_id}`}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            ← Khóa học
          </Link>
        }
      >
        <Card>
          <p className="text-sm font-semibold text-emerald-700">
            Bài nộp đã được ghi nhận.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Trạng thái</dt>
              <dd className="mt-1 font-medium capitalize">{submission.status}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Nộp lúc</dt>
              <dd className="mt-1 font-medium">{formatDate(submission.submitted_at)}</dd>
            </div>
            {submission.score !== null && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Điểm</dt>
                <dd className="mt-1 font-medium">
                  {submission.score} / {assignment.max_score}
                </dd>
              </div>
            )}
            {submission.feedback && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Nhận xét</dt>
                <dd className="mt-1 whitespace-pre-wrap text-neutral-700">{submission.feedback}</dd>
              </div>
            )}
          </dl>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={assignment.title}
      subtitle={`Quiz · ${questions.length} câu · ${assignment.max_score} điểm`}
      actions={
        <div className="flex items-center gap-3">
          {remaining !== null && (
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-mono font-medium ${
                remaining < 60 ? "bg-rose-100 text-rose-700" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          )}
          <Link
            href={`/assignments/${assignmentId}`}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            ← Quay lại
          </Link>
        </div>
      }
    >
      <ErrorBanner message={error} />

      {isOverdue && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bài tập đã quá hạn. Bài nộp của bạn sẽ có trạng thái &quot;late&quot;.
        </div>
      )}

      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">Bài quiz chưa có câu hỏi nào.</p>
        </Card>
      ) : (
        <>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              answer={answers[q.id]}
              onChange={handleAnswer}
              disabled={submitting}
            />
          ))}

          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <span className="text-sm text-neutral-600">
              Đã trả lời {answeredCount} / {questions.length} câu
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "Đang nộp..." : "Nộp bài"}
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}
