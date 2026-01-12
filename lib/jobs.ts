"use client"

import type { TListingResponse } from "@/app/api/listings/route"
import type { TListingDetailsResponse } from "@/app/api/listings/[postID]/route"

import useSWR from "swr"
import { jsonify } from "@/lib/utils"

const LOCAL_LISTINGS_KEY = "ut.jobs.listings"

const getInitialData = () => {
  if (typeof window === "undefined") return undefined
  const localCache = localStorage.getItem(LOCAL_LISTINGS_KEY)
  return localCache ? (JSON.parse(localCache) as TListingResponse) : undefined
}

const waitForStack = (): void => {
  // Wait for call stack to clear
  return new Promise((resolve) => setTimeout(resolve, 50)) as any
}

export const useJobsList = () => {
  return useSWR(
    "/api/listings",
    async (url: string) => {
      const data = await jsonify<TListingResponse>(fetch(url))

      if (data.data.length > 0) {
        // Cache if we got any job listings
        await waitForStack()
        localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(data))
      }

      return data
    },
    {
      fallbackData: getInitialData(),
      keepPreviousData: true,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )
}

export const useJobDetails = (postID: string | null) => {
  return useSWR(
    postID ? `/api/listings/${postID}` : null,
    async (url: string) => {
      if (!postID) return null

      const LOCAL_KEY = `ut.job.${postID}`
      const localCache = localStorage.getItem(LOCAL_KEY)
      if (localCache) {
        return JSON.parse(localCache) as TListingDetailsResponse
      }

      const data = await jsonify<TListingDetailsResponse>(fetch(url))
      if (data.post.description && data.post.datePosted) {
        // Cache locally to reduce redundant fetches
        await waitForStack()
        localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
      }

      return data
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )
}
