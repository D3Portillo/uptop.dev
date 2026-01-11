import { Redis } from "@upstash/redis"

export const redis = Redis.fromEnv()

// Cache keys
export const CACHE_KEYS = {
  listings: "listings:metadata",
  listingDetail: (postID: string) => `listing:${postID}:details`,
} as const
