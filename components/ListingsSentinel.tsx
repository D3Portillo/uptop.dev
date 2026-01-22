"use client"

import { useEffect } from "react"

export default function ListingsSentinel() {
  useEffect(() => {
    // Try update listings incrementally as user visits home page
    fetch("/api/listings", {
      method: "POST",
    })
      .then((r) => r.json())
      .then((result) => console.debug({ ISRData: result }))
      .catch(console.error)
  }, [])

  return null
}
