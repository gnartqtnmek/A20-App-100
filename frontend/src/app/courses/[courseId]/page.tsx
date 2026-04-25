"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import type { AssignmentRead, ModuleRead } from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [modules, setModules] = useState<ModuleRead[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [moduleList, assignmentList] = await Promise.all([
          apiClient.listCourseModules(courseId),
          apiClient.listCourseAssignments(courseId),
        ]);

        if (!mounted) {
          return;
        }

        setModules(moduleList);
        setAssignments(assignmentList);
      } catch (err) {
        if (!mounted) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load course data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (loading) {
    return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">Loading course...</main>;
  }

  if (error) {
    return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-rose-600">{error}</main>;
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Course Modules</h1>
        {modules.length === 0 ? (
          <p className="mt-2 text-neutral-600">No modules available.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {modules.map((module) => (
              <li key={module.id} className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Week {module.order_index + 1}
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900">{module.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{module.description ?? "No details"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Assignments</h2>
        {assignments.length === 0 ? (
          <p className="mt-2 text-neutral-600">No assignments published yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="rounded-xl border border-neutral-200 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">{assignment.type}</p>
                <p className="mt-1 text-base font-semibold text-neutral-900">{assignment.title}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No deadline"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
