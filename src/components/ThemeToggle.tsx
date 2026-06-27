"use client";

import { useTheme } from "./ThemeProvider";
import { MoonIcon, SunIcon } from "./icons";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Sun / moon toggle. Shows the icon for the mode you'll switch *to*:
 * a moon while in light mode, a sun while in dark mode.
 */
export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chế độ sáng" : "Chế độ tối"}
      className={`flex h-12 w-12 items-center justify-center rounded-full text-love-brown transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <SunIcon className="h-8 w-8" />
      ) : (
        <MoonIcon className="h-8 w-8" />
      )}
    </button>
  );
}
