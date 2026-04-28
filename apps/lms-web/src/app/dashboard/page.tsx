"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiClient, ApiError } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-storage";
import type {
  AssignmentRead,
  CourseRead,
  GradeRead,
  NotificationRead,
  UserRead,
} from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRead | null>(null);
  const [courses, setCourses] = useState<CourseRead[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRead[]>([]);
  const [grades, setGrades] = useState<GradeRead[]>([]);
  const [notifications, setNotifications] = useState<NotificationRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [me, myCourses] = await Promise.all([apiClient.me(), apiClient.listCourses()]);
        if (cancelled) return;
        setUser(me);
        setCourses(myCourses);

        const [allAssignments, myGrades, notif] = await Promise.all([
          Promise.all(
            myCourses.slice(0, 5).map((c) => apiClient.listCourseAssignments(c.id).catch(() => []))
          ).then((r) => r.flat()),
          me.role === "student"
            ? apiClient.listMyGrades().catch(() => [] as GradeRead[])
            : Promise.resolve([] as GradeRead[]),
          apiClient.listMyNotifications().catch(() => [] as NotificationRead[]),
        ]);
        if (cancelled) return;
        setAssignments(allAssignments);
        setGrades(myGrades);
        setNotifications(notif);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const upcomingAssignments = assignments
    .filter((a) => a.due_at && new Date(a.due_at) >= new Date())
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5);

  const recentGrades = grades
    .slice()
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .slice(0, 5);

  const ROLE_SUBTITLE: Record<string, string> = {
    student: "Tổng quan các khóa học, bài tập sắp đến hạn và điểm gần nhất.",
    lecturer: "Tổng quan các khóa bạn dạy và bài tập đang hoạt động.",
    admin: "Tổng quan hệ thống.",
  };

  return (
    <PageShell
      title={user ? `Xin chào, ${user.full_name}` : "Dashboard"}
      subtitle={user ? (ROLE_SUBTITLE[user.role] ?? "Tổng quan hệ thống.") : undefined}
    >
      <ErrorBanner message={error} />

      {loading ? (
        <Card>Đang tải dữ liệu...</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {user?.role === "lecturer" ? "Lớp tôi đang dạy" : "Khóa học của tôi"}
              </h2>
              <Link href="/courses" className="text-sm font-medium text-blue-600 hover:underline">
                Xem tất cả →
              </Link>
            </div>
            {courses.length === 0 ? (
              <EmptyState
                message={
                  user?.role === "student"
                    ? "Bạn chưa enroll vào khóa nào. Hãy nhập invite code từ giảng viên."
                    : "Bạn chưa tạo khóa nào."
                }
              />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {courses.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-3">
                    <Link href={`/courses/${c.id}`} className="block hover:bg-neutral-50">
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium text-neutral-900">{c.code}</span>
                        <span className="text-xs text-neutral-500">{c.semester ?? ""}</span>
                      </div>
                      <p className="text-sm text-neutral-700">{c.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Sắp đến hạn</h2>
            {upcomingAssignments.length === 0 ? (
              <EmptyState message="Không có bài tập sắp đến hạn." />
            ) : (
              <ul className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <li key={a.id} className="rounded-lg border border-neutral-200 p-3">
                    <Link href={`/assignments/${a.id}`} className="font-medium text-neutral-900 hover:underline">
                      {a.title}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-500">
                      Hạn nộp: {formatDate(a.due_at)} · {a.max_score} điểm
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {user?.role === "student" && (
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Điểm gần nhất</h2>
                <Link href="/grades" className="text-sm font-medium text-blue-600 hover:underline">
                  Xem sổ điểm →
                </Link>
              </div>
              {recentGrades.length === 0 ? (
                <EmptyState message="Chưa có điểm nào." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th className="pb-2">Bài tập</th>
                      <th className="pb-2">Điểm</th>
                      <th className="pb-2">Trọng số</th>
                      <th className="pb-2">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {recentGrades.map((g) => (
                      <tr key={g.id}>
                        <td className="py-2 font-mono text-xs text-neutral-700">
                          {g.assignment_id.slice(0, 8)}…
                        </td>
                        <td className="py-2 font-medium">
                          {g.score} / {g.max_score}
                        </td>
                        <td className="py-2 text-neutral-600">{g.weight}</td>
                        <td className="py-2 text-neutral-500">{formatDate(g.recorded_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Thông báo</h2>
            {notifications.length === 0 ? (
              <EmptyState message="Không có thông báo mới." />
            ) : (
              <ul className="space-y-2">
                {notifications.slice(0, 5).map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg p-2 text-sm ${
                      n.is_read ? "bg-neutral-50 text-neutral-700" : "bg-blue-50 text-blue-900"
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs">{n.body}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
