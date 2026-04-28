"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { CourseRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const role = getUserRole();

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.listCourses();
        if (!cancelled) setCourses(data);
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
  }, [router]);

  async function onEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setEnrolling(true);
    setError(null);
    try {
      await apiClient.enrollWithCode(inviteCode.trim());
      const data = await apiClient.listCourses();
      setCourses(data);
      setInviteCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mã mời không hợp lệ.");
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <PageShell
      title="Khóa học"
      subtitle={
        role === "lecturer"
          ? "Danh sách lớp bạn đang phụ trách."
          : "Khóa học bạn đã enroll."
      }
      actions={
        (role === "lecturer" || role === "admin") ? (
          <Link
            href="/courses/new"
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tạo khóa học
          </Link>
        ) : undefined
      }
    >
      <ErrorBanner message={error} />

      {role === "student" && (
        <Card>
          <form onSubmit={onEnroll} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="text-sm font-medium text-neutral-800">Nhập mã mời để enroll</span>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="VD: CSE301-K65"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={enrolling || !inviteCode.trim()}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {enrolling ? "Đang enroll..." : "Tham gia"}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <Card>Đang tải...</Card>
      ) : courses.length === 0 ? (
        <EmptyState message="Chưa có khóa học nào." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="block">
              <Card className="h-full transition hover:border-black hover:shadow-md">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-neutral-500">{c.code}</span>
                  {c.semester && (
                    <span className="text-xs text-neutral-500">{c.semester}</span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-semibold text-neutral-900">{c.name}</h3>
                {c.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{c.description}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      c.is_published
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.is_published ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
