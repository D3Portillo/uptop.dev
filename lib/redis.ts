import { Redis } from "@upstash/redis"

export const redis = Redis.fromEnv()

// Cache keys
export const CACHE_KEYS = {
  listings: "uptop:listings:all",
  listingDetail: (postID: string) => `uptop:listings:${postID}:details`,
  browserLock: "uptop:browser:lock",
} as const
