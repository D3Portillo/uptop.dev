import "./globals.css"
import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"

const nextFont = Geist_Mono({
  subsets: [],
  display: "fallback",
  adjustFontFallback: true,
  preload: true,
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "UpTop - Top Shelf Jobs",
  description:
    "Find your next remote job with UpTop's curated job board. NOTE: This is a community owned project and is not affiliated with UpTop.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${nextFont.className} antialiased`}>{children}</body>
    </html>
  )
}
