"use client"

import { Fragment, type PropsWithChildren } from "react"
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
  return (
    <Fragment>
      <div
        style={{
          backgroundImage: `url(/bg.png)`,
        }}
        className="top-0 opacity-30 dark:opacity-45 blur-lg -z-1 left-0 w-screen h-screen pointer-events-none bg-cover fixed"
      />

      <ModalJobWithSuspense />
      <Announcement />
      <ListingsSentinel />

      {children}
    </Fragment>
  )
}
