import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaRoute: string;
};

export function HeroCard({ title, subtitle, ctaLabel, ctaRoute }: Props) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/40 bg-gradient-to-br from-brand.sky/80 via-brand.mint/80 to-brand.sun/75 p-6 text-slate-900 shadow-glass">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">Brainio Focus</p>
      <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm sm:text-base">{subtitle}</p>
      <Link
        href={ctaRoute}
        className="mt-5 inline-flex rounded-full bg-brand.night px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
