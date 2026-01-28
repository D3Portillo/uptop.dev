"use client"

import type { PropsWithChildren } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const Auth = dynamic(() => import("./Auth"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-28 animate-pulse bg-pink-600/15 dark:bg-white/10 rounded-full" />
  ),
})

const ThemeToggle = dynamic(() => import("./ThemeToggle"), {
  ssr: false,
})

export default function TopNavigation({
  children,
  className,
  onHomeButtonPress,
}: PropsWithChildren<{
  onHomeButtonPress?: () => void
  className?: string
}>) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-white/10 border-b border-black/10 dark:border-white/10",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-6">
        <nav className="flex mt-1 sm:mt-4 mb-5 gap-1 text-lg whitespace-nowrap items-center">
          <button
            className="flex items-center gap-2 active:scale-98"
            onClick={onHomeButtonPress}
          >
            <figure className="text-2xl scale-110">🦄</figure>
            <strong>Up Top /</strong>
          </button>
          <h1>Jobs</h1>
          <div className="grow" />

          <div className="flex gap-1 items-center">
            <ThemeToggle />
            <Auth />
          </div>
        </nav>

        {children}
      </div>
    </div>
  )
}
