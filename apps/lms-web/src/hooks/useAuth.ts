"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient, ApiError } from "@/lib/api-client";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
import type { UserRead } from "@/lib/types";

type AuthState = {
  user: UserRead | null;
  loading: boolean;
  error: string | null;
};

export function useAuth(redirectIfUnauthenticated = true) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    loading: Boolean(getAccessToken()),
    error: null,
  }));

  useEffect(() => {
    if (!getAccessToken()) {
      if (redirectIfUnauthenticated) router.replace("/login");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const user = await apiClient.me();
        if (cancelled) return;
        setState({ user, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          if (redirectIfUnauthenticated) router.replace("/login");
          setState({ user: null, loading: false, error: null });
        } else {
          setState({
            user: null,
            loading: false,
            error: err instanceof Error ? err.message : "Lỗi xác thực.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, redirectIfUnauthenticated]);

  const refetch = useCallback(async () => {
    if (!getAccessToken()) {
      if (redirectIfUnauthenticated) router.replace("/login");
      setState({ user: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const user = await apiClient.me();
      setState({ user, loading: false, error: null });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        if (redirectIfUnauthenticated) router.replace("/login");
        setState({ user: null, loading: false, error: null });
      } else {
        setState({
          user: null,
          loading: false,
          error: err instanceof Error ? err.message : "Lỗi xác thực.",
        });
      }
    }
  }, [router, redirectIfUnauthenticated]);

  const logout = useCallback(async () => {
    await apiClient.logout();
    router.replace("/login");
  }, [router]);

  return { ...state, refetch, logout };
}

export function useRequireRole(role: UserRead["role"]) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && auth.user && auth.user.role !== role) {
      router.replace("/dashboard");
    }
  }, [auth.loading, auth.user, role, router]);

  return auth;
}
