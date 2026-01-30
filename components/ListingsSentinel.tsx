"use client"

import { useEffect } from "react"

const THROTTLE_KEY = "listings_last_fetch"
const THROTTLE_DURATION = 30_000 // 30 seconds

export default function ListingsSentinel() {
  useEffect(() => {
    const lastFetchTime = localStorage.getItem(THROTTLE_KEY)
    const now = Date.now()
    let didFetchISR = false

    // Only fetch if no previous fetch OR at least 10s have passed
    if (
      lastFetchTime === null ||
      now - Number(lastFetchTime) >= THROTTLE_DURATION
    ) {
      didFetchISR = true

      // Store last fetch time
      localStorage.setItem(THROTTLE_KEY, now.toString())

      // Try update listings incrementally as user visits home page
      fetch("/api/listings", {
        method: "POST",
      })
        .then((r) => r.json())
        .then((result) => console.debug({ ISRData: result }))
        .catch(console.error)
    }

    console.debug({ didFetchISR })
  }, [])

  return null
}
