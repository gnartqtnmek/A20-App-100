"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { clearSession, storeSession } from "@/lib/auth";
import { loginRequest } from "@/lib/api";
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
      router.push(`/dashboard/${session.user.role}`);
    } catch {
      setError("Login failed. Check email/password and ensure API is running.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-soft border border-white/45 bg-white/75 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:p-8">
      <h2 className="text-2xl font-bold text-brand.night dark:text-white">Sign In To Brainio</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Demo password for seeded users: <span className="font-semibold">{DEMO_PASSWORD}</span>
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block text-sm text-slate-700 dark:text-slate-200">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 outline-none ring-brand.sky/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block text-sm text-slate-700 dark:text-slate-200">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-slate-900 outline-none ring-brand.sky/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-brand.night px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setEmail(ROLE_EMAILS[role])}
            className="rounded-xl border border-white/45 bg-white/80 px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-100"
          >
            <p className="font-semibold">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_EMAILS[role]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
