"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { TListingResponse } from "./api/listings/route"
import { TListingDetailsResponse } from "./api/listings/[postID]/route"
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5"

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
  const [selectedPostID, setSelectedPostID] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: listingsData, isLoading } = useSWR<TListingResponse>(
    "/api/listings",
    fetcher
  )

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
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      listing.properties.title?.toLowerCase().includes(query) ||
      listing.properties.company?.toLowerCase().includes(query) ||
      listing.properties.skills?.some((skill) =>
        skill.toLowerCase().includes(query)
      ) ||
      listing.properties.location?.toLowerCase().includes(query)
    )
  })

  return (
    <>
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">UpTop Jobs</h1>
            <div className="flex-1 max-w-md relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 text-lg" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/5 border border-black/10 rounded-lg focus:outline-none focus:border-black/30 focus:bg-white transition-colors text-sm"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-black/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings?.map((listing) => (
              <button
                key={listing.id}
                onClick={() => openDrawer(listing)}
                className="w-full text-left p-4 bg-white border border-black/10 rounded-xl hover:border-black/30 hover:shadow-sm transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-black">
                      {listing.properties.title}
                    </h3>
                    {listing.properties.status && (
                      <span className="px-2 py-1 text-xs bg-black/5 rounded-md whitespace-nowrap">
                        {listing.properties.status}
                      </span>
                    )}
                  </div>

                  {listing.properties.company && (
                    <p className="text-sm text-black/60">
                      {listing.properties.company}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-black/50">
                    {listing.properties.location && (
                      <span className="px-2 py-1 bg-black/5 rounded">
                        {listing.properties.location}
                      </span>
                    )}
                    {listing.properties.remotePolicy && (
                      <span className="px-2 py-1 bg-black/5 rounded">
                        {listing.properties.remotePolicy}
                      </span>
                    )}
                    {listing.properties.salaryRange &&
                      listing.properties.salaryRange.length > 0 && (
                        <span className="px-2 py-1 bg-black/5 rounded font-medium">
                          {listing.properties.salaryRange.join(", ")}
                        </span>
                      )}
                  </div>

                  {listing.properties.skills &&
                    listing.properties.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {listing.properties.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-black/10 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && filteredListings?.length === 0 && (
          <div className="text-center py-16 text-black/40">
            No jobs found matching your search.
          </div>
        )}
      </main>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-x-0 bottom-0 top-16 sm:top-20 z-50 overflow-hidden">
            <div className="h-full max-w-2xl mx-auto px-4 sm:px-6">
              <div className="h-full bg-white rounded-t-2xl shadow-2xl border border-black/10 flex flex-col">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-black/10 shrink-0">
                  <h2 className="text-lg font-semibold">Job Details</h2>
                  <button
                    onClick={closeDrawer}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <IoCloseOutline className="text-2xl" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {isLoadingDetails ? (
                    <div className="space-y-4">
                      <div className="h-8 bg-black/5 rounded animate-pulse" />
                      <div className="h-4 bg-black/5 rounded animate-pulse" />
                      <div className="h-32 bg-black/5 rounded animate-pulse" />
                    </div>
                  ) : detailsData?.success ? (
                    <div className="space-y-6">
                      {detailsData.post.datePosted && (
                        <div className="text-sm text-black/50">
                          Posted:{" "}
                          {new Date(
                            detailsData.post.datePosted
                          ).toLocaleDateString()}
                        </div>
                      )}

                      {detailsData.post.description ? (
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-black/80 leading-relaxed">
                            {detailsData.post.description}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-black/40 italic">
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
                          className="block w-full py-3 px-4 bg-black text-white text-center rounded-lg hover:bg-black/90 transition-colors font-medium"
                        >
                          Apply Now
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-black/40">
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
