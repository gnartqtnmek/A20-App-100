import { type ReactNode } from "react";

type TabItem = {
  key: string;
  label: string;
  content?: ReactNode;
};

type Props = {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: Props) {
  return (
    <div>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.find((item) => item.key === value)?.content ? <div className="mt-4">{tabs.find((item) => item.key === value)?.content}</div> : null}
    </div>
  );
}
