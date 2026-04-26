const ACCESS_TOKEN_KEY = "lms_access_token";
const REFRESH_TOKEN_KEY = "lms_refresh_token";
const USER_ROLE_KEY = "lms_user_role";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function saveSession(accessToken: string, refreshToken: string, userRole: string): void {
  if (!hasWindow()) {
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_ROLE_KEY, userRole);
}

export function clearSession(): void {
  if (!hasWindow()) {
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

export function getAccessToken(): string | null {
  if (!hasWindow()) {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!hasWindow()) {
    return null;
  }
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUserRole(): string | null {
  if (!hasWindow()) {
    return null;
  }
  return localStorage.getItem(USER_ROLE_KEY);
}
