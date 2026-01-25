import type { Address } from "viem"
import { cn } from "@/lib/utils"

export default function AddressBlock({
  address,
  className,
}: {
  address: Address
  className?: string
}) {
  const { from, to } = addressToGradient(address)

  return (
    <figure
      style={{
        backgroundImage: `
          radial-gradient(circle at 66% 33%, rgba(255, 255, 255, 0.4), transparent 50%),
          linear-gradient(to bottom right, ${from}, ${to})
        `,
      }}
      className={cn("size-6 rounded-full", className)}
    />
  )
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
