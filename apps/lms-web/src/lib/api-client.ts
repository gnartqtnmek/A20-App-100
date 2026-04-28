import { clearSession, getAccessToken, getRefreshToken, saveSession } from "@/lib/auth-storage";
import type {
  AssignmentCreate,
  AssignmentRead,
  AuthResponse,
  ChatMessageRead,
  ChatSessionRead,
  CourseCreate,
  CourseRead,
  EnrollmentRead,
  GradeRead,
  KnowledgeChunkRead,
  LessonCreate,
  LessonRead,
  ModuleCreate,
  ModuleRead,
  NotificationRead,
  QuizQuestionRead,
  SubmissionRead,
  UploadResult,
  UserRead,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type RequestInitEx = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const storedRole = localStorage.getItem("lms_user_role");
  const currentRole = storedRole === "lecturer" ? "instructor" : (storedRole ?? "student");
  saveSession(payload.access_token, payload.refresh_token, currentRole);
  return payload.access_token;
}

async function request<T>(path: string, init?: RequestInitEx): Promise<T> {
  const authEnabled = init?.auth !== false;
  const headers = new Headers(init?.headers ?? {});

  if (authEnabled) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && authEnabled) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      const retry = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      if (!retry.ok) {
        const retryBody = (await parseJsonSafe(retry)) as { detail?: string } | null;
        throw new ApiError(retryBody?.detail ?? "Request failed", retry.status);
      }
      return (await retry.json()) as T;
    }
  }

  if (!response.ok) {
    const body = (await parseJsonSafe(response)) as { detail?: string } | null;
    throw new ApiError(body?.detail ?? "Request failed", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  // ---- Auth ----
  async login(email: string, password: string): Promise<AuthResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);

    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    saveSession(result.tokens.access_token, result.tokens.refresh_token, result.user.role);
    return result;
  },

  async register(payload: {
    email: string;
    full_name: string;
    password: string;
    role: "student" | "instructor";
  }): Promise<AuthResponse> {
    const result = await request<AuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    saveSession(result.tokens.access_token, result.tokens.refresh_token, result.user.role);
    return result;
  },

  async me(): Promise<UserRead> {
    return request<UserRead>("/auth/me");
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await request<void>("/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Even if backend logout fails, kill the local session.
      }
    }
    clearSession();
  },

  // ---- Courses ----
  async listCourses(): Promise<CourseRead[]> {
    return request<CourseRead[]>("/courses");
  },

  async getCourse(courseId: string): Promise<CourseRead> {
    return request<CourseRead>(`/courses/${courseId}`);
  },

  async enrollWithCode(inviteCode: string): Promise<EnrollmentRead> {
    return request<EnrollmentRead>("/courses/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  },

  // ---- Curriculum ----
  async listCourseModules(courseId: string): Promise<ModuleRead[]> {
    return request<ModuleRead[]>(`/curriculum/courses/${courseId}/modules`);
  },

  async listModuleLessons(moduleId: string): Promise<LessonRead[]> {
    return request<LessonRead[]>(`/curriculum/modules/${moduleId}/lessons`);
  },

  // ---- Assignments + submissions ----
  async listCourseAssignments(courseId: string): Promise<AssignmentRead[]> {
    return request<AssignmentRead[]>(`/assignments/course/${courseId}`);
  },

  async getAssignment(assignmentId: string): Promise<AssignmentRead> {
    return request<AssignmentRead>(`/assignments/${assignmentId}`);
  },

  async submitAssignment(
    assignmentId: string,
    payload: { content?: string; file_url?: string; file_name?: string; quiz_answers?: Record<string, unknown> },
  ): Promise<SubmissionRead> {
    return request<SubmissionRead>(`/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async listAssignmentSubmissions(assignmentId: string): Promise<SubmissionRead[]> {
    return request<SubmissionRead[]>(`/assignments/${assignmentId}/submissions`);
  },

  async listQuizQuestions(assignmentId: string): Promise<QuizQuestionRead[]> {
    return request<QuizQuestionRead[]>(`/assignments/${assignmentId}/questions`);
  },

  // ---- Grades ----

  async gradeSubmission(
    submissionId: string,
    payload: { score: number; feedback?: string },
  ): Promise<GradeRead> {
    return request<GradeRead>(`/grades/submissions/${submissionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  async listMyGrades(): Promise<GradeRead[]> {
    return request<GradeRead[]>("/grades/me");
  },

  async listCourseGrades(courseId: string): Promise<GradeRead[]> {
    return request<GradeRead[]>(`/grades/courses/${courseId}`);
  },

  // ---- Notifications ----
  async listMyNotifications(unreadOnly = false): Promise<NotificationRead[]> {
    const query = unreadOnly ? "?unread_only=true" : "";
    return request<NotificationRead[]>(`/notifications/me${query}`);
  },

  async markNotificationRead(id: string): Promise<NotificationRead> {
    return request<NotificationRead>(`/notifications/${id}/read`, { method: "POST" });
  },

  // ---- Lecturer: create/update ----
  async createCourse(payload: CourseCreate): Promise<CourseRead> {
    return request<CourseRead>("/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async createModule(courseId: string, payload: ModuleCreate): Promise<ModuleRead> {
    return request<ModuleRead>(`/curriculum/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async createLesson(moduleId: string, payload: LessonCreate): Promise<LessonRead> {
    return request<LessonRead>(`/curriculum/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async createAssignment(payload: AssignmentCreate): Promise<AssignmentRead> {
    return request<AssignmentRead>("/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  // ---- Knowledge chunks ----
  async listLessonChunks(lessonId: string): Promise<KnowledgeChunkRead[]> {
    return request<KnowledgeChunkRead[]>(`/knowledge/lessons/${lessonId}/chunks`);
  },

  async deleteChunk(chunkId: string): Promise<void> {
    return request<void>(`/knowledge/chunks/${chunkId}`, { method: "DELETE" });
  },

  // ---- Chat ----
  async listChatSessions(): Promise<ChatSessionRead[]> {
    return request<ChatSessionRead[]>("/chat/sessions");
  },

  async createChatSession(title?: string): Promise<ChatSessionRead> {
    return request<ChatSessionRead>("/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title ?? null }),
    });
  },

  async getChatMessages(sessionId: string, limit = 50): Promise<ChatMessageRead[]> {
    return request<ChatMessageRead[]>(`/chat/sessions/${sessionId}/messages?limit=${limit}`);
  },

  async sendChatMessage(
    sessionId: string,
    content: string,
    courseId?: string,
  ): Promise<ChatMessageRead> {
    const query = courseId ? `?course_id=${courseId}` : "";
    return request<ChatMessageRead>(`/chat/sessions/${sessionId}/messages${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  },

  /** Returns the raw fetch Response for SSE streaming — caller must read the body. */
  async streamChatMessage(
    sessionId: string,
    content: string,
    courseId?: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    const query = courseId ? `?course_id=${courseId}` : "";
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages/stream${query}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content }),
      signal,
    });
  },

  // ---- Files ----
  async uploadAssignmentFile(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResult>("/files/assignments", { method: "POST", body: form });
  },

  async uploadAvatar(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResult>("/files/avatars", { method: "POST", body: form });
  },

  async uploadLessonAttachment(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResult>("/files/lessons", { method: "POST", body: form });
  },
};
