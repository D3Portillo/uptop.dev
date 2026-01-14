"use client"

import { Fragment, useEffect, useState } from "react"

import { IoSearchOutline, IoChevronDownOutline } from "react-icons/io5"
import { MdCheck, MdOutlineClose } from "react-icons/md"

import {
  cn,
  getHighestSalaryFromProperty,
  normalizeLocation,
} from "@/lib/utils"
import { useJobsList } from "@/lib/jobs"

import {
  CRYPTO_JOB_LOCATIONS,
  LOCATION_ANYWHERE,
  LocationKey,
} from "@/lib/constants/countries"
import JobListing from "@/components/JobListing"
import ModalJob from "@/components/ModalJob"
import SelectSortBy from "@/components/SelectSortBy"

const SORT_BY = {
  MOST_RECENT: "Most Recent",
  BY_SALARY: "Salary (high - low)",
} as const

export default function Home() {
  const SHOW_OR_LESS_SIZE =
    typeof window !== "undefined" && window.innerWidth < 800 ? 5 : 7

  const [policy, setPolicy] = useState<"REMOTE" | "ONSITE">("REMOTE")
  const { jobs, skills } = useJobsList()

  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] =
    useState<LocationKey>(LOCATION_ANYWHERE)

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showAllSkills, setShowAllSkills] = useState(false)

  const [sortBy, setSortBy] = useState<(typeof SORT_BY)[keyof typeof SORT_BY]>(
    SORT_BY.MOST_RECENT
  )

  const isAllSkillsSelected = selectedSkills.length === skills.length
  const displayedSkills = showAllSkills
    ? skills
    : skills.slice(0, SHOW_OR_LESS_SIZE)

  // Extract unique locations from actual job postings
  const availableLocations = new Set<string>()
  availableLocations.add("ANYWHERE") // Always include ANYWHERE

  jobs.forEach((job) => {
    job.properties?.location?.split(",").forEach((location) => {
      availableLocations.add(normalizeLocation(location))
    })
  })

  const locationOptions = Array.from(availableLocations).sort((a, b) =>
    a.localeCompare(b)
  ) as LocationKey[]

  const resetFilters = () => {
    setSortBy(SORT_BY.MOST_RECENT)
    setPolicy("REMOTE")
    setSearchQuery("")
    setSelectedSkills([])
    setLocationQuery(LOCATION_ANYWHERE)
  }

  const remoteJobs = jobs.filter(({ properties }) =>
    ["REMOTE", "HYBRID"].includes(properties.remotePolicy || "")
  )

  const onsiteJobs = jobs.filter(({ properties }) =>
    ["ONSITE", "HYBRID", "IRL"].includes(properties.remotePolicy || "")
  )

  const filteredListings = (
    policy === "REMOTE" ? remoteJobs : onsiteJobs
  ).filter(({ properties }) => {
    // Location filter (ANYWHERE shows all)
    if (locationQuery !== LOCATION_ANYWHERE) {
      const location = properties.location || ""
      const normalizedJobLocations = location.split(",").map(normalizeLocation)

      const isInLocationQuery = normalizedJobLocations.some(
        (loc) => loc === locationQuery
      )
      if (!isInLocationQuery) return false
    }

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const formattedDataString = [
        properties.title,
        properties.company || "",
        properties.location || "",
        properties.skills.join(" "),
      ]
        .join(" ")
        .toLowerCase()

      const isInSearchQuery = formattedDataString.includes(query)
      if (!isInSearchQuery) return false
    }

    // Category filter (multiple selection)
    if (selectedSkills.length > 0 && !isAllSkillsSelected) {
      const isInSkills = selectedSkills.some((skill) =>
        properties.skills?.includes(skill)
      )
      if (!isInSkills) return false
    }

    return true
  })

  // Sort listings based on selected option
  const sortedListings = [...(filteredListings || [])].sort((a, b) => {
    if (sortBy === SORT_BY.BY_SALARY) {
      const aMaxSalary = Math.max(
        ...(a?.properties?.salaryRange || []).map(getHighestSalaryFromProperty)
      )
      const bMaxSalary = Math.max(
        ...(b?.properties?.salaryRange || []).map(getHighestSalaryFromProperty)
      )
      return bMaxSalary - aMaxSalary // Highest first
    }

    // Default: Most Recent (by rowIndex)
    return a.rowIndex - b.rowIndex
  })

  useEffect(() => {
    // Try update listings incrementally as user visits home page
    fetch("/api/listings", {
      method: "POST",
    })
      .then((r) => r.json())
      .then((result) => console.debug({ ISRData: result }))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // If in default filters and no jobs for selected location+policy, switch policy
    if (
      filteredListings.length === 0 &&
      searchQuery.trim().length === 0 &&
      selectedSkills.length === 0
    ) {
      const oppositePolicy = policy === "REMOTE" ? "ONSITE" : "REMOTE"
      setPolicy(oppositePolicy)
    }
  }, [locationQuery])

  const isLoading = jobs.length <= 0
  const isEmpty = !isLoading && sortedListings.length === 0

  return (
    <Fragment>
      {/* Main Container with Light Background */}
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <nav className="flex sm:mt-4 mb-5 sm:mb-7 items-center gap-4">
              <figure className="text-2xl scale-110">🦄</figure>
              <h1 className="font-bold whitespace-nowrap text-lg">
                UpTop Job Board ( Community{" "}
                <span className="hidden sm:inline-block">Edition</span> )
              </h1>
            </nav>

            {/* Search Filters */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 text-xl" />
                <input
                  type="text"
                  placeholder="Filter jobs by title, company or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                />
              </div>
              <div className="w-17 md:w-52 relative">
                {/* Display emoji on mobile */}
                <span className="absolute z-1 left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none md:hidden">
                  {CRYPTO_JOB_LOCATIONS[locationQuery].emoji}
                </span>

                <select
                  value={locationQuery}
                  onChange={(e) =>
                    setLocationQuery(e.target.value as LocationKey)
                  }
                  className="w-full md:pl-4 pl-4 pr-10 py-3.5 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm appearance-none cursor-pointer"
                >
                  {locationOptions.map((locationKey) => {
                    const locationData = CRYPTO_JOB_LOCATIONS[locationKey]
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
              {displayedSkills.map((skill) => (
                <button
                  key={`f-skill-${skill}`}
                  onClick={() => {
                    setSelectedSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((c) => c !== skill)
                        : [...prev, skill]
                    )
                  }}
                  className={cn(
                    "px-3 py-1 h-8 border border-transparent rounded-lg text-sm transition-colors",
                    skill.length > 3 ? "capitalize" : "uppercase",
                    selectedSkills.includes(skill)
                      ? "bg-ut-blue/20 text-black/90 border-black/10"
                      : "bg-black/3 text-black/50 border-black/5 hover:bg-black/5"
                  )}
                >
                  {skill.toLowerCase()}
                </button>
              ))}

              {skills.length <= 0 &&
                Array.from({ length: SHOW_OR_LESS_SIZE }).map((_, i) => (
                  <div
                    key={`mock-skill-${i}`}
                    className="h-8 min-w-16 max-w-28 animate-pulse border border-black/3 bg-black/3 grow rounded-lg"
                  />
                ))}

              <button
                onClick={() => {
                  setSelectedSkills(isAllSkillsSelected ? [] : skills)
                }}
                className={cn(
                  "px-3 py-1 flex items-center gap-2 h-8 border border-transparent rounded-lg text-sm transition-colors",
                  "bg-black/3 text-black/50 border-black/10 hover:bg-black/5"
                )}
              >
                <span>{isAllSkillsSelected ? "Clear" : "Everything"}</span>
                {isAllSkillsSelected ? (
                  <MdOutlineClose className="scale-125" />
                ) : (
                  <MdCheck className="scale-110" />
                )}
              </button>

              {skills.length > SHOW_OR_LESS_SIZE && (
                <button
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  className="border px-3 border-black/10 h-8 rounded-lg text-sm text-black/70 hover:bg-black/5 transition-colors"
                >
                  {showAllSkills
                    ? "Show less"
                    : `Show more (${Math.max(
                        0,
                        skills.length - SHOW_OR_LESS_SIZE
                      )})`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            "max-w-6xl overflow-hidden mx-auto p-6 min-h-screen",
            isEmpty && "border-b mb-8 border-black/10"
          )}
        >
          {/* Results Header */}
          <div className="sm:flex gap-3 items-center mb-5">
            <div className="text-black/70 whitespace-nowrap">
              Showing{" "}
              <span className="font-semibold">
                {
                  // Show empty when ZERO
                  sortedListings.length || ""
                }
              </span>{" "}
              jobs
            </div>

            <div className="grow" />

            <div className="flex mt-4 sm:mt-0 gap-3 items-center">
              <div className="flex whitespace-nowrap h-10 gap-3.5 border border-black/10 rounded-lg bg-white">
                <button
                  onClick={() => setPolicy("ONSITE")}
                  className={cn(
                    "text-sm pl-3",
                    policy === "ONSITE" ? "font-semibold" : "opacity-60"
                  )}
                >
                  📒 On-site
                </button>

                <button
                  onClick={() => setPolicy("REMOTE")}
                  className={cn(
                    "text-sm pr-3",
                    policy === "REMOTE" ? "font-semibold" : "opacity-60"
                  )}
                >
                  <span>💻 Remote</span>
                </button>
              </div>

              <SelectSortBy
                value={sortBy}
                options={Object.values(SORT_BY)}
                onValueChange={setSortBy as any}
              />
            </div>
          </div>

          {/* Job Listings */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={`mock-load-${i}`}
                  className="h-50 sm:h-35 bg-white rounded-xl animate-pulse border border-black/10"
                />
              ))}
            </div>
          ) : isEmpty ? (
            <section className="flex gap-2 py-16 flex-col items-center justify-center">
              <div className="text-black/50">
                Nothing found, try adjusting your search
              </div>

              <button
                onClick={resetFilters}
                className="underline text-black/50"
              >
                Clear filters
              </button>
            </section>
          ) : (
            <div className="space-y-4 mb-24">
              {sortedListings.map((listing) => (
                <JobListing
                  key={`listing-item-${listing.id}`}
                  listing={listing}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="max-w-6xl mx-auto px-6 pt-8 pb-16">
          <p className="text-center max-w-xl mx-auto text-sm text-black/50">
            This is a community project and is not affiliated with UpTop. To
            find the job posts from UpTop, visit{" "}
            <a
              href="https://uptop.notion.site/job-board"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              UpTop's Notion Job Board
            </a>
          </p>
        </footer>
      </div>

      <ModalJob />
    </Fragment>
  )
}
