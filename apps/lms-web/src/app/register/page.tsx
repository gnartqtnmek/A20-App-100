"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ApiError, apiClient } from "@/lib/api-client";
import { Card, ErrorBanner, PageShell } from "@/components/page-shell";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Mật khẩu phải dài ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Hai mật khẩu không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.register({ email, full_name: fullName, password, role });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title="Đăng ký" subtitle="Tạo tài khoản mới cho hệ thống LMS.">
      <Card className="mx-auto max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <ErrorBanner message={error} />

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Họ và tên</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Nguyễn Văn A"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="you@university.edu"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Mật khẩu (tối thiểu 8 ký tự)</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Xác nhận mật khẩu</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </label>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium text-neutral-800">Bạn là</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["student", "lecturer"] as const).map((r) => (
                <label
                  key={r}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${
                    role === r
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="role"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  {r === "student" ? "Sinh viên" : "Giảng viên"}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? "Đang đăng ký..." : "Tạo tài khoản"}
          </button>

          <p className="text-center text-sm text-neutral-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-black hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </Card>
    </PageShell>
  );
}
