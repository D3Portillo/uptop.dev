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
  const { data, ...query } = useSWR(
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
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const jobs =
    data?.data.map((job) => {
      return {
        ...job,
        properties: {
          ...job.properties,
          formattedJobPolicy: formatPolicy(job.properties.remotePolicy || ""),
        },
      }
    }) || []

  // Generate unique categories from all job skills, sorted by frequency
  const skillCounts = new Map<string, number>()
  jobs.forEach((job) => {
    job.properties.skills?.forEach((skill) => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
    })
  })

  const skills = Array.from(skillCounts.entries())
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .map(([skill]) => skill)

  return {
    jobs,
    skills,
    ...query,
  }
}

export type JobsList = ReturnType<typeof useJobsList>["jobs"]

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
      revalidateOnReconnect: false,
    }
  )
}

const formatPolicy = (policy: string) => {
  const isHybrid = policy.includes("HYBRID")
  const isRemote = policy.includes("REMOTE")
  if (isHybrid) {
    return {
      emoji: "☕",
      label: "Hybrid",
    }
  }

  if (isRemote) {
    return {
      emoji: "💻",
      label: "Remote",
    }
  }

  return {
    emoji: "🧳",
    label: "On-site",
  }
}
