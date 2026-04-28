"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { GradeRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";
import { formatDate } from "@/lib/utils";

export default function GradesPage() {
  const router = useRouter();
  const role = getUserRole();
  const [grades, setGrades] = useState<GradeRead[]>([]);
  const [loading, setLoading] = useState(role === "student");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (role !== "student") {
      // Lecturer/admin cần page khác (gradebook theo lớp).
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.listMyGrades();
        if (!cancelled) setGrades(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(err instanceof Error ? err.message : "Lỗi tải điểm.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, role]);

  // Group by course for a clean per-course summary.
  const byCourse = useMemo(() => {
    const map = new Map<string, GradeRead[]>();
    for (const g of grades) {
      const arr = map.get(g.course_id) ?? [];
      arr.push(g);
      map.set(g.course_id, arr);
    }
    return Array.from(map.entries());
  }, [grades]);

  const weightedAvg = (entries: GradeRead[]) => {
    const totalW = entries.reduce((s, g) => s + g.weight, 0);
    if (totalW === 0) return null;
    const num = entries.reduce(
      (s, g) => s + (g.score / g.max_score) * 10 * g.weight,
      0,
    );
    return num / totalW;
  };

  if (role !== "student") {
    return (
      <PageShell title="Sổ điểm">
        <Card>
          <p className="text-sm text-neutral-700">
            Trang này dành cho sinh viên. Giảng viên xem sổ điểm theo lớp tại trang chi tiết khóa học
            (sẽ bổ sung trong Sprint 3).
          </p>
          <Link href="/courses" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            ← Đến danh sách khóa học
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Sổ điểm cá nhân" subtitle="Kết quả các bài tập đã được chấm.">
      <ErrorBanner message={error} />

      {loading ? (
        <Card>Đang tải...</Card>
      ) : grades.length === 0 ? (
        <EmptyState message="Bạn chưa có điểm nào." />
      ) : (
        <div className="space-y-4">
          {byCourse.map(([courseId, entries]) => {
            const avg = weightedAvg(entries);
            return (
              <Card key={courseId}>
                <div className="mb-3 flex items-center justify-between">
                  <Link
                    href={`/courses/${courseId}`}
                    className="font-mono text-sm text-neutral-700 hover:underline"
                  >
                    Khóa #{courseId.slice(0, 8)}…
                  </Link>
                  {avg !== null && (
                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">
                      Trung bình có trọng số: {avg.toFixed(2)} / 10
                    </span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th className="pb-2">Bài tập</th>
                      <th className="pb-2">Điểm</th>
                      <th className="pb-2">Trọng số</th>
                      <th className="pb-2">Ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {entries.map((g) => (
                      <tr key={g.id}>
                        <td className="py-2 font-mono text-xs text-neutral-700">
                          <Link
                            href={`/assignments/${g.assignment_id}`}
                            className="hover:underline"
                          >
                            {g.assignment_id.slice(0, 8)}…
                          </Link>
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
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
