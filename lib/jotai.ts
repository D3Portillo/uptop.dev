"use client"

import { atom, useAtom } from "jotai"
import { useEffect } from "react"

const atomIsJotaiHydrated = atom(false)
export const useIsJotaiHydrated = () => {
  const [isHydrated, setHydrated] = useAtom(atomIsJotaiHydrated)

  useEffect(() => {
    // Wait for stack to clear before marking as hydrated
    setTimeout(() => setHydrated(true))
  }, [])

  return {
    isHydrated,
  }
}
