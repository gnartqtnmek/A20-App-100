import { type ReactNode } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

type Props = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClass: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  primary: "border-blue-200 bg-blue-100 text-blue-700",
  success: "border-emerald-200 bg-emerald-100 text-emerald-700",
  warning: "border-amber-200 bg-amber-100 text-amber-700",
  danger: "border-rose-200 bg-rose-100 text-rose-700"
};

export function Badge({ children, tone = "neutral", className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
