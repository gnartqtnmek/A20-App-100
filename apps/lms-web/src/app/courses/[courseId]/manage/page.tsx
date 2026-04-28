"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { getAccessToken, getUserRole } from "@/lib/auth-storage";
import type { AssignmentRead, CourseRead, LessonRead, ModuleRead, SubmissionRead } from "@/lib/types";
import { Card, EmptyState, ErrorBanner, PageShell } from "@/components/page-shell";
import { formatDate } from "@/lib/utils";

type Tab = "content" | "assignments" | "submissions";

export default function ManageCoursePage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  const role = getUserRole();

  const [tab, setTab] = useState<Tab>("content");
  const [course, setCourse] = useState<CourseRead | null>(null);
  const [modules, setModules] = useState<ModuleRead[]>([]);
  const [lessons, setLessons] = useState<Record<string, LessonRead[]>>({});
  const [assignments, setAssignments] = useState<AssignmentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Module form ---
  const [moduleTitle, setModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);

  // --- Lesson form ---
  const [lessonForms, setLessonForms] = useState<Record<string, { title: string; content_md: string; video_url: string }>>({});

  // --- Assignment form ---
  const [asgForm, setAsgForm] = useState({
    title: "", description: "", type: "essay" as "essay" | "file" | "quiz",
    due_at: "", max_score: "10", weight: "1", is_published: false,
  });
  const [addingAsg, setAddingAsg] = useState(false);

  // --- Submissions ---
  const [selectedAsgId, setSelectedAsgId] = useState<string>("");
  const [submissions, setSubmissions] = useState<SubmissionRead[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    if (!getAccessToken()) { router.replace("/login"); return; }
    if (role !== "instructor" && role !== "admin") { router.replace("/courses"); return; }
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
            const ls = await apiClient.listModuleLessons(mod.id).catch(() => []);
            lessonMap[mod.id] = ls.sort((x, y) => x.order_index - y.order_index);
          }),
        );
        if (!cancelled) setLessons(lessonMap);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, role, router]);

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setAddingModule(true);
    try {
      const mod = await apiClient.createModule(courseId, {
        title: moduleTitle.trim(),
        order_index: modules.length,
      });
      setModules((m) => [...m, mod]);
      setLessons((l) => ({ ...l, [mod.id]: [] }));
      setModuleTitle("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể thêm module.");
    } finally {
      setAddingModule(false);
    }
  }

  async function addLesson(moduleId: string) {
    const f = lessonForms[moduleId];
    if (!f?.title.trim()) return;
    try {
      const lesson = await apiClient.createLesson(moduleId, {
        title: f.title.trim(),
        content_md: f.content_md.trim() || null,
        video_url: f.video_url.trim() || null,
        order_index: (lessons[moduleId] ?? []).length,
      });
      setLessons((l) => ({ ...l, [moduleId]: [...(l[moduleId] ?? []), lesson] }));
      setLessonForms((lf) => ({ ...lf, [moduleId]: { title: "", content_md: "", video_url: "" } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể thêm bài giảng.");
    }
  }

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!asgForm.title.trim()) return;
    setAddingAsg(true);
    setError(null);
    try {
      const asg = await apiClient.createAssignment({
        course_id: courseId,
        title: asgForm.title.trim(),
        description: asgForm.description.trim() || null,
        type: asgForm.type,
        due_at: asgForm.due_at || null,
        max_score: parseFloat(asgForm.max_score) || 10,
        weight: parseFloat(asgForm.weight) || 1,
        is_published: asgForm.is_published,
      });
      setAssignments((a) => [...a, asg]);
      setAsgForm({ title: "", description: "", type: "essay", due_at: "", max_score: "10", weight: "1", is_published: false });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể tạo bài tập.");
    } finally {
      setAddingAsg(false);
    }
  }

  async function loadSubmissions(asgId: string) {
    setSelectedAsgId(asgId);
    setLoadingSubs(true);
    try {
      const subs = await apiClient.listAssignmentSubmissions(asgId);
      setSubmissions(subs);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  }

  async function submitGrade(submissionId: string) {
    const f = gradeForm[submissionId];
    if (!f?.score) return;
    setGradingId(submissionId);
    try {
      await apiClient.gradeSubmission(submissionId, {
        score: parseFloat(f.score),
        feedback: f.feedback || undefined,
      });
      setSubmissions((s) =>
        s.map((sub) =>
          sub.id === submissionId ? { ...sub, score: parseFloat(f.score), feedback: f.feedback, status: "graded" as const } : sub,
        ),
      );
      setGradeForm((g) => ({ ...g, [submissionId]: { score: "", feedback: "" } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chấm điểm thất bại.");
    } finally {
      setGradingId(null);
    }
  }

  if (loading) return <PageShell title="Quản lý khóa học"><Card>Đang tải...</Card></PageShell>;
  if (!course) return <PageShell title="Không tìm thấy"><ErrorBanner message={error} /><Card><Link href="/courses" className="text-sm text-blue-600 hover:underline">← Quay lại</Link></Card></PageShell>;

  const TAB_CLS = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-neutral-500 hover:text-neutral-800"}`;

  return (
    <PageShell
      title={`Quản lý: ${course.name}`}
      subtitle={`${course.code}${course.semester ? " · " + course.semester : ""}`}
      actions={
        <div className="flex gap-2">
          <Link href={`/courses/${courseId}`} className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
            Xem trang sinh viên
          </Link>
          <Link href="/courses" className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
            ← Khóa học
          </Link>
        </div>
      }
    >
      <ErrorBanner message={error} />

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button className={TAB_CLS("content")} onClick={() => setTab("content")}>Nội dung</button>
        <button className={TAB_CLS("assignments")} onClick={() => setTab("assignments")}>Bài tập</button>
        <button className={TAB_CLS("submissions")} onClick={() => setTab("submissions")}>Chấm bài</button>
      </div>

      {/* ── Tab: Content ── */}
      {tab === "content" && (
        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <Card key={mod.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Module {idx + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-neutral-900">{mod.title}</h3>

              {/* Lessons list */}
              {(lessons[mod.id] ?? []).length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
                  {(lessons[mod.id] ?? []).map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                      <span className="text-neutral-800">{lesson.title}</span>
                      <Link href={`/lessons/${lesson.id}/chunks`} className="text-xs text-blue-600 hover:underline">Chunks →</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-neutral-400">Chưa có bài giảng nào.</p>
              )}

              {/* Add lesson form */}
              <div className="mt-3 rounded-lg border border-dashed border-neutral-300 p-3">
                <p className="mb-2 text-xs font-medium text-neutral-500">+ Thêm bài giảng</p>
                <div className="space-y-2">
                  <input
                    placeholder="Tiêu đề bài giảng *"
                    value={lessonForms[mod.id]?.title ?? ""}
                    onChange={(e) => setLessonForms((lf) => ({ ...lf, [mod.id]: { ...lf[mod.id], title: e.target.value, content_md: lf[mod.id]?.content_md ?? "", video_url: lf[mod.id]?.video_url ?? "" } }))}
                    className="block w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <textarea
                    placeholder="Nội dung Markdown (tùy chọn)"
                    rows={3}
                    value={lessonForms[mod.id]?.content_md ?? ""}
                    onChange={(e) => setLessonForms((lf) => ({ ...lf, [mod.id]: { ...lf[mod.id], title: lf[mod.id]?.title ?? "", content_md: e.target.value, video_url: lf[mod.id]?.video_url ?? "" } }))}
                    className="block w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    placeholder="URL video (tùy chọn)"
                    value={lessonForms[mod.id]?.video_url ?? ""}
                    onChange={(e) => setLessonForms((lf) => ({ ...lf, [mod.id]: { ...lf[mod.id], title: lf[mod.id]?.title ?? "", content_md: lf[mod.id]?.content_md ?? "", video_url: e.target.value } }))}
                    className="block w-full rounded border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => addLesson(mod.id)}
                    disabled={!lessonForms[mod.id]?.title?.trim()}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    Thêm bài giảng
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {/* Add module form */}
          <Card>
            <form onSubmit={addModule} className="flex gap-2">
              <input
                placeholder="Tên module mới"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="block w-full rounded border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={addingModule || !moduleTitle.trim()}
                className="rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {addingModule ? "Đang thêm..." : "Thêm module"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* ── Tab: Assignments ── */}
      {tab === "assignments" && (
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-base font-semibold">Tạo bài tập</h3>
            <form onSubmit={addAssignment} className="grid gap-3 md:grid-cols-2">
              <input placeholder="Tiêu đề *" value={asgForm.title} onChange={(e) => setAsgForm((f) => ({ ...f, title: e.target.value }))} className="rounded border border-neutral-200 px-3 py-2 text-sm" />
              <select value={asgForm.type} onChange={(e) => setAsgForm((f) => ({ ...f, type: e.target.value as any }))} className="rounded border border-neutral-200 px-3 py-2 text-sm">
                <option value="essay">Essay</option>
                <option value="file">File</option>
                <option value="quiz">Quiz</option>
              </select>
              <textarea placeholder="Mô tả" rows={3} value={asgForm.description} onChange={(e) => setAsgForm((f) => ({ ...f, description: e.target.value }))} className="md:col-span-2 rounded border border-neutral-200 px-3 py-2 text-sm" />
              <input type="datetime-local" value={asgForm.due_at} onChange={(e) => setAsgForm((f) => ({ ...f, due_at: e.target.value }))} className="rounded border border-neutral-200 px-3 py-2 text-sm" />
              <input type="number" step="0.1" value={asgForm.max_score} onChange={(e) => setAsgForm((f) => ({ ...f, max_score: e.target.value }))} className="rounded border border-neutral-200 px-3 py-2 text-sm" />
              <input type="number" step="0.1" value={asgForm.weight} onChange={(e) => setAsgForm((f) => ({ ...f, weight: e.target.value }))} className="rounded border border-neutral-200 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-neutral-700 md:col-span-2">
                <input type="checkbox" checked={asgForm.is_published} onChange={(e) => setAsgForm((f) => ({ ...f, is_published: e.target.checked }))} />
                Công khai ngay
              </label>
              <button type="submit" disabled={addingAsg || !asgForm.title.trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                {addingAsg ? "Đang tạo..." : "Tạo bài tập"}
              </button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-3 text-base font-semibold">Danh sách bài tập</h3>
            {assignments.length === 0 ? <EmptyState message="Chưa có bài tập nào." /> : (
              <ul className="space-y-3">
                {assignments.map((a) => (
                  <li key={a.id} className="rounded-lg border border-neutral-200 p-3">
                    <p className="font-medium text-neutral-900">{a.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{a.type.toUpperCase()} · Hạn nộp: {formatDate(a.due_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Submissions ── */}
      {tab === "submissions" && (
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-base font-semibold">Chọn bài tập</h3>
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <button key={a.id} onClick={() => loadSubmissions(a.id)} className={`rounded-full border px-3 py-1 text-sm ${selectedAsgId === a.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"}`}>
                  {a.title}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-base font-semibold">Bài nộp</h3>
            {loadingSubs ? <p className="text-sm text-neutral-500">Đang tải...</p> : submissions.length === 0 ? (
              <EmptyState message="Chưa có bài nộp hoặc chưa chọn bài tập." />
            ) : (
              <ul className="space-y-3">
                {submissions.map((sub) => (
                  <li key={sub.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-900">Student: {sub.student_id.slice(0, 8)}…</p>
                      <span className="text-xs text-neutral-500">{sub.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Nộp lúc: {formatDate(sub.submitted_at)}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Điểm"
                        value={gradeForm[sub.id]?.score ?? ""}
                        onChange={(e) => setGradeForm((g) => ({ ...g, [sub.id]: { ...g[sub.id], score: e.target.value, feedback: g[sub.id]?.feedback ?? "" } }))}
                        className="rounded border border-neutral-200 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Nhận xét"
                        value={gradeForm[sub.id]?.feedback ?? ""}
                        onChange={(e) => setGradeForm((g) => ({ ...g, [sub.id]: { ...g[sub.id], score: g[sub.id]?.score ?? "", feedback: e.target.value } }))}
                        className="rounded border border-neutral-200 px-3 py-2 text-sm md:col-span-2"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button onClick={() => submitGrade(sub.id)} disabled={gradingId === sub.id} className="rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50">
                        {gradingId === sub.id ? "Đang lưu..." : "Lưu điểm"}
                      </button>
                    </div>
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
