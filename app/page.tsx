"use client"

import { useEffect, useState } from "react"
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

  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("ANYWHERE")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [sortBy, setSortBy] = useState("Most Recent")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedPostID, setSelectedPostID] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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

  const locationOptions = Array.from(availableLocations).sort((a, b) => {
    if (a === "ANYWHERE") return -1
    if (b === "ANYWHERE") return 1
    return a.localeCompare(b)
  })

  // Handle URL params for shareability
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const postID = params.get("post")
    if (postID) {
      setSelectedPostID(postID)
      setIsDrawerOpen(true)
    }
  }, [])

  const openDrawer = (listing: Listing) => {
    setSelectedPostID(listing.id)
    setIsDrawerOpen(true)
    window.history.pushState({}, "", `?post=${listing.id}`)

    // TODO: Fire this once only when clicking the listing
    // Fire-and-forget POST to trigger update (if needed)
    fetch(`/api/listings/${listing.id}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => console.log("POST result:", data))
      .catch((err) => console.error("POST error:", err))
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedPostID(null)
    window.history.pushState({}, "", "/")
  }

  const filteredListings = listingsData?.data?.filter((listing) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        listing.properties.title?.toLowerCase().includes(query) ||
        listing.properties.company?.toLowerCase().includes(query) ||
        listing.properties.skills?.some((skill) =>
          skill.toLowerCase().includes(query)
        )
      if (!matchesSearch) return false
    }

    // Location filter (ANYWHERE shows all)
    if (locationQuery && locationQuery !== "ANYWHERE") {
      const location = listing.properties.location || ""
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
        listing.properties.skills?.includes(category)
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
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Search Filters */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Filter by title, company or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                />
              </div>
              <div className="w-16 md:w-52 relative">
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
                  className="w-full md:pl-4 pl-4 pr-10 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm appearance-none cursor-pointer"
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
                <IoChevronDownOutline className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {category}
                </button>
              ))}

              {categories.length > SHOW_OR_LESS_SIZE && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
            <p className="text-gray-700">
              Showing{" "}
              <span className="font-semibold">
                {sortedListings?.length || 0}
              </span>{" "}
              jobs
            </p>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-600">
                  {sortBy === "By Salary" ? "Highest Salary" : "Most Recent"}
                </span>
                <IoChevronDownOutline className="text-gray-400" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSortBy("Most Recent")
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg ${
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
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg ${
                      sortBy === "By Salary"
                        ? "text-black/50 font-medium"
                        : "text-black/80"
                    }`}
                  >
                    Highest Salary
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
                  className="h-36 bg-white rounded-xl animate-pulse border border-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-24">
              {sortedListings?.map((listing, idx) => (
                <button
                  key={listing.id}
                  onClick={() => openDrawer(listing)}
                  className="w-full text-left p-5 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex min-h-24 gap-6">
                    {/* Company Logo Placeholder */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {listing.properties.company?.[0]?.toUpperCase() || "?"}
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {listing.properties.title}
                        </h3>
                        {listing.rowIndex === 0 && (
                          <span className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-full uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex pb-6 max-w-xl flex-wrap items-center gap-3 text-sm text-black/50">
                        {listing.properties.location && (
                          <div className="flex rounded-lg pl-2 py-2 gap-2 pr-4 bg-black/5 items-center">
                            <IoLocationOutline className="text-base" />
                            <div className="flex text-black items-center gap-4">
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
                                    <span key={`c-${idx}-${formatted.name}`}>
                                      {formatted.emoji} {formatted.name}
                                    </span>
                                  )
                                })}
                            </div>
                          </div>
                        )}

                        {listing.properties.remotePolicy && (
                          <div className="flex rounded-lg p-2 text-black bg-black/5 items-center">
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

                        {/* Salary Range */}
                        {listing.properties.salaryRange?.map((range) => (
                          <div
                            key={`salary-${range}-${idx}`}
                            className="flex text-black rounded-lg pl-2 py-2 gap-2 pr-4 bg-black/5 items-center"
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

      <ModalJob
        open={isDrawerOpen}
        title={
          listingsData?.data?.find((l) => l.id === selectedPostID)?.properties
            .title
        }
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) {
            setSelectedPostID(null)
            window.history.pushState({}, "", "/")
          }
        }}
        postID={selectedPostID}
        applyLink={
          listingsData?.data?.find((l) => l.id === selectedPostID)?.applyLink
        }
      />
    </>
  )
}
