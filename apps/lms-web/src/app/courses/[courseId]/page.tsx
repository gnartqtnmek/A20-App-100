"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { AssignmentRead, CourseRead, LessonRead, ModuleRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";
import { formatDate } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;

  const role = getUserRole();
  const [course, setCourse] = useState<CourseRead | null>(null);
  const [modules, setModules] = useState<ModuleRead[]>([]);
  const [lessons, setLessons] = useState<Record<string, LessonRead[]>>({});
  const [assignments, setAssignments] = useState<AssignmentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (!courseId) return;

    let cancelled = false;
    (async () => {
      try {
        const [c, m, a] = await Promise.all([
          apiClient.getCourse(courseId),
          apiClient.listCourseModules(courseId).catch(() => [] as ModuleRead[]),
          apiClient.listCourseAssignments(courseId).catch(() => [] as AssignmentRead[]),
        ]);
        if (cancelled) return;
        const sorted = m.sort((x, y) => x.order_index - y.order_index);
        setCourse(c);
        setModules(sorted);
        setAssignments(a);

        const lessonMap: Record<string, LessonRead[]> = {};
        await Promise.all(
          sorted.map(async (mod) => {
            try {
              const ls = await apiClient.listModuleLessons(mod.id);
              lessonMap[mod.id] = ls.sort((x, y) => x.order_index - y.order_index);
            } catch {
              lessonMap[mod.id] = [];
            }
          }),
        );
        if (!cancelled) setLessons(lessonMap);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Lỗi tải khóa học.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, router]);

  if (loading) {
    return (
      <PageShell title="Chi tiết khóa học">
        <Card>Đang tải...</Card>
      </PageShell>
    );
  }

  if (!course) {
    return (
      <PageShell title="Không tìm thấy khóa học">
        <ErrorBanner message={error} />
        <Card>
          <Link href="/courses" className="text-sm text-blue-600 hover:underline">
            ← Quay về danh sách
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={course.name}
      subtitle={`${course.code}${course.semester ? " · " + course.semester : ""}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {(role === "lecturer" || role === "admin") && (
            <>
              <Link
                href={`/courses/${courseId}/manage`}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Quản lý khóa học
              </Link>
              <Link
                href={`/courses/${courseId}/gradebook`}
                className="rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Sổ điểm lớp
              </Link>
            </>
          )}
          <Link
            href="/courses"
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
          >
            ← Tất cả khóa học
          </Link>
        </div>
      }
    >
      <ErrorBanner message={error} />

      {course.description && (
        <Card>
          <p className="text-sm leading-7 text-neutral-700">{course.description}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Nội dung khóa học</h2>
          {modules.length === 0 ? (
            <EmptyState message="Chưa có module nào." />
          ) : (
            <ol className="space-y-3">
              {modules.map((m, idx) => (
                <li key={m.id} className="rounded-lg border border-neutral-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Module {idx + 1}
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">{m.title}</p>
                  {m.description && (
                    <p className="mt-1 text-sm text-neutral-600">{m.description}</p>
                  )}
                  {(lessons[m.id] ?? []).length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
                      {(lessons[m.id] ?? []).map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-neutral-700">{lesson.title}</span>
                          {(role === "lecturer" || role === "admin") && (
                            <Link
                              href={`/lessons/${lesson.id}/chunks`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Chunks →
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Bài tập</h2>
          {assignments.length === 0 ? (
            <EmptyState message="Chưa có bài tập nào." />
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li key={a.id} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-baseline justify-between">
                    <Link
                      href={`/assignments/${a.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-neutral-500">{a.max_score} điểm</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {a.type.toUpperCase()} · Hạn nộp: {formatDate(a.due_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
