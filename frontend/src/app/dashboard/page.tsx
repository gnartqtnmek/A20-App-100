"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import type { CourseRead, NotificationRead, UserRead } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [courses, setCourses] = useState<CourseRead[]>([]);
  const [notifications, setNotifications] = useState<NotificationRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [me, courseList, noticeList] = await Promise.all([
          apiClient.me(),
          apiClient.listCourses(),
          apiClient.listMyNotifications(true),
        ]);

        if (!mounted) {
          return;
        }
        setUser(me);
        setCourses(courseList);
        setNotifications(noticeList);
      } catch (err) {
        if (!mounted) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const greeting = useMemo(() => {
    if (!user) {
      return "Hello";
    }
    return `Hello, ${user.full_name}`;
  }, [user]);

  if (loading) {
    return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">Loading dashboard...</main>;
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-rose-600">
        {error}. Please sign in again.
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-neutral-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{greeting}</h1>
        <p className="mt-2 text-neutral-600">
          You are signed in as <span className="font-medium">{user?.role ?? "unknown"}</span>.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-neutral-900">Courses</h2>
        {courses.length === 0 ? (
          <p className="mt-2 text-neutral-600">No courses yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {courses.map((course) => (
              <li key={course.id} className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                  {course.code}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">{course.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                  {course.description ?? "No description"}
                </p>
                <Link
                  href={`/courses/${course.id}`}
                  className="mt-3 inline-block text-sm font-medium text-black underline"
                >
                  Open course
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Unread Notifications</h2>
        {notifications.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">All caught up.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {notifications.slice(0, 8).map((item) => (
              <li key={item.id} className="rounded-xl bg-neutral-100 p-3">
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="mt-1 text-xs text-neutral-600">{item.body ?? "No details"}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}
