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

      {children}
    </Fragment>
  )
}
