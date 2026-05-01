type Props = {
  label: string;
  value: string;
  trend?: string;
  tone?: "blue" | "mint" | "rose" | "violet";
};

const toneMap = {
  blue: "bg-blue-100 text-blue-700",
  mint: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700"
};

export function StatCard({ label, value, trend, tone = "blue" }: Props) {
  return (
    <article className="brainio-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${toneMap[tone]}`}>?</span>
        <div>
          <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
          {trend ? <p className="mt-1 text-xs text-slate-500">{trend}</p> : null}
        </div>
      </div>
    </article>
  );
}
