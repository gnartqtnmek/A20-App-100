"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ModuleCard } from "@/components/ui/module-card";
import { StudentHomeStitch } from "@/components/portal/student-home-stitch";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  markNotificationRead,
  myProfile,
  notifications,
  studentCommunityTopics,
  studentCreateCommunityTopic,
  studentAssignments,
  studentAttendance,
  studentCourseDetail,
  studentGrades,
  studentLessons,
  studentListCourses,
  studentQuizQuestions,
  studentQuizzes,
  studentSubmitAssignment,
  studentSubmitQuiz,
  updateMyProfile,
  uploadUserFile
} from "@/lib/api";
import type {
  Assignment,
  AttendanceRecord,
  CourseDetail,
  CourseSummary,
  GradeItem,
  Lesson,
  NotificationItem,
  Quiz,
  QuizQuestion,
  ForumTopicItem
} from "@/lib/lms";
import { type DashboardPayload, type ModuleItem } from "@/lib/roles";

type Props = {
  accessToken: string;
  activeModule: string;
  dashboard: DashboardPayload;
  modules: ModuleItem[];
};

type ProfileForm = {
  display_name: string;
  phone_number: string;
  password: string;
  theme_mode: string;
  notification_channels: string;
};

function toneByStatus(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("done") ||
    normalized.includes("submitted") ||
    normalized.includes("present") ||
    normalized.includes("active") ||
    normalized.includes("ready")
  ) {
    return "text-[#2f7f4c]";
  }
  if (normalized.includes("pending") || normalized.includes("open") || normalized.includes("next") || normalized.includes("draft")) {
    return "text-[#5f7198]";
  }
  if (normalized.includes("late") || normalized.includes("absent") || normalized.includes("locked") || normalized.includes("risk")) {
    return "text-[#b33a52]";
  }
  return "text-[#5f7198]";
}

