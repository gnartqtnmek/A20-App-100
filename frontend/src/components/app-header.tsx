"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearSession, getAccessToken, getUserRole } from "@/lib/auth-storage";
import { apiClient } from "@/lib/api-client";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const token = getAccessToken();
  const role = getUserRole();

  async function onLogout() {
    try {
      await apiClient.logout();
    } catch {
      clearSession();
    }
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `rounded-full px-3 py-1.5 text-sm transition ${
      pathname === href ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-200"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-black">
          LMS Campus
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>

          {!token ? (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>
              <Link href="/register" className={linkClass("/register")}>
                Register
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full bg-rose-600 px-3 py-1.5 text-sm text-white transition hover:bg-rose-700"
            >
              Logout {role ? `(${role})` : ""}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
