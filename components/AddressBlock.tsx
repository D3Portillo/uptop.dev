"use client"

import type { Address } from "viem"
import { cn } from "@/lib/utils"
import { useProfileImage } from "@/lib/profile"

export default function AddressBlock({
  address,
  className,
  showAuthImage,
}: {
  address: Address
  className?: string
  showAuthImage?: boolean
}) {
  const { backgroundImageURL } = useProfileImage()

  return (
    <figure
      style={{
        backgroundImage: showAuthImage
          ? backgroundImageURL
          : addressToBackgroundImage(address),
      }}
      className={cn("size-6 bg-cover rounded-full", className)}
    />
  )
}

export const addressToBackgroundImage = (address: Address) => {
  const { from, to } = addressToGradient(address)
  return `radial-gradient(circle at 66% 33%, rgba(255, 255, 255, 0.4), transparent 50%), linear-gradient(to bottom right, ${from}, ${to})`
}

function addressToGradient(address: Address) {
  // Use different parts of the address to generate two hue values
  const hash1 = parseInt(address.slice(2, 10), 16)
  const hash2 = parseInt(address.slice(-8), 16)

  // Map to hue values (0-360deg)
  return {
    from: `hsl(${hash1 % 360}, 70%, 50%)`,
    to: `hsl(${hash2 % 360}, 70%, 50%)`,
  }
}
