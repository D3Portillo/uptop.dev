"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { TListingResponse } from "./api/listings/route"
import {
  IoSearchOutline,
  IoLocationOutline,
  IoChevronDownOutline,
} from "react-icons/io5"

import { findBestMatch } from "@/lib/strings"
import { useJobsList } from "@/lib/jobs"

import ModalJob from "@/components/ModalJob"
import { CRYPTO_JOB_LOCATIONS } from "@/lib/constants/countries"
import { cn } from "@/lib/utils"

type Listing = TListingResponse["data"][number]

const LOCATION_KEYS = Object.keys(CRYPTO_JOB_LOCATIONS)

const normalizeLocation = (loc: string): string => {
  const trimmed = loc.trim().toUpperCase()

  // Exact match first
  if (trimmed in CRYPTO_JOB_LOCATIONS) {
    return trimmed
  }

  // Try fuzzy matching with Jaro-Winkler
  const bestMatch = findBestMatch(trimmed, LOCATION_KEYS, 0.85)

  // Return best match or fallback to "ANYWHERE"
  return bestMatch || "ANYWHERE"
}

export default function Home() {
  const SHOW_OR_LESS_SIZE =
    typeof window !== "undefined" && window.innerWidth < 800 ? 5 : 8

  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("ANYWHERE")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [sortBy, setSortBy] = useState("Most Recent")
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Helper function to parse salary from string like "$150k - $200k" or "> $300k"
  const parseSalary = (salaryStr: string): number => {
    if (!salaryStr) return 0
    // Remove $ and k, handle > sign, +, and spaces
    const cleaned = salaryStr.replace(/[$k,>\s+ ]/g, "")
    const possiblyRange = salaryStr.split("-")

    // If it's a range, take the higher number
    if (possiblyRange.length > 1) {
      const higherPart = possiblyRange[1].trim()
      return parseInt(higherPart) || 0
    }

    return parseInt(cleaned) || 0
  }

  const { data: listingsData, isLoading } = useJobsList()

  // Generate unique categories from all job skills, sorted by frequency
  const skillCounts = new Map<string, number>()
  listingsData?.data?.forEach((listing) => {
    listing.properties.skills?.forEach((skill) => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
    })
  })

  const categories = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([skill]) => skill)

  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, SHOW_OR_LESS_SIZE)

  // Extract unique locations from actual job postings
  const availableLocations = new Set<string>()
  availableLocations.add("ANYWHERE") // Always include ANYWHERE

  listingsData?.data?.forEach((listing) => {
    const location = listing.properties.location
    if (location) {
      location.split(",").forEach((loc) => {
        const normalized = normalizeLocation(loc)
        if (normalized) {
          availableLocations.add(normalized)
        }
      })
    }
  })

  const locationOptions = Array.from(availableLocations).sort((a, b) =>
    a.localeCompare(b)
  )

  const openDrawer = (listing: Listing) => {
    router.push(`?job=${listing.id}`, { scroll: false })
  }

  const filteredListings = listingsData?.data?.filter(({ properties }) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return [
        properties.title,
        properties.company,
        properties.location,
        properties.skills,
      ]
        .join("")
        .toLowerCase()
        .includes(query)
    }

    // Location filter (ANYWHERE shows all)
    if (locationQuery && locationQuery !== "ANYWHERE") {
      const location = properties.location || ""
      const normalizedJobLocations = location.split(",").map(normalizeLocation)

      const matchesLocation = normalizedJobLocations.some(
        (loc) => loc === locationQuery
      )

      if (!matchesLocation) {
        return false
      }
    }

    // Category filter (multiple selection)
    if (selectedCategories.length > 0) {
      const hasAnySkill = selectedCategories.some((category) =>
        properties.skills?.includes(category)
      )
      if (!hasAnySkill) return false
    }

    return true
  })

  // Sort listings based on selected option
  const sortedListings = [...(filteredListings || [])].sort((a, b) => {
    if (sortBy === "By Salary") {
      const aMaxSalary = Math.max(
        ...(a.properties.salaryRange?.map(parseSalary) || [0])
      )
      const bMaxSalary = Math.max(
        ...(b.properties.salaryRange?.map(parseSalary) || [0])
      )
      return bMaxSalary - aMaxSalary // Highest first
    }
    // "Most Recent" - keep original order (already sorted by date)
    return 0
  })

  return (
    <>
      {/* Main Container with Light Background */}
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Search Filters */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 text-xl" />
                <input
                  type="text"
                  placeholder="Filter by title, company or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                />
              </div>
              <div className="w-17 md:w-52 relative">
                {/* Display emoji on mobile */}
                <span className="absolute z-1 left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none md:hidden">
                  {
                    CRYPTO_JOB_LOCATIONS[
                      locationQuery as keyof typeof CRYPTO_JOB_LOCATIONS
                    ]?.emoji
                  }
                </span>

                <select
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full md:pl-4 pl-4 pr-10 py-3.5 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm appearance-none cursor-pointer"
                >
                  {locationOptions.map((locationKey) => {
                    const locationData =
                      CRYPTO_JOB_LOCATIONS[
                        locationKey as keyof typeof CRYPTO_JOB_LOCATIONS
                      ]
                    return (
                      <option key={locationKey} value={locationKey}>
                        <span className="md:inline hidden">
                          {locationData.emoji}
                        </span>{" "}
                        {locationData.name}
                      </option>
                    )
                  })}
                </select>
                <IoChevronDownOutline className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none" />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              {displayedCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(category)
                        ? prev.filter((c) => c !== category)
                        : [...prev, category]
                    )
                  }}
                  className={cn(
                    "px-3 py-1 h-8 border border-transparent rounded-lg text-sm transition-colors",
                    selectedCategories.includes(category)
                      ? "bg-ut-blue/20 text-black/90 border-black/10"
                      : "bg-black/3 text-black/50 border-black/5 hover:bg-black/5"
                  )}
                >
                  {category}
                </button>
              ))}

              {categories.length > SHOW_OR_LESS_SIZE && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="h-8 px-3 py-1 rounded-lg text-sm text-black/70 hover:bg-black/5 transition-colors"
                >
                  {showAllCategories
                    ? "Show less"
                    : `Show more (${categories.length - SHOW_OR_LESS_SIZE})`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-black/70">
              Showing{" "}
              <span className="font-semibold">
                {sortedListings?.length || 0}
              </span>{" "}
              jobs
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-lg bg-white hover:bg-black/5 transition-colors"
              >
                <span className="text-sm text-black/70">
                  {sortBy === "By Salary"
                    ? "Salary (high - low)"
                    : "Most Recent"}
                </span>
                <IoChevronDownOutline className="text-black/50" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSortBy("Most Recent")
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-black/5 first:rounded-t-lg ${
                      sortBy === "Most Recent"
                        ? "text-black/50 font-medium"
                        : "text-black/80"
                    }`}
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("By Salary")
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-black/5 last:rounded-b-lg ${
                      sortBy === "By Salary"
                        ? "text-black/50 font-medium"
                        : "text-black/80"
                    }`}
                  >
                    Salary (high - low)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={`mock-load-${i}`}
                  className="h-36 bg-white rounded-xl animate-pulse border border-black/10"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-24">
              {sortedListings?.map((listing, idx) => (
                <button
                  key={listing.id}
                  onClick={() => openDrawer(listing)}
                  className="w-full text-left p-5 bg-white border border-black/10 rounded-2xl hover:border-black/15 shadow-black/5 hover:shadow transition-all"
                >
                  <div className="flex min-h-24 gap-6">
                    {/* Company Logo Placeholder */}
                    <div className="w-16 h-16 bg-ut-purple border border-black/10 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {listing.properties.company?.[0]?.toUpperCase() || "?"}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {listing.properties.title}
                        </h3>
                        {listing.rowIndex === 0 && (
                          <span className="px-3 py-1 text-xs font-bold bg-ut-purple text-white rounded-full uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex *:min-h-10 pb-6 max-w-xl flex-wrap items-center gap-3 text-sm text-black/50">
                        {listing.properties.remotePolicy && (
                          <div className="flex rounded-lg px-3 py-2 text-black bg-black/5 items-center">
                            <span>
                              {(() => {
                                const policy =
                                  listing.properties.remotePolicy.toUpperCase()
                                const isHybrid = policy.includes("HYBRID")
                                const isRemote = policy.includes("REMOTE")
                                if (isHybrid) return "☕ Hybrid"
                                if (isRemote) return "💻 Remote"
                                return "🧳 On-site"
                              })()}
                            </span>
                          </div>
                        )}

                        {listing.properties.location && (
                          <div className="flex rounded-lg pl-2 py-2 gap-2 pr-4 bg-black/5 items-center">
                            <IoLocationOutline className="text-base shrink-0 hidden sm:block" />
                            <div
                              className={cn(
                                "flex flex-wrap text-black items-center gap-2",
                                listing.properties.location.includes(",") &&
                                  "py-2 sm:py-0"
                              )}
                            >
                              {listing.properties.location
                                .split(",")
                                .map((loc) => {
                                  const formatted =
                                    CRYPTO_JOB_LOCATIONS[
                                      normalizeLocation(
                                        loc as string
                                      ) as keyof typeof CRYPTO_JOB_LOCATIONS
                                    ]

                                  return (
                                    <span
                                      className="whitespace-nowrap px-1.5"
                                      key={`c-${idx}-${formatted.name}`}
                                    >
                                      {formatted.emoji} {formatted.name}
                                    </span>
                                  )
                                })}
                            </div>
                          </div>
                        )}

                        {/* Salary Range */}
                        {listing.properties.salaryRange?.map((range) => (
                          <div
                            key={`salary-${range}-${idx}`}
                            className="flex text-black rounded-lg pl-3 py-2 gap-2 pr-4 bg-black/5 items-center"
                          >
                            <span>💰</span>
                            <span className="font-medium">{range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && sortedListings?.length === 0 && (
            <section className="flex gap-2 py-16 flex-col items-center justify-center">
              <div className="text-black/50">
                No jobs found matching your search
              </div>

              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategories([])
                  setLocationQuery("")
                }}
                className="underline text-black/50"
              >
                Reset filters
              </button>
            </section>
          )}
        </div>
      </div>

      <ModalJob />
    </>
  )
}
