"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "brainio_theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    const nextDark = stored === "dark";
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  function handleToggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
    >
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
