"use client"

import type { PropsWithChildren } from "react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const Auth = dynamic(() => import("./Auth"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-28 animate-pulse bg-black/10 dark:bg-white/10 rounded-full" />
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
        "bg-white/40 dark:bg-white/10 border-b border-black/10 dark:border-white/10",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-6">
        <nav className="flex mt-1 sm:mt-4 mb-5 gap-1 text-lg whitespace-nowrap items-center">
          <button
            className="flex items-center gap-2 active:scale-98"
            onClick={onHomeButtonPress}
          >
            <figure className="w-7 pt-px">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="w-full"
                viewBox="0 0 500 400"
              >
                <path
                  fill="var(--color-ut-blue-dark)"
                  d="m487 70-79 46v59l-78 46v57l-82 47v59l239-136z"
                />
                <path
                  fill="currentColor"
                  d="m171 63 79-46 237 53-79 46zM91 168l80-46 237 53-78 46zM12 272l79-46 239 52-82 47z"
                />
              </svg>
            </figure>
            <strong>
              UP TOP <span className="sm:ml-3">/</span>
            </strong>
          </button>
          <h1>
            <span className="sm:hidden">JOBS</span>
            <span className="hidden ml-3 sm:inline">TOP SHELF JOBS</span>
          </h1>
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
