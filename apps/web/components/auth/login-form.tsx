"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { clearSession, storeSession } from "@/lib/auth";
import { loginRequest } from "@/lib/api";
import { roleToPathSegment } from "@/lib/route-role";
import { DEMO_PASSWORD, ROLE_EMAILS, ROLE_LABELS, type RoleSlug } from "@/lib/roles";

const roles: RoleSlug[] = ["student", "lecturer", "admin", "academic_staff", "advisor"];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("student@brainio.edu");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const session = await loginRequest(email, password);
      clearSession();
      storeSession({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: session.user
      });
      router.push(`/dashboard/${roleToPathSegment(session.user.role)}`);
    } catch {
      setError("Login failed. Check email/password and ensure API is running.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="brainio-card rounded-3xl p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
        <p className="text-sm text-slate-600">
          Demo password: <span className="font-semibold text-slate-900">{DEMO_PASSWORD}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input
            className="brainio-input w-full rounded-lg px-3 py-2.5 text-slate-900"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Password</span>
          <input
            type="password"
            className="brainio-input w-full rounded-lg px-3 py-2.5 text-slate-900"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Quick role fill</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setEmail(ROLE_EMAILS[role])}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-100"
            >
              <p className="font-semibold">{ROLE_LABELS[role]}</p>
              <p className="text-xs text-slate-500">{ROLE_EMAILS[role]}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
