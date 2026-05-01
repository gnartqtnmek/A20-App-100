"use client";

import type { Assignment, Lesson, NotificationItem, Quiz } from "@/lib/lms";

type CourseProgress = {
  section_id: string;
  course_code: string;
  course_name: string;
  progress: string;
};

type Props = {
  courses: CourseProgress[];
  lessons: Lesson[];
  assignments: Assignment[];
  quizzes: Quiz[];
  notifications: NotificationItem[];
  averageScore: number;
  xpValue: number;
  streakDays: number;
  dueCount: number;
  badgesCount: number;
};

function formatDueDate(input?: string | null) {
  if (!input) return "No due date";
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return input;
  return value.toLocaleDateString();
}

export function StudentHomeStitch({
  courses,
  lessons,
  assignments,
  quizzes,
  notifications,
  averageScore,
  xpValue,
  streakDays,
  dueCount,
  badgesCount
}: Props) {
  const focusCourse = courses[0];
  const focusLesson = lessons[0];
  const upcoming = assignments.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <article className="relative overflow-hidden rounded-xl border border-[#c3c6d0] bg-white p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#1a4173]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Total experience</p>
          <p className="mt-2 text-4xl font-bold text-[#001733]">{xpValue}</p>
          <p className="mt-2 text-xs font-medium text-emerald-700">+12% this week</p>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-[#c3c6d0] bg-white p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#ba1a1a]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Current streak</p>
          <p className="mt-2 text-4xl font-bold text-[#001733]">{streakDays}</p>
          <p className="mt-2 text-xs text-slate-500">days in a row</p>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-[#c3c6d0] bg-white p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#f6bb8a]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Due soon</p>
          <p className="mt-2 text-4xl font-bold text-[#001733]">{dueCount}</p>
          <p className="mt-2 text-xs font-medium text-red-700">Earliest: {formatDueDate(assignments[0]?.due_at)}</p>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-[#c3c6d0] bg-white p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#2e7d32]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Badges earned</p>
          <p className="mt-2 text-4xl font-bold text-[#001733]">{badgesCount}</p>
          <p className="mt-2 text-xs text-slate-500">Average score: {averageScore.toFixed(1)}/10</p>
        </article>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#001733]">Continue Learning</h3>
              <button className="text-sm font-semibold text-[#1a4173]">View all courses</button>
            </div>
            <article className="overflow-hidden rounded-xl border border-[#c3c6d0] bg-white">
              <div className="flex flex-col md:flex-row">
                <div className="h-40 bg-gradient-to-br from-[#d5e3ff] to-[#a8c8fd] md:h-auto md:w-1/3" />
                <div className="space-y-3 p-6 md:w-2/3">
                  <span className="inline-block rounded bg-[#d5e3ff] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#001733]">
                    {focusCourse?.course_code ?? "Course"}
                  </span>
                  <h4 className="text-xl font-bold text-[#001733]">{focusCourse?.course_name ?? "No course available"}</h4>
                  <p className="text-sm text-slate-600">Next lesson: {focusLesson?.title ?? "No lesson available"}</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Course Progress</span>
                      <span className="text-[#1a4173]">{focusCourse?.progress ?? "0%"}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#1a4173]" style={{ width: focusCourse?.progress ?? "0%" }} />
                    </div>
                  </div>
                  <button className="rounded-lg bg-[#1a4173] px-5 py-2.5 text-sm font-semibold text-white">Resume Lesson</button>
                </div>
              </div>
            </article>
          </section>

          <section>
            <h3 className="mb-4 text-xl font-semibold text-[#001733]">Recent Activity</h3>
            <article className="overflow-hidden rounded-xl border border-[#c3c6d0] bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#f4f3f8] text-[11px] uppercase tracking-[0.1em] text-slate-500">
                    <th className="px-5 py-3">Activity</th>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzes.slice(0, 1).map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-[#001733]">{quiz.title}</td>
                      <td className="px-5 py-3 text-slate-600">{focusCourse?.course_code ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Published</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{new Date(quiz.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {assignments.slice(0, 1).map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-[#001733]">{assignment.title}</td>
                      <td className="px-5 py-3 text-slate-600">{focusCourse?.course_code ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Open</span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{formatDueDate(assignment.due_at)}</td>
                    </tr>
                  ))}
                  {notifications.slice(0, 1).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-[#001733]">{item.title}</td>
                      <td className="px-5 py-3 text-slate-600">System</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {item.is_read ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-4">
          <section className="relative overflow-hidden rounded-xl bg-[#1a4173] p-7 text-white">
            <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-white/10" />
            <p className="text-lg font-bold">Brainio Buddy</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-blue-100">Personalized Tutor</p>
            <p className="mt-4 text-sm text-blue-100">
              You are progressing well. Focus next on high-priority tasks and close pending submissions.
            </p>
            <div className="mt-5 space-y-2">
              <button className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-[#1a4173]">Start Chat Session</button>
              <button className="w-full rounded-lg border border-white/40 py-2.5 text-sm font-semibold text-white">Ask a Question</button>
            </div>
          </section>

          <section className="rounded-xl border border-[#c3c6d0] bg-white p-6">
            <h4 className="text-base font-bold text-[#001733]">Upcoming Deadlines</h4>
            <div className="mt-4 space-y-4">
              {upcoming.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ffdad6] text-xs font-bold text-[#ba1a1a]">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#001733]">{item.title}</p>
                    <p className="text-xs text-slate-500">{formatDueDate(item.due_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

