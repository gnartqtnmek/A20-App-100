import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="brainio-page-bg min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto grid max-w-6xl items-stretch gap-5 lg:grid-cols-[1.05fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-7 text-slate-100 shadow-2xl sm:p-10">
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl" />

          <div className="relative">
            <p className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-100">
              Brainio LMS
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">One campus workspace for every role</h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              Sign in once. Frontend routes stay role-specific while existing backend API and RBAC policy remain unchanged.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-sm font-semibold">Student and Lecturer</p>
                <p className="mt-1 text-xs text-slate-300">Learning flow, grading flow, notifications</p>
              </article>
              <article className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-sm font-semibold">Admin, Academic Staff, Advisor</p>
                <p className="mt-1 text-xs text-slate-300">Operations, approvals, intervention tracking</p>
              </article>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Brainio Stitch UI Active
      </p>
    </main>
  );
}
