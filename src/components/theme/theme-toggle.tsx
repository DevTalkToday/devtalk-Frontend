"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="테마 전환"
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) px-3 transition duration-150 hover:-translate-y-px hover:border-(--accent)"
    >
      <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-(--border) bg-(--surface-soft) p-0.5">
        <span
          className={[
            "size-4 rounded-full bg-(--accent) shadow-[0_10px_20px_var(--accent-soft)] transition-transform duration-200",
            theme === "light" ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span className="ml-2 hidden text-sm font-semibold sm:inline">테마</span>
    </button>
  );
}
