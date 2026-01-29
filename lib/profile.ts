"use client"

import type { ProfileData } from "@/app/actions/profile"
import { addressToBackgroundImage } from "@/components/AddressBlock"
import { useUser } from "@clerk/nextjs"
import { toHex } from "viem"
import useSWR from "swr"
import { getProfileData } from "@/app/actions/profile"

export const toAddres = (userId?: string) => {
  return toHex(userId?.replace("user_", "") || "DEFAULT")
}

export const useProfileImage = () => {
  const { user } = useUser()
  const profileImage = user?.imageUrl
  const defaultImage = addressToBackgroundImage(toAddres(user?.id))

  return {
    backgroundImageURL: profileImage ? `url(${profileImage})` : defaultImage,
  }
}

/**
 * SWR hook to fetch user profile data from Redis
 * @param userId - The user ID to fetch profile data for
 */
export const useProfileData = (userId: string | null | undefined) => {
  const { data = null, ...query } = useSWR<ProfileData | null>(
    userId ? `profile.data.${userId}` : null,
    async () => {
      if (!userId) return null
      return await getProfileData(userId)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
    },
  )

  return {
    ...query,
    profile: data,
  }
}
