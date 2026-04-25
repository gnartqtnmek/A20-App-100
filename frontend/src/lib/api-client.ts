import { clearSession, getAccessToken, getRefreshToken, saveSession } from "@/lib/auth-storage";
import type {
  AssignmentRead,
  AuthResponse,
  CourseRead,
  ModuleRead,
  NotificationRead,
  UserRead,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type RequestInitEx = RequestInit & {
  auth?: boolean;
};

class ApiError extends Error {
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

  const currentRole = localStorage.getItem("lms_user_role") ?? "student";
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && authEnabled) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      const retry = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
      });
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
  async login(email: string, password: string): Promise<AuthResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);

    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    saveSession(result.tokens.access_token, result.tokens.refresh_token, result.user.role);
    return result;
  },

  async register(payload: {
    email: string;
    full_name: string;
    password: string;
    role: "student" | "lecturer";
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
      await request<void>("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
    clearSession();
  },

  async listCourses(): Promise<CourseRead[]> {
    return request<CourseRead[]>("/courses");
  },

  async listCourseModules(courseId: string): Promise<ModuleRead[]> {
    return request<ModuleRead[]>(`/curriculum/courses/${courseId}/modules`);
  },

  async listCourseAssignments(courseId: string): Promise<AssignmentRead[]> {
    return request<AssignmentRead[]>(`/assignments/course/${courseId}`);
  },

  async listMyNotifications(unreadOnly = false): Promise<NotificationRead[]> {
    const query = unreadOnly ? "?unread_only=true" : "";
    return request<NotificationRead[]>(`/notifications/me${query}`);
  },
};

export { ApiError };
