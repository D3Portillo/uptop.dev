"use client"

import type { TListingResponse } from "@/app/api/listings/route"
import type { TTelegramJobsResponse } from "@/app/api/telegram-jobs/route"
import type { TListingDetailsResponse } from "@/app/api/listings/[postID]/route"

import useSWR from "swr"
import { jsonify } from "@/lib/utils"
import { formatID } from "@/lib/id"

export type JobsList = ReturnType<typeof useJobsList>["jobs"]

const getInitialData = <T = any>(localStorageKey: string) => {
  if (typeof window === "undefined") return undefined
  const localCache = localStorage.getItem(localStorageKey)
  return localCache ? (JSON.parse(localCache) as T) : undefined
}

const waitForStack = (): Promise<void> => {
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
    },
  )

  const { getMetadataForID } = useTelegramJobsMetadata()

  const jobs =
    data?.data.map((job) => {
      const cachedDetails = getCachedJobDetails(job.id)
      const telegramMetadata = getMetadataForID(job.formattedId)

      const {
        datePosted,
        faviconBaseDomain = null,
        clientName: tgCompany = null,
      } = telegramMetadata || {}

      return {
        ...job,
        properties: {
          ...job.properties,
          faviconBaseDomain,
          // Prefer TG fetched company name if available
          company: tgCompany || job.properties.company,
          formattedJobPolicy: formatPolicy(job.properties.remotePolicy || ""),
          datePosted: cachedDetails?.post?.datePosted || datePosted || null,
        },
      }
    }) || []

  return {
    jobs,
    ...query,
  }
}

export const extractSkillsFromJobs = (jobs: JobsList) => {
  // Generate unique categories from all job skills, sorted by frequency
  const skillCounts = new Map<string, number>()
  jobs.forEach((job) => {
    job.properties.skills?.forEach((skill) => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
    })
  })

  return Array.from(skillCounts.entries())
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .map(([skill]) => skill)
}

const getJobDetailsKey = (postID: string) => `ut.job.${postID}`
export const getCachedJobDetails = (
  postID: string,
): TListingDetailsResponse | null => {
  if (typeof window === "undefined") return null
  const localCache = localStorage.getItem(getJobDetailsKey(postID))
  return localCache ? (JSON.parse(localCache) as TListingDetailsResponse) : null
}

export const useJobDetails = (postID: string | null) => {
  const { getMetadataForID } = useTelegramJobsMetadata()

  const tgMetadata = postID ? getMetadataForID(formatID(postID)) : null

  const { data = null, ...query } = useSWR(
    postID ? `/api/listings/${postID}` : null,
    async (url: string) => {
      if (!postID) return null

      const localCache = getCachedJobDetails(postID)
      if (localCache) return localCache

      const data = await jsonify<Partial<TListingDetailsResponse>>(fetch(url))
      console.debug({ data })
      if (data?.post?.description) {
        // Cache when we have description data
        localStorage.setItem(getJobDetailsKey(postID), JSON.stringify(data))
        await waitForStack()
      }

      return data
    },
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  return {
    ...query,
    datePosted: data?.post?.datePosted || tgMetadata?.datePosted || null,
    description: data?.post?.description || null,
  }
}

const TG_EXTRA_DATA = "ut.jobs.tg-data"
export const useTelegramJobsMetadata = () => {
  const { data = [] } = useSWR(
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
    },
  )

  return {
    jobs: data,
    /**
     * Get Telegram-fetched metadata for a given job ID (formattedJobID)
     */
    getMetadataForID: (jobID: string) =>
      data.find(
        (tg) => tg?.formattedJobID?.toLowerCase() === jobID.toLowerCase(),
      ) || null,
  }
}
