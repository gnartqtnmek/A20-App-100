"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiClient } from "@/lib/api-client";
import { Card, ErrorBanner, PageShell } from "@/components/page-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? "Email hoặc mật khẩu không đúng."
            : err.message
          : "Có lỗi xảy ra. Thử lại.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title="Đăng nhập" subtitle="Truy cập LMS Campus bằng tài khoản của bạn.">
      <Card className="mx-auto max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <ErrorBanner message={error} />

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="you@university.edu"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Mật khẩu</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <p className="text-center text-sm text-neutral-500">
            Tài khoản được cấp bởi quản trị viên. Liên hệ bộ phận hỗ trợ nếu cần trợ giúp.
          </p>
        </form>
      </Card>
    </PageShell>
  );
}
