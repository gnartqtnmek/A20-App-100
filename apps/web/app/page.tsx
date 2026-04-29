import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brainio px-4 py-6 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-soft border border-white/45 bg-white/65 p-7 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 sm:p-10">
          <p className="inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand.sky">
            Brainio LMS
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-brand.night dark:text-white sm:text-5xl">
            Premium Learning Cockpit for Every Campus Role
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-700 dark:text-slate-200">
            Production-auth ready LMS workspace for student, lecturer, admin, academic staff, and advisor.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-brand.night px-5 py-2 text-sm font-semibold text-white">
              Go To Login
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-transparent dark:text-slate-200"
            >
              API Docs
            </Link>
          </div>
        </section>

        <section className="rounded-soft border border-white/45 bg-white/65 p-6 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 sm:p-8">
          <h2 className="text-2xl font-bold text-brand.night dark:text-white">Sprint 4 Ready</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>JWT access + refresh token auth</li>
            <li>Role-based protected dashboards</li>
            <li>Admin user CRUD and profile API</li>
            <li>Alembic migration + seed data</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
