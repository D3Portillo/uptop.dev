import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "pdf-parse",
        "pdfjs-dist",
      ]
    }
    return config
  },
}

export default nextConfig
