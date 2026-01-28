"use client"

import { Fragment, useLayoutEffect, type PropsWithChildren } from "react"
import dynamic from "next/dynamic"

const Announcement = dynamic(() => import("@/components/Announcement"), {
  ssr: false,
})

const ListingsSentinel = dynamic(
  () => import("@/components/ListingsSentinel"),
  {
    ssr: false,
  },
)

const ModalJobWithSuspense = dynamic(() => import("@/components/ModalJob"), {
  ssr: false,
})

export default function MainLayout({ children }: PropsWithChildren) {
  useLayoutEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else document.documentElement.classList.remove("dark")
  }, [])

  return (
    <Fragment>
      <ModalJobWithSuspense />
      <Announcement />
      <ListingsSentinel />

      {children}
    </Fragment>
  )
}
