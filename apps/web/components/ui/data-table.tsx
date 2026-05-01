import { type ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  title?: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  controls?: ReactNode;
  pagination?: {
    page: number;
    total: number;
    limit: number;
    onPageChange?: (page: number) => void;
  };
};

export function DataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  emptyTitle = "No data yet",
  emptyDescription = "There is nothing to display in this table.",
  controls,
  pagination
}: Props<T>) {
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <section className="brainio-card rounded-2xl p-4">
      {title || controls ? (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          {controls ? <div>{controls}</div> : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{emptyTitle}</p>
          <p className="mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((column) => (
                  <th key={column.key} className="px-0 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={rowKey(row, index)} className="border-b border-slate-200 last:border-0 hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-0 py-3 text-sm text-slate-800 ${column.className ?? ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {pagination.page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pagination.onPageChange?.(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1 || !pagination.onPageChange}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => pagination.onPageChange?.(Math.min(totalPages, pagination.page + 1))}
              disabled={pagination.page >= totalPages || !pagination.onPageChange}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
