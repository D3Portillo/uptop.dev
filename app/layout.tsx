import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import MainLayout from "./MainLayout"

const nextFont = Inter({
  subsets: [],
  display: "fallback",
  adjustFontFallback: true,
  preload: true,
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "Up Top - TOP SHELF JOBS",
  description:
    "Find your next remote job with Up Top's curated job board. NOTE: This is a community owned project and is not affiliated with Up Top.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      dynamic
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html lang="en">
        <body className={`${nextFont.className} antialiased`}>
          <MainLayout>{children}</MainLayout>
        </body>
      </html>
    </ClerkProvider>
  )
}
