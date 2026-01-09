"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { TListingResponse } from "./api/listings/route"
import { TListingDetailsResponse } from "./api/listings/[postID]/route"
import {
  IoSearchOutline,
  IoCloseOutline,
  IoLocationOutline,
  IoChevronDownOutline,
} from "react-icons/io5"

// SWR fetcher with localStorage cache
const fetcher = async (url: string) => {
  const cacheKey = `cache:${url}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    // Cache for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data
    }
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  const data = await res.json()

  localStorage.setItem(
    cacheKey,
    JSON.stringify({ data, timestamp: Date.now() })
  )
  return data
}

type Listing = TListingResponse["data"][number]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [sortBy, setSortBy] = useState("Most Recent")
  const [selectedPostID, setSelectedPostID] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: listingsData, isLoading } = useSWR<TListingResponse>(
    "/api/listings",
    fetcher
  )

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
    : categories.slice(0, 8)

  const { data: detailsData, isLoading: isLoadingDetails } =
    useSWR<TListingDetailsResponse>(
      selectedPostID ? `/api/listings/${selectedPostID}` : null,
      fetcher
    )

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

    // Location filter
    if (locationQuery) {
      const location = listing.properties.location?.toLowerCase() || ""
      const remotePolicy = listing.properties.remotePolicy?.toLowerCase() || ""
      const query = locationQuery.toLowerCase()
      if (!location.includes(query) && !remotePolicy.includes(query)) {
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
              <div className="w-80 relative">
                <IoLocationOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="remote"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                />
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
              {categories.length > 8 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {showAllCategories
                    ? "Show less"
                    : `Show more (${categories.length - 8})`}
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
                {filteredListings?.length || 0}
              </span>{" "}
              jobs
            </p>
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-600">{sortBy}</span>
                <IoChevronDownOutline className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-white rounded-xl animate-pulse border border-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings?.map((listing, idx) => (
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
                        {idx === 0 && (
                          <span className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      {listing.properties.company && (
                        <p className="text-gray-600 mb-3">
                          {listing.properties.company}
                        </p>
                      )}

                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {listing.properties.location && (
                          <div className="flex items-center gap-1.5">
                            <IoLocationOutline className="text-base" />
                            <span>Remote: 🌍 Anywhere</span>
                          </div>
                        )}
                        {listing.properties.remotePolicy && (
                          <div className="flex items-center gap-1.5">
                            <span>💼 {listing.properties.remotePolicy}</span>
                          </div>
                        )}
                      </div>

                      {/* Salary Range */}
                      {listing.properties.salaryRange &&
                        listing.properties.salaryRange.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-600">
                            <span>💰</span>
                            <span className="font-medium">
                              {listing.properties.salaryRange.join(" - ")}
                            </span>
                            <span className="ml-2 text-gray-500">
                              ⏰ Full-Time
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && filteredListings?.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No jobs found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-x-0 bottom-0 top-16 sm:top-20 z-50 overflow-hidden">
            <div className="h-full max-w-2xl mx-auto px-4 sm:px-6">
              <div className="h-full bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Details
                  </h2>
                  <button
                    onClick={closeDrawer}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <IoCloseOutline className="text-2xl text-gray-600" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoadingDetails ? (
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ) : detailsData?.success ? (
                    <div className="space-y-6">
                      {detailsData.post.datePosted && (
                        <div className="text-sm text-gray-500">
                          Posted:{" "}
                          {new Date(
                            detailsData.post.datePosted
                          ).toLocaleDateString()}
                        </div>
                      )}

                      {detailsData.post.description ? (
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                            {detailsData.post.description}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">
                          No detailed description available.
                        </p>
                      )}

                      {/* Apply Link */}
                      {listingsData?.data?.find((l) => l.id === selectedPostID)
                        ?.applyLink && (
                        <a
                          href={
                            listingsData.data.find(
                              (l) => l.id === selectedPostID
                            )?.applyLink
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3 px-4 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Apply Now
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Failed to load job details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
