"use client"

import { useEffect, useState } from "react"
import { FaMoon, FaSun } from "react-icons/fa"

const isDarkThemeActive = () => {
  if (typeof window === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

export default function ThemeToggle() {
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => setIsDarkTheme(isDarkThemeActive()), [])

  const toggleTheme = () => {
    const isDarkTheme = isDarkThemeActive()
    const theme = isDarkTheme ? "light" : "dark"

    document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", theme)
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="size-9 text-base grid place-items-center rounded-xl border border-black/7 dark:border-white/7"
      aria-label="Toggle theme"
    >
      {isDarkTheme ? (
        <FaMoon className="opacity-80" />
      ) : (
        <FaSun className="opacity-80" />
      )}
    </button>
  )
}
