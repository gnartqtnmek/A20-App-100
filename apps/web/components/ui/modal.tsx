import { type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-900/35" aria-label="Close modal" />
      <section className="relative z-10 w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
            Close
          </button>
        </header>
        <div>{children}</div>
        {footer ? <footer className="mt-4 flex justify-end gap-2">{footer}</footer> : null}
      </section>
    </div>
  );
}
