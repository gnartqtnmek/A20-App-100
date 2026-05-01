import { type ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-sm text-slate-600 sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="pt-1">{actions}</div> : null}
    </header>
  );
}
