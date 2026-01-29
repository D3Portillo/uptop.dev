"use client"

import { addressToBackgroundImage } from "@/components/AddressBlock"
import { useUser } from "@clerk/nextjs"
import { toHex } from "viem"

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
