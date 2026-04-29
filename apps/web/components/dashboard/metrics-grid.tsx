type Metric = {
  label: string;
  value: string;
  trend: string;
};

type Props = {
  metrics: Metric[];
};

export function MetricsGrid({ metrics }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-2xl border border-white/45 bg-white/75 p-4 shadow-md backdrop-blur dark:border-white/10 dark:bg-slate-900/45"
        >
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="mt-2 text-3xl font-bold text-brand.night dark:text-white">{metric.value}</p>
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{metric.trend}</p>
        </article>
      ))}
    </section>
  );
}
