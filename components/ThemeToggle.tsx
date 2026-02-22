"use client"

import { useTheme } from "next-themes"
import { FaMoon, FaSun } from "react-icons/fa"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDarkTheme = theme === "dark"

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
      className="size-9 active:scale-98 text-base grid place-items-center rounded-xl border border-black/7 dark:border-white/7"
      aria-label="Toggle dark/light theme"
    >
      {isDarkTheme ? (
        <FaMoon className="opacity-80 hover:opacity-95 transition-opacity" />
      ) : (
        <FaSun className="opacity-80 hover:opacity-95 transition-opacity" />
      )}
    </button>
  )
}
