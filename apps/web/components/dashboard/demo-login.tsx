"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ROLE_EMAILS, ROLE_LABELS, type RoleSlug } from "@/lib/roles";

const orderedRoles: RoleSlug[] = ["student", "lecturer", "admin", "academic_staff", "advisor"];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function DemoLogin() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<RoleSlug | null>(null);
  const [error, setError] = useState<string>("");

  async function handleLogin(role: RoleSlug) {
    setLoadingRole(role);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ROLE_EMAILS[role],
          password: "demo123"
        })
      });

      if (!response.ok) {
        throw new Error("Demo login failed");
      }

      const payload = (await response.json()) as { access_token?: string };
      if (payload.access_token) {
        localStorage.setItem("brainio_demo_token", payload.access_token);
      }
      router.push(`/dashboard/${role}`);
    } catch {
      setError("Cannot reach API demo login. Open dashboard directly or run backend on port 8000.");
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {orderedRoles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => handleLogin(role)}
          disabled={loadingRole !== null}
          className="flex w-full items-center justify-between rounded-xl border border-white/45 bg-white/80 px-4 py-3 text-left text-slate-800 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-100"
        >
          <span className="font-semibold">{ROLE_LABELS[role]}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{ROLE_EMAILS[role]}</span>
        </button>
      ))}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
