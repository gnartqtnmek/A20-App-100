import { type ModuleItem, type RoleSlug } from "./roles";
import { roleToPathSegment } from "./route-role";

type RoleModuleMap = Record<RoleSlug, ModuleItem[]>;

const base = "/dashboard";

function buildRoute(role: RoleSlug, key: string) {
  return `${base}/${roleToPathSegment(role)}?module=${key}`;
}

export const ROLE_MODULES: RoleModuleMap = {
  student: [
    { key: "home", title: "Home", description: "Student dashboard", route: buildRoute("student", "home") },
    { key: "my_courses", title: "My Courses", description: "Enrolled courses", route: buildRoute("student", "my_courses") },
    { key: "lessons", title: "Lessons", description: "Lesson viewer", route: buildRoute("student", "lessons") },
    { key: "assignments", title: "Assignments", description: "Assignment list and submit", route: buildRoute("student", "assignments") },
    { key: "quiz_exams", title: "Quiz and Exams", description: "Assessments and attempts", route: buildRoute("student", "quiz_exams") },
    { key: "grades", title: "Grades", description: "View scores", route: buildRoute("student", "grades") },
    { key: "attendance", title: "Attendance", description: "Attendance records", route: buildRoute("student", "attendance") },
    { key: "calendar", title: "Calendar", description: "Schedule and reminders", route: buildRoute("student", "calendar") },
    { key: "achievements", title: "Achievements", description: "Badges and streak", route: buildRoute("student", "achievements") },
    { key: "community", title: "Community", description: "Forum discussions", route: buildRoute("student", "community") },
    { key: "messages", title: "Messages", description: "Inbox and notifications", route: buildRoute("student", "messages") }
  ],
  lecturer: [
    { key: "dashboard", title: "Dashboard", description: "Teaching overview", route: buildRoute("lecturer", "dashboard") },
    { key: "course_studio", title: "Course Studio", description: "Assigned sections", route: buildRoute("lecturer", "course_studio") },
    { key: "materials", title: "Materials", description: "Lesson and files", route: buildRoute("lecturer", "materials") },
    { key: "assignments", title: "Assignments", description: "Builder and grading", route: buildRoute("lecturer", "assignments") },
    { key: "quiz_bank", title: "Quiz Bank", description: "Quizzes and question bank", route: buildRoute("lecturer", "quiz_bank") },
    { key: "gradebook", title: "Gradebook", description: "Section grades", route: buildRoute("lecturer", "gradebook") },
    { key: "attendance", title: "Attendance", description: "Attendance sessions", route: buildRoute("lecturer", "attendance") },
    { key: "live_class", title: "Live Class", description: "Schedule live sessions", route: buildRoute("lecturer", "live_class") },
    { key: "analytics", title: "Analytics", description: "Learning analytics", route: buildRoute("lecturer", "analytics") },
    { key: "forum", title: "Forum", description: "Discussion moderation", route: buildRoute("lecturer", "forum") },
    { key: "messages", title: "Messages", description: "Announcements and notices", route: buildRoute("lecturer", "messages") }
  ],
  admin: [
    { key: "overview", title: "Overview", description: "System status", route: buildRoute("admin", "overview") },
    { key: "users", title: "Users", description: "User management", route: buildRoute("admin", "users") },
    {
      key: "roles_rbac",
      title: "Roles and RBAC",
      description: "Permissions and scope",
      route: buildRoute("admin", "roles_rbac")
    },
    { key: "departments", title: "Departments", description: "Organization units", route: buildRoute("admin", "departments") },
    { key: "semesters", title: "Semesters", description: "Academic calendar", route: buildRoute("admin", "semesters") },
    { key: "courses", title: "Courses", description: "Catalog and sections", route: buildRoute("admin", "courses") },
    { key: "enrollments", title: "Enrollments", description: "Enrollment operations", route: buildRoute("admin", "enrollments") },
    { key: "content", title: "Content", description: "Content moderation", route: buildRoute("admin", "content") },
    { key: "exams", title: "Exams", description: "Exam administration", route: buildRoute("admin", "exams") },
    { key: "grades", title: "Grades", description: "Grade administration", route: buildRoute("admin", "grades") },
    { key: "security", title: "Security", description: "Security and reports", route: buildRoute("admin", "security") }
  ],
  academic_staff: [
    {
      key: "training_dashboard",
      title: "Training Dashboard",
      description: "Faculty operations",
      route: buildRoute("academic_staff", "training_dashboard")
    },
    { key: "curriculum", title: "Curriculum", description: "CLO/PLO mapping", route: buildRoute("academic_staff", "curriculum") },
    {
      key: "course_catalog",
      title: "Course Catalog",
      description: "Course proposals",
      route: buildRoute("academic_staff", "course_catalog")
    },
    {
      key: "class_sections",
      title: "Class Sections",
      description: "Section planning",
      route: buildRoute("academic_staff", "class_sections")
    },
    {
      key: "lecturers",
      title: "Lecturers",
      description: "Teaching load",
      route: buildRoute("academic_staff", "lecturers")
    },
    {
      key: "students",
      title: "Students",
      description: "Academic monitoring",
      route: buildRoute("academic_staff", "students")
    },
    {
      key: "exams",
      title: "Exams",
      description: "Exam planning",
      route: buildRoute("academic_staff", "exams")
    },
    {
      key: "grade_approval",
      title: "Grade Approval",
      description: "Final grade workflow",
      route: buildRoute("academic_staff", "grade_approval")
    },
    {
      key: "surveys",
      title: "Surveys",
      description: "Course evaluation",
      route: buildRoute("academic_staff", "surveys")
    },
    { key: "reports", title: "Reports", description: "Training reports", route: buildRoute("academic_staff", "reports") },
    {
      key: "announcements",
      title: "Announcements",
      description: "Academic notices",
      route: buildRoute("academic_staff", "announcements")
    }
  ],
  advisor: [
    {
      key: "success_dashboard",
      title: "Success Dashboard",
      description: "Advisor overview",
      route: buildRoute("advisor", "success_dashboard")
    },
    { key: "my_students", title: "My Students", description: "Assigned students", route: buildRoute("advisor", "my_students") },
    {
      key: "student_profile",
      title: "Student Profile",
      description: "Student 360 profile",
      route: buildRoute("advisor", "student_profile")
    },
    { key: "risk_alerts", title: "Risk Alerts", description: "Auto warnings", route: buildRoute("advisor", "risk_alerts") },
    {
      key: "progress_tracking",
      title: "Progress Tracking",
      description: "Trends and insights",
      route: buildRoute("advisor", "progress_tracking")
    },
    {
      key: "consultations",
      title: "Consultations",
      description: "Consultation notes",
      route: buildRoute("advisor", "consultations")
    },
    { key: "study_plans", title: "Study Plans", description: "Plan and goals", route: buildRoute("advisor", "study_plans") },
    { key: "attendance", title: "Attendance", description: "Follow-up cases", route: buildRoute("advisor", "attendance") },
    {
      key: "support_requests",
      title: "Requests",
      description: "Escalations and support",
      route: buildRoute("advisor", "support_requests")
    },
    { key: "messages", title: "Messages", description: "Advisor messages", route: buildRoute("advisor", "messages") },
    { key: "reports", title: "Reports", description: "Advisor reports", route: buildRoute("advisor", "reports") }
  ]
};

export function getRoleModules(role: RoleSlug): ModuleItem[] {
  return ROLE_MODULES[role];
}

export function getDefaultModule(role: RoleSlug): string {
  return ROLE_MODULES[role][0]?.key ?? "dashboard";
}


