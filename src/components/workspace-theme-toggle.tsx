"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type WorkspaceTheme = "light" | "dark";

const STORAGE_KEY = "smart-ict-workspace-theme";

export function WorkspaceThemeToggle() {
  const [theme, setTheme] = useState<WorkspaceTheme | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: WorkspaceTheme = stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.workspaceTheme = initial;
    const frame = window.requestAnimationFrame(() => setTheme(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isDark = theme === "dark";

  function toggleTheme() {
    const next: WorkspaceTheme = isDark ? "light" : "dark";
    document.documentElement.dataset.workspaceTheme = next;
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="workspace-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
