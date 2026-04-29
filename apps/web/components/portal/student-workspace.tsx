"use client";

import { useEffect, useMemo, useState } from "react";

import {
  studentAssignments,
  studentAttendance,
  studentCourseDetail,
  studentGrades,
  studentLessons,
  studentListCourses,
  studentQuizQuestions,
  studentQuizzes,
  studentSubmitAssignment,
  studentSubmitQuiz
} from "@/lib/api";
import type { Assignment, AttendanceRecord, CourseDetail, CourseSummary, GradeItem, Lesson, Quiz, QuizQuestion } from "@/lib/lms";

type Props = {
  accessToken: string;
};

export function StudentWorkspace({ accessToken }: Props) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [assignmentDraft, setAssignmentDraft] = useState<Record<string, string>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<string>("");

  useEffect(() => {
    async function loadCourses() {
      const data = await studentListCourses(accessToken);
      setCourses(data);
      if (data.length > 0) {
        setSelectedSectionId(data[0].section_id);
      }
    }
    void loadCourses();
  }, [accessToken]);

  useEffect(() => {
    async function loadSectionData() {
      if (!selectedSectionId) return;
      const [courseDetail, lessonData, assignmentData, quizData, gradeData, attendanceData] = await Promise.all([
        studentCourseDetail(selectedSectionId, accessToken),
        studentLessons(selectedSectionId, accessToken),
        studentAssignments(selectedSectionId, accessToken),
        studentQuizzes(selectedSectionId, accessToken),
        studentGrades(accessToken),
        studentAttendance(accessToken, selectedSectionId)
      ]);
      setDetail(courseDetail);
      setLessons(lessonData);
      setAssignments(assignmentData);
      setQuizzes(quizData);
      setGrades(gradeData.filter((item) => item.section_id === selectedSectionId));
      setAttendance(attendanceData);
    }
    void loadSectionData();
  }, [selectedSectionId, accessToken]);

  useEffect(() => {
    async function loadQuizQuestions() {
      if (!selectedQuizId) {
        setQuizQuestions([]);
        return;
      }
      setQuizResult("");
      const data = await studentQuizQuestions(selectedQuizId, accessToken);
      setQuizQuestions(data);
      setQuizAnswers({});
    }
    void loadQuizQuestions();
  }, [selectedQuizId, accessToken]);

  const courseTitle = useMemo(() => {
    if (!detail) return "Student Portal";
    return `${detail.course_code} - ${detail.course_name}`;
  }, [detail]);

  async function handleSubmitAssignment(assignmentId: string) {
    const content = assignmentDraft[assignmentId]?.trim();
    if (!content) return;
    await studentSubmitAssignment(assignmentId, content, accessToken);
    setAssignmentDraft((prev) => ({ ...prev, [assignmentId]: "" }));
  }

  async function handleSubmitQuiz() {
    if (!selectedQuizId || quizQuestions.length === 0) return;
    const result = await studentSubmitQuiz(selectedQuizId, quizAnswers, accessToken);
    setQuizResult(`Submitted. Score ${result.score}/${result.max_score}`);
    const gradeData = await studentGrades(accessToken);
    setGrades(gradeData.filter((item) => item.section_id === selectedSectionId));
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Student Modules</p>
        <h3 className="mt-1 text-xl font-bold text-brand.night dark:text-white">{courseTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {courses.map((course) => (
            <button
              key={course.section_id}
              onClick={() => setSelectedSectionId(course.section_id)}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                selectedSectionId === course.section_id
                  ? "border-brand.night bg-brand.night text-white"
                  : "border-slate-300 bg-white/90 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {course.section_code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Lesson Viewer</h4>
          <div className="mt-3 space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{lesson.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lesson.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Assignments</h4>
          <div className="mt-3 space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{assignment.description}</p>
                <textarea
                  value={assignmentDraft[assignment.id] ?? ""}
                  onChange={(event) =>
                    setAssignmentDraft((prev) => ({ ...prev, [assignment.id]: event.target.value }))
                  }
                  placeholder="Write your submission..."
                  className="mt-2 h-20 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
                <button
                  onClick={() => void handleSubmitAssignment(assignment.id)}
                  className="mt-2 rounded-lg bg-brand.night px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Submit Assignment
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Quiz Taking</h4>
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">Select a quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <div className="mt-3 space-y-3">
            {quizQuestions.map((question) => (
              <div key={question.id} className="rounded-xl border border-slate-200 bg-white/85 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">{question.prompt}</p>
                <div className="mt-2 grid gap-1">
                  {question.options.map((option) => (
                    <label key={option} className="text-sm text-slate-700 dark:text-slate-200">
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
            <button onClick={() => void handleSubmitQuiz()} className="mt-3 rounded-lg bg-brand.night px-3 py-1.5 text-xs font-semibold text-white">
              Submit Quiz
            </button>
          ) : null}
          {quizResult ? <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{quizResult}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
          <h4 className="text-lg font-semibold text-brand.night dark:text-white">Grades & Attendance</h4>
          <div className="mt-3 space-y-2">
            {grades.map((grade) => (
              <div key={grade.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {grade.source_type.toUpperCase()}: {grade.source_title}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Score: {grade.score} | {grade.feedback || "No feedback"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {attendance.map((record) => (
              <div key={record.id} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(record.attendance_date).toLocaleString()}</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Status: {record.status} {record.note ? `| ${record.note}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
