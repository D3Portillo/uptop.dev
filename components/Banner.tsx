"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { IoArrowForwardSharp, IoCloseOutline } from "react-icons/io5"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useIsJotaiHydrated } from "@/lib/jotai"

const BANNER_HIDE_MS = 12 * 60 * 60 * 1000 // 12 hours
const atomBanner = atomWithStorage("uptop::banner", {
  clickCount: 0,
  hiddenUntil: 0,
})

export default function Banner() {
  const [persisted, setPersisted] = useAtom(atomBanner)
  const [visible, setVisible] = useState(false)
  const { isHydrated } = useIsJotaiHydrated()

  useEffect(() => {
    if (isHydrated && persisted.hiddenUntil <= Date.now()) {
      setVisible(true)
    }
  }, [isHydrated])

  if (!visible) return null

  function handleHide() {
    setVisible(false)

    const newCount = persisted.clickCount + 1
    if (newCount >= 3) {
      setPersisted({ clickCount: 0, hiddenUntil: Date.now() + BANNER_HIDE_MS })
    } else {
      setPersisted({ ...persisted, clickCount: newCount })
    }
  }

  return (
    <nav className="bg-white/70 dark:bg-black/70 backdrop-blur border-b border-black/7 dark:border-white/20 z-1 sticky top-0 text-black dark:text-white">
      <div className="max-w-6xl py-4 px-6 mx-auto flex items-center justify-between text-sm">
        <div className="w-4 hidden sm:block" />
        <Link
          href="/deepscan"
          className="font-semibold opacity-80 dark:opacity-90 group flex items-center gap-2"
        >
          <span className="hidden sm:inline">Price your skills.</span>
          <span className="mr-2">Discover your market value</span>
          <IoArrowForwardSharp className="text-xl scale-105 group-hover:translate-x-px" />
        </Link>

        <button
          onClick={handleHide}
          className="p-1.5 rounded-md border border-black/7 dark:border-white/10 group dark:text-white"
        >
          <IoCloseOutline className="text-lg opacity-70 group-hover:opacity-100" />
        </button>
      </div>
    </nav>
  )
}
