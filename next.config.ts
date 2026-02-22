import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
}

export default nextConfig
