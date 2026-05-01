"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { meRequest } from "@/lib/api";
import { clearSession, readAccessToken, readStoredUser } from "@/lib/auth";
import { roleToPathSegment } from "@/lib/route-role";
import { type AuthUser, type RoleSlug } from "@/lib/roles";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

type SessionState = {
  user: AuthUser;
  accessToken: string;
};

type Props = {
  allow: RoleSlug[];
  children: (session: SessionState) => ReactNode;
};

export function RoleGuard({ allow, children }: Props) {
  const router = useRouter();
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      const accessToken = readAccessToken();
      const storedUser = readStoredUser();
      if (!accessToken) {
        clearSession();
        router.replace("/login");
        return;
      }

      try {
        const me = await meRequest(accessToken);
        if (cancelled) return;

        const isAllowed = me.role === "admin" || allow.includes(me.role);
        if (!isAllowed) {
          router.replace(`/dashboard/${roleToPathSegment(me.role)}`);
          return;
        }

        setState({ user: storedUser && storedUser.id === me.id ? storedUser : me, accessToken });
      } catch {
        if (cancelled) return;
        clearSession();
        setError("Session expired. Please sign in again.");
        router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void guard();
    return () => {
      cancelled = true;
    };
  }, [allow, router]);

  if (loading) {
    return <LoadingState label="Checking access..." />;
  }

  if (error || !state) {
    return <ErrorState description={error || "Access denied."} />;
  }

  return <>{children(state)}</>;
}