function matchText(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

function QuickActionStrip({ quick, filter, exportText }: { quick: string; filter: string; exportText: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Quick action</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{quick}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Filter</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{filter}</p>
          </div>
        </div>
      </article>
      <article className="rounded-[26px] border border-[#c8d2e8] bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-2xl bg-[#c8e4de]" />
          <div>
            <p className="text-2xl font-bold leading-none text-[#151b2d]">Export</p>
            <p className="mt-1 text-sm text-[#6f7f9f]">{exportText}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function AnalyticsSection({
  insights,
  recommendation
}: {
  insights: { signal: string; action: string }[];
  recommendation: string;
}) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
          <p className="text-4xl font-bold leading-none text-[#151b2d]">Analytics chart area</p>
          <div className="mt-6 flex h-44 items-end gap-5">
            {[38, 66, 49, 82, 60, 88, 71].map((value, idx) => (
              <div
                key={`${value}-${idx}`}
                className={`w-10 rounded-t-2xl ${idx % 2 === 0 ? "bg-[#8443df]" : "bg-[#3864e7]"}`}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </article>

        <DataTable
          title="Insights"
          columns={[
            { key: "signal", header: "Signal", render: (row: { signal: string; action: string }) => row.signal },
            { key: "action", header: "Action", render: (row: { signal: string; action: string }) => row.action }
          ]}
          rows={insights}
          rowKey={(row) => `${row.signal}-${row.action}`}
          emptyTitle="No insights"
        />
      </div>

      <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
        <div className="flex gap-3">
          <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ede5ce]" />
          <div>
            <p className="text-2xl font-bold text-[#151b2d]">Recommendation</p>
            <p className="text-sm text-[#6f7f9f]">{recommendation}</p>
          </div>
        </div>
      </article>
    </>
  );
}

const MODULE_SUBTITLE: Record<string, string> = {
  home: "Personal learning hub with streak, XP, deadlines and motivation.",
  my_courses: "Browse active, completed and archived courses.",
  lessons: "Watch video, read documents, take notes and bookmark.",
  assignments: "Submit files, text, links, code and group work.",
  quiz_exams: "Start quizzes, view attempts and exam windows.",
  grades: "View gradebook, weights, feedback and phuc khao requests.",
  attendance: "QR code attendance, history and absence reasons.",
  calendar: "Unified lessons, exams, deadlines and events calendar.",
  achievements: "Badges, streaks, XP and motivational progress.",
  community: "Course discussions, Q&A, comments and reports.",
  messages: "Private messages, system notifications and read status."
};

export function StudentWorkspace({ accessToken, activeModule, dashboard, modules }: Props) {
  const searchParams = useSearchParams();
  const sectionIdFromQuery = searchParams.get("sectionId") ?? "";
  const assignmentIdFromQuery = searchParams.get("assignmentId") ?? "";
  const quizIdFromQuery = searchParams.get("quizId") ?? "";

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allGrades, setAllGrades] = useState<GradeItem[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopicItem[]>([]);

  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [notificationsMeta, setNotificationsMeta] = useState({ page: 1, limit: 20, total: 0 });

  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState("");

  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionGroupMembers, setSubmissionGroupMembers] = useState("");
  const [submissionComment, setSubmissionComment] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [communityForm, setCommunityForm] = useState({ title: "", content: "" });

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    display_name: "",
    phone_number: "",
    password: "",
    theme_mode: "Light",
    notification_channels: "In-app, Email"
  });

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBase() {
      setIsBusy(true);
      setError("");
      try {
        const [courseData, gradeData, messageData, profileData] = await Promise.all([
          studentListCourses(accessToken),
          studentGrades(accessToken),
          notifications(accessToken, 1, 20),
          myProfile(accessToken)
        ]);

        if (cancelled) return;
        setCourses(courseData);
        setAllGrades(gradeData);
        setNotificationItems(messageData.items);
        setNotificationsMeta(messageData.meta);
        setProfileForm((prev) => ({
          ...prev,
          display_name: profileData.full_name
        }));
        if (courseData.length > 0) {
          const queryExists = sectionIdFromQuery && courseData.some((course) => course.section_id === sectionIdFromQuery);
          setSelectedSectionId(queryExists ? sectionIdFromQuery : courseData[0].section_id);
        }
      } catch {
        if (!cancelled) setError("Cannot load student data.");
      } finally {
        if (!cancelled) setIsBusy(false);
      }
    }

    void loadBase();
    return () => {
      cancelled = true;
    };
  }, [accessToken, sectionIdFromQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadSectionData() {
      if (!selectedSectionId) return;
      setError("");
      try {
        const [detailData, lessonData, assignmentData, quizData, attendanceData, topicData] = await Promise.all([
          studentCourseDetail(selectedSectionId, accessToken),
          studentLessons(selectedSectionId, accessToken),
          studentAssignments(selectedSectionId, accessToken),
          studentQuizzes(selectedSectionId, accessToken),
          studentAttendance(accessToken, selectedSectionId),
          studentCommunityTopics(selectedSectionId, accessToken)
        ]);
        if (cancelled) return;
        setDetail(detailData);
        setLessons(lessonData);
        setAssignments(assignmentData);
        setQuizzes(quizData);
        setAttendance(attendanceData);
        setForumTopics(topicData);
        if (assignmentData.length > 0) {
          const queryAssignmentExists = assignmentIdFromQuery && assignmentData.some((assignment) => assignment.id === assignmentIdFromQuery);
          if (queryAssignmentExists) {
            setSelectedAssignmentId(assignmentIdFromQuery);
          } else if (!selectedAssignmentId || !assignmentData.some((assignment) => assignment.id === selectedAssignmentId)) {
            setSelectedAssignmentId(assignmentData[0].id);
          }
        }
        if (quizData.length > 0) {
          const queryQuizExists = quizIdFromQuery && quizData.some((quiz) => quiz.id === quizIdFromQuery);
          if (queryQuizExists) {
            setSelectedQuizId(quizIdFromQuery);
          } else if (!selectedQuizId || !quizData.some((quiz) => quiz.id === selectedQuizId)) {
            setSelectedQuizId(quizData[0].id);
          }
        }
      } catch {
        if (!cancelled) setError("Cannot load section data.");
      }
    }

    void loadSectionData();
    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedSectionId, selectedAssignmentId, selectedQuizId, assignmentIdFromQuery, quizIdFromQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuizQuestions() {
      if (!selectedQuizId) {
        setQuizQuestions([]);
        return;
      }
      try {
        const data = await studentQuizQuestions(selectedQuizId, accessToken);
        if (cancelled) return;
        setQuizQuestions(data);
        setQuizAnswers({});
      } catch {
        if (!cancelled) setError("Cannot load quiz questions.");
      }
    }

    void loadQuizQuestions();
    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedQuizId]);

  const sectionGrades = useMemo(
    () => allGrades.filter((item) => item.section_id === selectedSectionId),
    [allGrades, selectedSectionId]
  );

  const averageScore = useMemo(() => {
    if (allGrades.length === 0) return 0;
    const total = allGrades.reduce((sum, item) => sum + item.score, 0);
    return total / allGrades.length;
  }, [allGrades]);

  const xpValue = useMemo(() => Math.round(allGrades.reduce((sum, item) => sum + item.score * 10, 0)), [allGrades]);

  const streakDays = useMemo(() => {
    let streak = 0;
    for (let i = attendance.length - 1; i >= 0; i -= 1) {
      if (attendance[i].status.toLowerCase() === "present") {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [attendance]);

  const badgesCount = useMemo(() => Math.max(1, Math.floor(xpValue / 100)), [xpValue]);

  const dueCount = useMemo(() => assignments.length, [assignments]);

  const coursesWithProgress = useMemo(
    () =>
      courses
        .map((course) => {
          const gradesBySection = allGrades.filter((item) => item.section_id === course.section_id);
          const sectionAvg =
            gradesBySection.length > 0
              ? Math.round((gradesBySection.reduce((sum, item) => sum + item.score, 0) / gradesBySection.length) * 10)
              : 0;
          return {
            ...course,
            progress: `${Math.max(0, Math.min(100, sectionAvg))}%`
          };
        })
        .filter((course) =>
          matchText(`${course.course_name} ${course.course_code} ${course.section_code} ${course.lecturer_name ?? ""}`, search)
        ),
    [allGrades, courses, search]
  );

  const filteredLessons = useMemo(
    () => lessons.filter((item) => matchText(`${item.title} ${item.content}`, search)),
    [lessons, search]
  );

  const filteredAssignments = useMemo(
    () => assignments.filter((item) => matchText(`${item.title} ${item.description}`, search)),
    [assignments, search]
  );

  const filteredQuizzes = useMemo(
    () => quizzes.filter((item) => matchText(`${item.title} ${item.max_score}`, search)),
    [quizzes, search]
  );

  const filteredGrades = useMemo(
    () => sectionGrades.filter((item) => matchText(`${item.source_title} ${item.source_type} ${item.feedback}`, search)),
    [search, sectionGrades]
  );

  const filteredAttendance = useMemo(
    () => attendance.filter((item) => matchText(`${item.status} ${item.note} ${item.attendance_date}`, search)),
    [attendance, search]
  );

  const filteredNotifications = useMemo(
    () => notificationItems.filter((item) => matchText(`${item.title} ${item.message} ${item.channel}`, search)),
    [notificationItems, search]
  );

  const filteredForumTopics = useMemo(
    () => forumTopics.filter((item) => matchText(`${item.title} ${item.content} ${item.status}`, search)),
    [forumTopics, search]
  );

  async function reloadNotifications(page = notificationsMeta.page) {
    const response = await notifications(accessToken, page, notificationsMeta.limit);
    setNotificationItems(response.items);
    setNotificationsMeta(response.meta);
  }

  async function handleMarkRead(notificationId: string) {
    setIsBusy(true);
    setError("");
    try {
      await markNotificationRead(notificationId, accessToken);
      await reloadNotifications(notificationsMeta.page);
    } catch {
      setError("Cannot mark notification as read.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmitAssignment(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!selectedAssignmentId || !submissionText.trim()) {
      setError("Assignment and submission text are required.");
      return;
    }
    setIsBusy(true);
    try {
      let attachmentPart = "";
      if (submissionFile) {
        const uploaded = await uploadUserFile({ module: "student_assignment", file: submissionFile }, accessToken);
        attachmentPart = `\nFile: ${uploaded.item.original_name} (${uploaded.item.path})`;
      }
      const payloadContent =
        `Text: ${submissionText}` +
        `${submissionLink ? `\nExternal link: ${submissionLink}` : ""}` +
        `${submissionGroupMembers ? `\nGroup members: ${submissionGroupMembers}` : ""}` +
        `${submissionComment ? `\nComments: ${submissionComment}` : ""}` +
        attachmentPart;
      await studentSubmitAssignment(selectedAssignmentId, payloadContent, accessToken);
      setSubmissionText("");
      setSubmissionLink("");
      setSubmissionGroupMembers("");
      setSubmissionComment("");
      setSubmissionFile(null);
      setError("");
    } catch {
      setError("Cannot submit assignment.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmitQuiz() {
    setError("");
    if (!selectedQuizId || quizQuestions.length === 0) return;
    setIsBusy(true);
    try {
      const result = await studentSubmitQuiz(selectedQuizId, quizAnswers, accessToken);
      setQuizResult(`Submitted. Score ${result.score}/${result.max_score}`);
      const gradeData = await studentGrades(accessToken);
      setAllGrades(gradeData);
    } catch {
      setError("Cannot submit quiz.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!profileForm.display_name.trim()) {
      setError("Display name is required.");
      return;
    }
    setIsBusy(true);
    try {
      await updateMyProfile({ full_name: profileForm.display_name.trim() }, accessToken);
      setError("");
    } catch {
      setError("Cannot save profile.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateCommunityTopic(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!selectedSectionId || !communityForm.title.trim()) {
      setError("Section and topic title are required.");
      return;
    }
    setIsBusy(true);
    try {
      await studentCreateCommunityTopic(
        {
          section_id: selectedSectionId,
          title: communityForm.title.trim(),
          content: communityForm.content.trim()
        },
        accessToken
      );
      setCommunityForm({ title: "", content: "" });
      const topicData = await studentCommunityTopics(selectedSectionId, accessToken);
      setForumTopics(topicData);
    } catch {
      setError("Cannot create community topic.");
    } finally {
      setIsBusy(false);
    }
  }

  const activeModuleTitle = modules.find((item) => item.key === activeModule)?.title ?? "Student";
  const headerTitle = activeModule === "home" ? "Student Home Dashboard" : activeModuleTitle;
  const subtitle = MODULE_SUBTITLE[activeModule] ?? dashboard.header_subtitle;

  const availableModules = [
    "home",
    "my_courses",
    "lessons",
    "assignments",
    "quiz_exams",
    "grades",
    "attendance",
    "calendar",
    "achievements",
    "community",
    "messages"
  ];

  return (
    <section className="space-y-5">
      <PageHeader title={headerTitle} subtitle={subtitle} />

      <div className="brainio-card rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search section data..."
          className="brainio-input w-full max-w-[320px] rounded-lg px-3 py-2 text-sm text-slate-700"
        />
        {courses.map((course) => (
          <button
            key={course.section_id}
            type="button"
            onClick={() => setSelectedSectionId(course.section_id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              selectedSectionId === course.section_id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {course.section_code}
          </button>
        ))}
        </div>
      </div>

      {error ? <p className="text-sm text-[#b32047]">{error}</p> : null}

      {activeModule === "home" ? (
        <StudentHomeStitch
          courses={coursesWithProgress}
          lessons={filteredLessons}
          assignments={filteredAssignments}
          quizzes={filteredQuizzes}
          notifications={filteredNotifications}
          averageScore={averageScore}
          xpValue={xpValue}
          streakDays={streakDays}
          dueCount={dueCount}
          badgesCount={badgesCount}
        />
      ) : null}

      {activeModule === "my_courses" ? (
        <>
          <DataTable
            title="Courses"
            columns={[
              { key: "course", header: "Course", render: (row: (CourseSummary & { progress: string })) => row.course_name },
              { key: "progress", header: "Progress", render: (row: (CourseSummary & { progress: string })) => row.progress },
              { key: "lecturer", header: "Lecturer", render: (row: (CourseSummary & { progress: string })) => row.lecturer_name ?? "TBD" }
            ]}
            rows={coursesWithProgress}
            rowKey={(row) => row.section_id}
            emptyTitle="No enrolled courses"
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Syllabus</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Objectives, outcomes, rules and grading policy.</p>
                </div>
              </div>
            </article>
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Weekly Modules</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Unlock content by schedule or prerequisite.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Learning modules"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => <span className={toneByStatus(row.state)}>{row.state}</span> }
              ]}
              rows={lessons.slice(0, 3).map((lesson, index) => ({ name: `Week ${index + 1}`, state: index === 0 ? "Done" : index === 1 ? "Open" : "Locked" }))}
              rowKey={(row) => row.name}
              emptyTitle="No weekly modules"
            />

            <DataTable
              title="Resources"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: "Slides", state: "PDF" },
                { name: "Video", state: "Ready" },
                { name: "Reading", state: "Link" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <QuickActionStrip quick="Join course code" filter="Semester and status" exportText="Download course list" />
        </>
      ) : null}

      {activeModule === "lessons" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Video Player</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Large lesson area with transcript and speed control.</p>
                </div>
              </div>
            </article>
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Personal Notes</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Private notes, bookmarks and timestamps.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Lesson checklist"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => <span className={toneByStatus(row.state)}>{row.state}</span> }
              ]}
              rows={[
                { name: lessons[0]?.title ?? "Watch video", state: "Done" },
                { name: lessons[1]?.title ?? "Read PDF", state: "Open" },
                { name: lessons[2]?.title ?? "Practice", state: "Next" }
              ]}
              rowKey={(row) => row.name}
              emptyTitle="No lessons"
            />

            <DataTable
              title="Related items"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: quizzes[0]?.title ?? "Quiz", state: "Unlocked" },
                { name: "Forum", state: "Active" },
                { name: "Reference", state: "Saved" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <DataTable
            title="Lesson Viewer"
            columns={[
              { key: "order", header: "Order", render: (row: Lesson) => row.order_index.toString() },
              { key: "title", header: "Lesson", render: (row: Lesson) => row.title },
              { key: "content", header: "Content", render: (row: Lesson) => row.content.slice(0, 120) }
            ]}
            rows={filteredLessons}
            rowKey={(row) => row.id}
            emptyTitle="No lessons for this section"
          />
        </>
      ) : null}

      {activeModule === "assignments" ? (
        <>
          <DataTable
            title="Assignments"
            columns={[
              { key: "assignment", header: "Assignment", render: (row: Assignment) => row.title },
              {
                key: "deadline",
                header: "Deadline",
                render: (row: Assignment) => (row.due_at ? new Date(row.due_at).toLocaleDateString() : "Open")
              },
              { key: "status", header: "Status", render: (row: Assignment) => <span className={toneByStatus("open")}>Open</span> }
            ]}
            rows={filteredAssignments}
            rowKey={(row) => row.id}
            emptyTitle="No assignments"
          />

          <QuickActionStrip quick="Upload submission" filter="Open, submitted, overdue" exportText="Submission receipt" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleSubmitAssignment} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Submit assignment</h3>
              <div className="mt-4 grid gap-3">
                <FormField as="select" label="Assignment" value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(e.target.value)}>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </FormField>
                <FormField label="Submission text" value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} />
                <FormField
                  label="Upload files"
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
                  helper="Uses /api/v1/files/upload then attaches file path into submission content."
                />
                <FormField label="External link" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} />
                <FormField label="Group members" value={submissionGroupMembers} onChange={(e) => setSubmissionGroupMembers(e.target.value)} />
                <FormField label="Comments" value={submissionComment} onChange={(e) => setSubmissionComment(e.target.value)} />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Rubric"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => row.status }
              ]}
              rows={[
                { name: "Correctness", status: "40%" },
                { name: "Clarity", status: "25%" },
                { name: "Creativity", status: "20%" },
                { name: "Format", status: "15%" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>
        </>
      ) : null}

      {activeModule === "quiz_exams" ? (
        <>
          <DataTable
            title="Assessments"
            columns={[
              { key: "quiz", header: "Quiz or Exam", render: (row: Quiz) => row.title },
              { key: "window", header: "Window", render: (row: Quiz) => (row.is_published ? "Open now" : "Scheduled") },
              { key: "attempts", header: "Attempts", render: (row: Quiz) => `0/${Math.max(1, Math.round(row.max_score / 20))}` }
            ]}
            rows={filteredQuizzes}
            rowKey={(row) => row.id}
            emptyTitle="No quizzes"
          />

          <QuickActionStrip quick="Start selected test" filter="Open and upcoming" exportText="Attempt history" />

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Question Panel</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">MCQ, true false, matching and essay states.</p>
                </div>
              </div>
            </article>
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Timer and Autosave</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Auto submit when time ends.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Questions"
              columns={[
                { key: "name", header: "Name", render: (row: QuizQuestion) => `Q${row.order_index}` },
                {
                  key: "state",
                  header: "State",
                  render: (row: QuizQuestion) => {
                    const selected = quizAnswers[row.id];
                    return <span className={toneByStatus(selected ? "answered" : "blank")}>{selected ? "Answered" : "Blank"}</span>;
                  }
                }
              ]}
              rows={quizQuestions}
              rowKey={(row) => row.id}
              emptyTitle="No questions loaded"
            />

            <DataTable
              title="Status"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: "Autosave", state: "Active" },
                { name: "Connection", state: "Stable" },
                { name: "Attempt", state: quizQuestions.length > 0 ? "In progress" : "Idle" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <section className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-2xl font-bold text-[#151b2d]">Quiz Taking</h3>
            <div className="mt-3">
              <FormField as="select" label="Select quiz" value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)}>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </FormField>
            </div>
            <div className="mt-4 space-y-4">
              {quizQuestions.map((question) => (
                <div key={question.id} className="rounded-[20px] border border-[#d3dbee] bg-[#f7f9fe] p-4">
                  <p className="font-semibold text-[#1a223a]">{question.prompt}</p>
                  <div className="mt-2 grid gap-1">
                    {question.options.map((option) => (
                      <label key={option} className="text-sm text-[#41557e]">
                        <input
                          type="radio"
                          name={question.id}
                          checked={quizAnswers[question.id] === option}
                          onChange={() => setQuizAnswers((prev) => ({ ...prev, [question.id]: option }))}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {quizQuestions.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleSubmitQuiz()}
                disabled={isBusy}
                className="mt-4 rounded-full bg-[#3864e7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Submit Quiz
              </button>
            ) : null}
            {quizResult ? <p className="mt-2 text-sm text-[#2b7c4d]">{quizResult}</p> : null}
          </section>
        </>
      ) : null}

      {activeModule === "grades" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${averageScore.toFixed(1)}/10`} tone="blue" />
            <StatCard label="Growth" value="+12%" tone="mint" />
            <StatCard label="Risk" value={averageScore >= 5 ? "Low" : "High"} tone="rose" />
            <StatCard label="Score" value={averageScore >= 8 ? "A" : averageScore >= 6.5 ? "B" : "C"} tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Quiz improved", action: "Keep" },
              { signal: "Essay low", action: "Review" },
              { signal: "Attendance good", action: "Maintain" }
            ]}
            recommendation="Review rubric comments and request recheck only when evidence is clear."
          />

          <DataTable
            title="Gradebook"
            columns={[
              { key: "source", header: "Source", render: (row: GradeItem) => `${row.source_type.toUpperCase()}: ${row.source_title}` },
              { key: "score", header: "Score", render: (row: GradeItem) => row.score.toString() },
              { key: "feedback", header: "Feedback", render: (row: GradeItem) => row.feedback || "-" }
            ]}
            rows={filteredGrades}
            rowKey={(row) => row.id}
            emptyTitle="No grades"
          />
        </>
      ) : null}

      {activeModule === "attendance" ? (
        <>
          <DataTable
            title="Attendance History"
            columns={[
              { key: "session", header: "Session", render: (row: AttendanceRecord) => new Date(row.attendance_date).toLocaleDateString() },
              { key: "status", header: "Status", render: (row: AttendanceRecord) => <span className={toneByStatus(row.status)}>{row.status}</span> },
              { key: "note", header: "Note", render: (row: AttendanceRecord) => row.note || "-" }
            ]}
            rows={filteredAttendance}
            rowKey={(row) => row.id}
            emptyTitle="No attendance records"
          />
          <QuickActionStrip quick="Submit absence reason" filter="By course" exportText="Attendance report" />
        </>
      ) : null}

      {activeModule === "calendar" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#cdd6ef]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Month View</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Color-coded classes, exams and deadlines.</p>
                </div>
              </div>
            </article>
            <article className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <div className="flex gap-3">
                <span className="mt-1 h-12 w-12 rounded-2xl bg-[#ddd3eb]" />
                <div>
                  <p className="text-4xl font-bold leading-none text-[#151b2d]">Smart Reminders</p>
                  <p className="mt-2 text-sm text-[#6f7f9f]">Email, app and web notification settings.</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable
              title="Today"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: lessons[0]?.title ?? "OOP class", state: "09:00" },
                { name: quizzes[0]?.title ?? "Quiz AI", state: "14:00" }
              ]}
              rowKey={(row) => row.name}
            />

            <DataTable
              title="Upcoming"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; state: string }) => row.name },
                { key: "state", header: "State", render: (row: { name: string; state: string }) => row.state }
              ]}
              rows={[
                { name: assignments[0]?.title ?? "Essay deadline", state: "Tomorrow" },
                { name: notificationItems[0]?.title ?? "Advisor meeting", state: "Fri" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>

          <p className="text-xs text-[#6f7f9f]">TODO: dedicated calendar API is not exposed, calendar rows are derived from lessons/quizzes/assignments/notifications.</p>
        </>
      ) : null}

      {activeModule === "achievements" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total" value={`${badgesCount} badges`} tone="blue" />
            <StatCard label="Growth" value={`+${Math.max(1, Math.round(streakDays / 2))} this week`} tone="mint" />
            <StatCard label="Risk" value={`${Math.max(0, Math.round((100 - averageScore * 10) / 20))} missed`} tone="rose" />
            <StatCard label="Score" value={`Level ${Math.max(1, Math.floor(xpValue / 250) || 1)}`} tone="violet" />
          </div>

          <AnalyticsSection
            insights={[
              { signal: "Streak", action: `${streakDays} days` },
              { signal: "Top skill", action: detail?.course_name ?? "Database" },
              { signal: "Next badge", action: "Focus" }
            ]}
            recommendation="Subtle mascot celebration appears on milestones without making the UI childish."
          />
          <p className="text-xs text-[#6f7f9f]">TODO: no dedicated achievements endpoint yet, values are derived from grades and attendance.</p>
        </>
      ) : null}

      {activeModule === "community" ? (
        <>
          <DataTable
            title="Discussion Topics"
            columns={[
              { key: "topic", header: "Topic", render: (row: ForumTopicItem) => row.title },
              { key: "replies", header: "Replies", render: (row: ForumTopicItem) => row.replies_count.toString() },
              {
                key: "status",
                header: "Status",
                render: (row: ForumTopicItem) => <span className={toneByStatus(row.status)}>{row.is_pinned ? "pinned" : row.status}</span>
              }
            ]}
            rows={filteredForumTopics}
            rowKey={(row) => row.id}
            emptyTitle="No discussion topics"
          />
          <form onSubmit={handleCreateCommunityTopic} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
            <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Create topic</h3>
            <div className="mt-4 grid gap-3">
              <FormField
                label="Title"
                value={communityForm.title}
                onChange={(e) => setCommunityForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <FormField
                label="Content"
                value={communityForm.content}
                onChange={(e) => setCommunityForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Save changes
            </button>
          </form>
          <QuickActionStrip quick="Create topic" filter="Tags and course" exportText="Saved posts" />
        </>
      ) : null}

      {activeModule === "messages" ? (
        <>
          <DataTable
            title="Inbox"
            columns={[
              { key: "sender", header: "Sender", render: (row: NotificationItem) => row.channel || "System" },
              { key: "subject", header: "Subject", render: (row: NotificationItem) => row.title },
              {
                key: "status",
                header: "Status",
                render: (row: NotificationItem) =>
                  row.is_read ? (
                    <span className={toneByStatus("done")}>Read</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(row.id)}
                      className="rounded-full bg-[#3864e7] px-2 py-1 text-xs font-semibold text-white"
                    >
                      Unread
                    </button>
                  )
              }
            ]}
            rows={filteredNotifications}
            rowKey={(row) => row.id}
            emptyTitle="No messages"
            pagination={{
              page: notificationsMeta.page,
              total: notificationsMeta.total,
              limit: notificationsMeta.limit,
              onPageChange: (page) => void reloadNotifications(page)
            }}
          />
          <QuickActionStrip quick="Compose message" filter="Unread and course" exportText="Notification log" />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <form onSubmit={handleSaveProfile} className="rounded-[28px] border border-[#c8d2e8] bg-white p-5">
              <h3 className="text-4xl font-bold leading-none text-[#151b2d]">Profile settings</h3>
              <div className="mt-4 grid gap-3">
                <FormField
                  label="Display name"
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, display_name: e.target.value }))}
                />
                <FormField
                  label="Phone number"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  helper="TODO: phone number update endpoint not exposed in /profile contract."
                />
                <FormField
                  label="Password"
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
                  helper="TODO: self password update endpoint is not exposed."
                />
                <FormField
                  label="Theme mode"
                  value={profileForm.theme_mode}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, theme_mode: e.target.value }))}
                  helper="UI preference only."
                />
                <FormField
                  label="Notification channels"
                  value={profileForm.notification_channels}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, notification_channels: e.target.value }))}
                  helper="UI preference only."
                />
              </div>
              <button type="submit" disabled={isBusy} className="mt-4 rounded-full bg-[#3864e7] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Save changes
              </button>
            </form>

            <DataTable
              title="Preferences"
              columns={[
                { key: "name", header: "Name", render: (row: { name: string; status: string }) => row.name },
                { key: "status", header: "Status", render: (row: { name: string; status: string }) => row.status }
              ]}
              rows={[
                { name: "Light mode", status: "On" },
                { name: "Dark mode", status: "On" },
                { name: "Auto switch", status: "On" },
                { name: "2FA", status: "Ready" }
              ]}
              rowKey={(row) => row.name}
            />
          </div>
        </>
      ) : null}

      {availableModules.includes(activeModule) ? null : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {modules
              .filter((item) => item.key !== "home")
              .slice(0, 8)
              .map((item) => (
                <ModuleCard key={item.key} module={item} />
              ))}
          </div>
          <EmptyState title="Module unavailable" description="Selected student module is not mapped." />
        </>
      )}

      {isBusy ? <p className="text-xs text-[#6f7f9f]">Syncing data...</p> : null}
    </section>
  );
}



