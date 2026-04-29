"use client";

import { useEffect, useState } from "react";

import { roleReport } from "@/lib/api";
import type { RoleReport } from "@/lib/lms";
import type { RoleSlug } from "@/lib/roles";

type Props = {
  role: RoleSlug;
  accessToken: string;
};

export function ReportsPanel({ role, accessToken }: Props) {
  const [report, setReport] = useState<RoleReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const data = await roleReport(role, accessToken);
        setReport(data);
      } finally {
        setIsLoading(false);
      }
    }
    void loadReport();
  }, [role, accessToken]);

  return (
    <section className="rounded-2xl border border-white/50 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/45">
      <h3 className="text-lg font-semibold text-brand.night dark:text-white">Role Report</h3>
      {isLoading ? <p className="mt-3 text-sm text-slate-500">Loading report...</p> : null}
      {!isLoading && !report ? <p className="mt-3 text-sm text-slate-500">No report available.</p> : null}
      {report ? (
        <div className="mt-3 space-y-2">
          {report.items.map((item) => (
            <div key={item.key} className="rounded-lg border border-slate-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">{item.key}</span>: {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
