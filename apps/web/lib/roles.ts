export type RoleSlug = "student" | "lecturer" | "admin" | "academic_staff" | "advisor";

export type ModuleItem = {
  key: string;
  title: string;
  description: string;
  route: string;
};

export type DashboardPayload = {
  role: RoleSlug;
  header_title: string;
  header_subtitle: string;
  metrics: { label: string; value: string; trend: string }[];
  hero: { title: string; subtitle: string; cta_label: string; cta_route: string };
  modules: ModuleItem[];
};

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: RoleSlug;
  is_active: boolean;
};

export const ROLE_LABELS: Record<RoleSlug, string> = {
  student: "Student",
  lecturer: "Lecturer",
  admin: "Admin",
  academic_staff: "Academic Staff",
  advisor: "Advisor"
};

export const ROLE_EMAILS: Record<RoleSlug, string> = {
  student: "student@brainio.edu",
  lecturer: "lecturer@brainio.edu",
  admin: "admin@brainio.edu",
  academic_staff: "staff@brainio.edu",
  advisor: "advisor@brainio.edu"
};

export const DEMO_PASSWORD = "Brainio@123";

export const DASHBOARD_FALLBACK: Record<RoleSlug, DashboardPayload> = {
  student: {
    role: "student",
    header_title: "Learning Momentum",
    header_subtitle: "Stay on top of deadlines and keep your weekly learning streak alive.",
    metrics: [
      { label: "Courses in Progress", value: "6", trend: "+1 this term" },
      { label: "Upcoming Deadlines", value: "4", trend: "2 due this week" },
      { label: "Average Grade", value: "8.4/10", trend: "+0.3 this month" }
    ],
    hero: {
      title: "Your Brainio Sprint",
      subtitle: "Complete two lessons and one quiz today to maintain your high-performance trajectory.",
      cta_label: "Open Learning Plan",
      cta_route: "/dashboard/student"
    },
    modules: [
      { key: "my_courses", title: "My Courses", description: "Track enrolled sections", route: "/dashboard/student" },
      { key: "assignments", title: "Assignments", description: "Submit and review homework", route: "/dashboard/student" },
      { key: "quizzes", title: "Quizzes", description: "Take tests and check results", route: "/dashboard/student" },
      { key: "grades", title: "Grades", description: "View gradebook and feedback", route: "/dashboard/student" },
      { key: "attendance", title: "Attendance", description: "Follow attendance status", route: "/dashboard/student" }
    ]
  },
  lecturer: {
    role: "lecturer",
    header_title: "Teaching Command Center",
    header_subtitle: "Coordinate classes, grading queues, and learner support in one flow.",
    metrics: [
      { label: "Active Sections", value: "5", trend: "42 students at risk" },
      { label: "Submissions to Grade", value: "27", trend: "-8 since yesterday" },
      { label: "Published Lessons", value: "31", trend: "+6 this month" }
    ],
    hero: {
      title: "Faculty Focus",
      subtitle: "Clear pending grading before Friday to unlock auto-generated intervention recommendations.",
      cta_label: "Go To Grading Desk",
      cta_route: "/dashboard/lecturer"
    },
    modules: [
      { key: "teaching_sections", title: "Teaching Sections", description: "Manage assigned classes", route: "/dashboard/lecturer" },
      { key: "lesson_manager", title: "Lesson Manager", description: "Publish and organize lessons", route: "/dashboard/lecturer" },
      { key: "assignment_review", title: "Assignment Review", description: "Grade submissions quickly", route: "/dashboard/lecturer" },
      { key: "quiz_center", title: "Quiz Center", description: "Control quiz publishing", route: "/dashboard/lecturer" },
      { key: "class_analytics", title: "Class Analytics", description: "Monitor class performance", route: "/dashboard/lecturer" }
    ]
  },
  admin: {
    role: "admin",
    header_title: "System Control Tower",
    header_subtitle: "Observe operations, security and platform scale with confidence.",
    metrics: [
      { label: "Active Users", value: "4,210", trend: "+112 this week" },
      { label: "Open Sections", value: "168", trend: "+9 new sections" },
      { label: "Critical Alerts", value: "2", trend: "Both under review" }
    ],
    hero: {
      title: "Operations Pulse",
      subtitle: "Review audit alerts and confirm role assignments before onboarding week starts.",
      cta_label: "Open Admin Queue",
      cta_route: "/dashboard/admin"
    },
    modules: [
      { key: "system_overview", title: "System Overview", description: "Monitor full LMS health", route: "/dashboard/admin" },
      { key: "user_management", title: "User Management", description: "Manage accounts and access", route: "/dashboard/admin" },
      { key: "rbac", title: "Role & Permission", description: "Control role capabilities", route: "/dashboard/admin" },
      { key: "academic_config", title: "Academic Config", description: "Maintain terms and structures", route: "/dashboard/admin" },
      { key: "audit_security", title: "Audit & Security", description: "Review critical events", route: "/dashboard/admin" }
    ]
  },
  academic_staff: {
    role: "academic_staff",
    header_title: "Academic Operations Hub",
    header_subtitle: "Drive curriculum quality and teaching consistency across departments.",
    metrics: [
      { label: "Sections Running", value: "96", trend: "91% on-track" },
      { label: "Pending Approvals", value: "14", trend: "7 quizzes, 7 grades" },
      { label: "Lecturer Load Risk", value: "3", trend: "-1 overloaded profile" }
    ],
    hero: {
      title: "Faculty Performance Radar",
      subtitle: "This week you can close approvals and rebalance section assignment to reduce overload.",
      cta_label: "Open Approval Board",
      cta_route: "/dashboard/academic_staff"
    },
    modules: [
      { key: "faculty_dashboard", title: "Faculty Dashboard", description: "Track faculty training status", route: "/dashboard/academic_staff" },
      { key: "curriculum", title: "Curriculum", description: "Map program and outcomes", route: "/dashboard/academic_staff" },
      { key: "section_planning", title: "Section Planning", description: "Open and allocate sections", route: "/dashboard/academic_staff" },
      { key: "teaching_load", title: "Teaching Load", description: "Balance lecturer workload", route: "/dashboard/academic_staff" },
      { key: "academic_reports", title: "Academic Reports", description: "Publish quality reports", route: "/dashboard/academic_staff" }
    ]
  },
  advisor: {
    role: "advisor",
    header_title: "Student Success Radar",
    header_subtitle: "Guide your student cohort with proactive risk detection and coaching.",
    metrics: [
      { label: "Assigned Students", value: "85", trend: "+3 this intake" },
      { label: "High-Risk Cases", value: "12", trend: "-2 after intervention" },
      { label: "Counseling Sessions", value: "9", trend: "5 scheduled this week" }
    ],
    hero: {
      title: "Intervention Action Deck",
      subtitle: "Prioritize high-risk learners and lock follow-up sessions to prevent course withdrawal.",
      cta_label: "Open Counseling Planner",
      cta_route: "/dashboard/advisor"
    },
    modules: [
      { key: "student_success", title: "Student Success", description: "Monitor assigned students", route: "/dashboard/advisor" },
      { key: "risk_alerts", title: "Risk Alerts", description: "Handle warning and escalation", route: "/dashboard/advisor" },
      { key: "counseling", title: "Counseling", description: "Schedule advisory sessions", route: "/dashboard/advisor" },
      { key: "study_plan", title: "Study Plan", description: "Guide semester strategies", route: "/dashboard/advisor" },
      { key: "advisor_reports", title: "Advisor Reports", description: "Export intervention progress", route: "/dashboard/advisor" }
    ]
  }
};
