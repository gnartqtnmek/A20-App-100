import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brainio px-4 py-6 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-soft border border-white/45 bg-white/70 p-7 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:p-10">
          <p className="inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand.sky">
            Brainio LMS
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-brand.night dark:text-white sm:text-5xl">
            Access Your Role Workspace
          </h1>
          <p className="mt-4 text-base text-slate-700 dark:text-slate-200">
            Secure authentication for all five campus roles with RBAC-protected API access.
          </p>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
