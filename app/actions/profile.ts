"use server"

import { redis } from "@/lib/redis"

export type ProfileData = {
  userId: string
  fullName?: string
  email?: string
  twitter?: string
  telegram?: string
  linkedin?: string
  selectedSkills?: string[]
  hasCryptoExperience?: boolean
  cvUrl?: string
  cvFileName?: string
  updatedAt?: number
}

const PROFILE_KEYS = {
  profileData: (userId: string) => `uptop:profile:${userId}`,
}

/**
 * Save or update user profile data in Redis
 * Accepts partial profile data and merges with existing data
 */
export async function setProfileData(
  userId: string,
  data: Partial<Omit<ProfileData, "userId">>,
) {
  if (!userId) throw new Error("Missing userId")

  // Get existing profile data
  const existingData = (await redis.get(PROFILE_KEYS.profileData(userId))) || {}

  // Merge with new data
  const updatedData: ProfileData = {
    ...existingData,
    ...data,
    userId,
    updatedAt: Date.now(),
  }

  // Save to Redis
  await redis.set(PROFILE_KEYS.profileData(userId), updatedData)
}

/**
 * Fetch user profile data from Redis
 */
export async function getProfileData(
  userId: string,
): Promise<ProfileData | null> {
  if (!userId) return null
  return await redis.get<ProfileData>(PROFILE_KEYS.profileData(userId))
}

/**
 * Delete user profile data from Redis
 */
export async function deleteProfileData(userId: string) {
  if (!userId) throw new Error("Missing userId")
  try {
    await redis.del(PROFILE_KEYS.profileData(userId))
  } catch (error) {
    console.error({ error })
  }
}
