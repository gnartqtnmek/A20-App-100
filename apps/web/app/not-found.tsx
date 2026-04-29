import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brainio p-6">
      <div className="max-w-md rounded-soft border border-white/45 bg-white/70 p-8 text-center shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-brand.night dark:text-white">Role page not found</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use one of the five supported Brainio roles.</p>
        <Link href="/" className="mt-5 inline-flex rounded-full bg-brand.night px-5 py-2 text-sm font-semibold text-white">
          Go Home
        </Link>
      </div>
    </main>
  );
}
