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
      <ModalJobWithSuspense />
      <Announcement />
      <ListingsSentinel />

      <div
        style={{
          backgroundImage: "url(/bg.svg)",
        }}
        className="top-0 left-0 w-screen h-screen pointer-events-none opacity-15 dark:opacity-10 bg-cover fixed"
      />
      {children}
    </Fragment>
  )
}
