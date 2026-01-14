"use client"

import type { TListingResponse } from "@/app/api/listings/route"
import type { TTelegramJobsResponse } from "@/app/api/telegram-jobs/route"
import type { TListingDetailsResponse } from "@/app/api/listings/[postID]/route"

import useSWR from "swr"
import { jsonify } from "@/lib/utils"

export type JobsList = ReturnType<typeof useJobsList>["jobs"]

const getInitialData = <T = any>(localStorageKey: string) => {
  if (typeof window === "undefined") return undefined
  const localCache = localStorage.getItem(localStorageKey)
  return localCache ? (JSON.parse(localCache) as T) : undefined
}

const waitForStack = (): void => {
  // Wait for call stack to clear
  return new Promise((resolve) => setTimeout(resolve, 50)) as any
}

const formatPolicy = (policy: string) => {
  const isHybrid = policy.includes("HYBRID")
  const isRemote = policy.includes("REMOTE")
  if (isHybrid) {
    return {
      emoji: "🎒",
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
    emoji: "📒",
    label: "On-site",
  }
}

const LOCAL_LISTINGS_KEY = "ut.jobs.listings"
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
      fallbackData: getInitialData<TListingResponse>(LOCAL_LISTINGS_KEY),
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const { data: tgJobsMetadata } = useTelegramJobsMetadata()

  const jobs =
    data?.data.map((job) => {
      const telegramMetadata = tgJobsMetadata?.find(
        (tg) =>
          tg?.formattedJobID?.toLowerCase() === job.formattedId.toLowerCase()
      )

      const { faviconBaseDomain = null, clientName: company = null } =
        telegramMetadata || {}

      return {
        ...job,
        properties: {
          ...job.properties,
          faviconBaseDomain,
          company: company || job.properties.company,
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

const TG_EXTRA_DATA = "ut.jobs.tg-data"
export const useTelegramJobsMetadata = () => {
  return useSWR(
    "/api/telegram-jobs",
    async (url: string) => {
      const data = await jsonify<TTelegramJobsResponse>(fetch(url))

      if (data.length > 0) {
        // Cache if we got any job listings
        await waitForStack()
        localStorage.setItem(TG_EXTRA_DATA, JSON.stringify(data))
      }

      return data
    },
    {
      fallbackData: getInitialData<TTelegramJobsResponse>(TG_EXTRA_DATA),
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
}
