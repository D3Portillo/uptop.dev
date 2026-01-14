import sharp from "sharp"
import { staledResponse } from "@/lib/routes"

const WHITE = {
  hex: "#ffffff",
  rgb: { r: 255, g: 255, b: 255 },
  isTransparent: false,
}

async function getBackgroundColor(imageUrl: string) {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const image = sharp(buffer)

  const { channels, dominant } = await image.stats()

  // Check if image has significant transparency
  if (channels[3]) {
    const alphaChannel = channels[3]
    const avgAlpha = alphaChannel.mean

    // If average alpha is low (mostly transparent), return white
    if (avgAlpha < 200) {
      return {
        ...WHITE,
        isTransparent: true,
      }
    }
  }

  // Get dominant color
  const { r, g, b } = dominant

  // If color is very close to white, return pure white
  if ([r, g, b].every((value) => value >= 245)) {
    return {
      ...WHITE,
      isTransparent: false,
    }
  }

  const hex = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`

  return {
    hex,
    rgb: { r, g, b },
    isTransparent: false,
  }
}

export const revalidate = 86400 // 1 day

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const imageUrl = searchParams.get("bg-color")

  if (!imageUrl) {
    return staledResponse(
      { error: "Missing 'bg-color' query parameter" },
      { statusCode: 400 }
    )
  }

  try {
    const color = await getBackgroundColor(imageUrl)
    return staledResponse(color, { timeInSeconds: revalidate })
  } catch (error) {
    console.error("Background color extraction error:", error)
    return staledResponse(
      { error: "Failed to extract background color" },
      { statusCode: 500 }
    )
  }
}
