"use client"

import { Fragment, useEffect, useState } from "react"

import {
  IoSearchOutline,
  IoChevronDownOutline,
  IoCloseOutline,
  IoChevronForwardSharp,
} from "react-icons/io5"
import { MdCheck, MdOutlineClose } from "react-icons/md"

import {
  cn,
  getHighestSalaryFromProperty,
  normalizeLocation,
} from "@/lib/utils"
import { extractSkillsFromJobs, useJobsList } from "@/lib/jobs"

import {
  CRYPTO_JOB_LOCATIONS,
  LOCATION_ANYWHERE,
  LocationKey,
} from "@/lib/constants/countries"
import JobListing from "@/components/JobListing"
import SelectSortBy from "@/components/SelectSortBy"

const SORT_BY = {
  MOST_RECENT: "Most Recent",
  BY_SALARY: "Salary (high - low)",
} as const

const MIN_MOBILE_SHOW_SIZE = 5
const MIN_DESKTOP_SHOW_SIZE = 7

export default function Home() {
  const SHOW_OR_LESS_SIZE =
    typeof window !== "undefined" && window.innerWidth < 800
      ? MIN_MOBILE_SHOW_SIZE
      : MIN_DESKTOP_SHOW_SIZE

  const [isGlobalLoading, setIsGlobalLoading] = useState(true)
  const { jobs, isEmpty: isMainJobsListEmpty } = useJobsList()

  useEffect(() => {
    setIsGlobalLoading(isMainJobsListEmpty)
  }, [isMainJobsListEmpty])

  const [locationQuery, setLocationQuery] =
    useState<LocationKey>(LOCATION_ANYWHERE)
  const [policy, setPolicy] = useState<"REMOTE" | "ONSITE" | null>("REMOTE")
  const [sortBy, setSortBy] = useState<(typeof SORT_BY)[keyof typeof SORT_BY]>(
    SORT_BY.MOST_RECENT,
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showAllSkills, setShowAllSkills] = useState(false)

  const isGlobalSearch = searchQuery.trim().length > 0

  // Extract unique locations from actual job postings
  const availableLocations = new Set<string>()
  availableLocations.add("ANYWHERE") // Always include ANYWHERE

  jobs.forEach((job) => {
    job.properties?.location?.split(",").forEach((location) => {
      availableLocations.add(normalizeLocation(location))
    })
  })

  const locationOptions = Array.from(availableLocations).sort((a, b) =>
    a.localeCompare(b),
  ) as LocationKey[]

  const resetSkillSelection = () => {
    setSelectedSkills([])
    setShowAllSkills(false)
  }

  const resetFilters = () => {
    resetSkillSelection()
    setSortBy(SORT_BY.MOST_RECENT)
    setLocationQuery(LOCATION_ANYWHERE)
    setPolicy("REMOTE")
    setSearchQuery("")
  }

  const initialFilteredItems = jobs.filter(({ properties }) => {
    // Location filter (ANYWHERE shows all)
    // Do not filter when in global search mode
    if (locationQuery !== LOCATION_ANYWHERE && !isGlobalSearch) {
      const location = properties.location || ""
      const normalizedJobLocations = location.split(",").map(normalizeLocation)

      const isInLocationQuery = normalizedJobLocations.some(
        (loc) => loc === locationQuery,
      )
      if (!isInLocationQuery) return false
    }

    // Search query filter
    if (isGlobalSearch) {
      const query = searchQuery.toLowerCase()
      const formattedDataString = [
        properties.title,
        properties.company || "",
        properties.location || "",
        properties.remotePolicy || "",
        properties.formattedJobPolicy.label,
        properties.skills.join(" "),
      ]
        .join(" ")
        .toLowerCase()

      const isInSearchQuery = formattedDataString.includes(query)
      if (!isInSearchQuery) return false
    }

    return true
  })

  const skills = extractSkillsFromJobs(initialFilteredItems)
  const isAllSkillsSelected = selectedSkills.length === skills.length
  const displayedSkills = showAllSkills
    ? skills
    : skills.slice(0, SHOW_OR_LESS_SIZE)

  const filteredListings = initialFilteredItems
    // First apply policy and skills filters
    .filter(({ properties }) => {
      if (policy === "REMOTE") {
        const isRemoteJob = ["HYBRID", "REMOTE"].some((policy) =>
          properties.remotePolicy?.includes(policy),
        )
        if (!isRemoteJob) return false
      } else if (policy === "ONSITE") {
        const isOnsiteJob = ["HYBRID", "ONSITE", "IRL"].some((policy) =>
          properties.remotePolicy?.includes(policy),
        )
        if (!isOnsiteJob) return false
      }

      // Category filter (multiple selection)
      if (selectedSkills.length > 0 && !isAllSkillsSelected) {
        const isInSkills = selectedSkills.some((skill) =>
          properties.skills?.includes(skill),
        )
        if (!isInSkills) return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === SORT_BY.BY_SALARY) {
        const aMaxSalary = Math.max(
          ...(a?.properties?.salaryRange || []).map(
            getHighestSalaryFromProperty,
          ),
        )
        const bMaxSalary = Math.max(
          ...(b?.properties?.salaryRange || []).map(
            getHighestSalaryFromProperty,
          ),
        )
        return bMaxSalary - aMaxSalary // Highest first
      }

      // Default: Most Recent (by rowIndex)
      return a.rowIndex - b.rowIndex
    })

  useEffect(() => {
    // Early exit when querying ANYWHERE
    if (locationQuery === LOCATION_ANYWHERE) return

    // If in default filters and no jobs for selected location+policy, switch policy
    if (
      !isGlobalSearch &&
      filteredListings.length === 0 &&
      selectedSkills.length === 0 &&
      policy !== null // Only when a policy is set
    ) {
      const timer = setTimeout(
        () => setPolicy(policy === "REMOTE" ? "ONSITE" : "REMOTE"),
        50,
      )

      return () => clearTimeout(timer)
    }
  }, [locationQuery])

  useEffect(() => {
    // Keep latest "non-null" policy in session storage
    if (policy !== null) sessionStorage.setItem("job_policy_preference", policy)
  }, [policy])

  useEffect(() => {
    const storedPolicy = sessionStorage.getItem("job_policy_preference")

    // Reset filters when doing global search
    if (isGlobalSearch) setPolicy(null)
    else {
      // Restore last known policy from session storage
      setPolicy(
        // Fallback to REMOTE if nothing stored
        (currentValue) => (storedPolicy as any) || currentValue || "REMOTE",
      )
    }

    resetSkillSelection()
  }, [isGlobalSearch])

  const isEmpty = !isGlobalLoading && filteredListings.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <nav className="flex gap-1 text-lg whitespace-nowrap sm:mt-4 mb-5 sm:mb-7 items-center">
            <button
              className="flex items-center gap-3 active:scale-98"
              onClick={() => {
                // Simulate re-load page
                resetFilters()
                setIsGlobalLoading(true)
                setTimeout(() => setIsGlobalLoading(false), 500)
              }}
            >
              <figure className="text-2xl scale-110">🦄</figure>
              <strong>UpTop /</strong>
            </button>
            <h1>JobBoard</h1>

            <div className="grow" />

            <button
              // Simulate "Connect" action
              onClick={() => window.open("/?connect=", "_blank")}
              className="h-9 active:scale-98 outline-2 shadow-lg shadow-pink-600/10 hover:shadow-pink-600/20 outline-pink-600/15 text-sm pr-3 relative pl-4 flex gap-1.5 items-center bg-linear-to-br from-pink-600 to-ut-purple rounded-full text-white font-semibold transition-colors"
            >
              <span>Connect</span>
              <IoChevronForwardSharp className="scale-115" />
            </button>
          </nav>

          {/* Search Filters */}
          <div className="flex gap-3">
            <label
              tabIndex={-1}
              className="flex-1 bg-white border border-black/10 rounded-lg focus-within:border-ut-purple focus-within:ring-2 focus-within:ring-ut-purple/20 transition-all relative"
            >
              {isGlobalSearch ? (
                <div
                  role="button"
                  className="absolute cursor-pointer left-4 py-2 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setSearchQuery("")
                  }}
                >
                  <IoCloseOutline className="text-black/50 text-xl scale-110" />
                </div>
              ) : (
                <IoSearchOutline className="absolute pointer-events-none left-4 top-1/2 -translate-y-1/2 text-black/50 text-xl" />
              )}
              <input
                type="text"
                placeholder="Filter jobs by title, company or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none pl-12 pr-4 py-3.5 bg-transparent text-sm"
              />
            </label>

            <div className="w-17 md:w-52 relative">
              {/* Display emoji on mobile */}
              <span className="absolute z-1 left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none md:hidden">
                {CRYPTO_JOB_LOCATIONS[locationQuery].emoji}
              </span>

              <select
                value={locationQuery}
                onChange={(e) => {
                  resetSkillSelection()
                  setLocationQuery(e.target.value as LocationKey)
                }}
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
          <div
            className={cn(
              "flex transition-all flex-wrap gap-2 items-center",
              isGlobalLoading &&
                "min-h-18 sm:min-h-0 items-start sm:items-center",
              // Hide all section when loaded and few skills to show
              skills.length < 3 && !isGlobalLoading
                ? "opacity-0 h-[0%] max-h-0 mt-2 pointer-events-none"
                : "opacity-100 h-full mt-6",
            )}
          >
            {isGlobalLoading
              ? Array.from({ length: MIN_DESKTOP_SHOW_SIZE }).map((_, i) => (
                  <div
                    key={`mock-skill-${i}`}
                    className="h-8 min-w-16 max-w-28 animate-pulse border border-black/3 bg-black/3 grow rounded-lg"
                  />
                ))
              : displayedSkills.map((skill) => (
                  <button
                    key={`f-skill-${skill}`}
                    onClick={() => {
                      setSelectedSkills((prev) =>
                        prev.includes(skill)
                          ? prev.filter((c) => c !== skill)
                          : [...prev, skill],
                      )
                    }}
                    className={cn(
                      "px-3 py-1 h-8 border border-transparent rounded-lg text-sm transition-colors",
                      skill.length > 3 ? "capitalize" : "uppercase",
                      selectedSkills.includes(skill)
                        ? "bg-ut-blue/20 text-black/90 border-black/10"
                        : "bg-black/3 text-black/50 border-black/5 hover:bg-black/5",
                    )}
                  >
                    {skill.toLowerCase()}
                  </button>
                ))}

            {/* Show "Select All" / "Show More" options only when enough skills */}
            {!isGlobalLoading && skills.length > MIN_MOBILE_SHOW_SIZE ? (
              <Fragment>
                <button
                  onClick={() => {
                    setSelectedSkills(isAllSkillsSelected ? [] : skills)
                  }}
                  className={cn(
                    "px-3 py-1 flex items-center gap-2 h-8 border border-transparent rounded-lg text-sm transition-colors",
                    "bg-black/3 text-black/50 border-black/10 hover:bg-black/5",
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
                          skills.length - SHOW_OR_LESS_SIZE,
                        )})`}
                  </button>
                )}
              </Fragment>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "max-w-6xl overflow-hidden mx-auto p-6 min-h-screen",
          isEmpty && "border-b mb-8 border-black/10",
        )}
      >
        {/* Results Header */}
        <div className="sm:flex gap-3 items-center mb-5">
          <div className="text-black/70 whitespace-nowrap">
            Showing{" "}
            <span className="font-semibold">
              {
                // Show empty when ZERO
                isGlobalLoading || filteredListings.length || ""
              }
            </span>{" "}
            jobs{" "}
            {isGlobalSearch && (
              <span
                title="Search is global"
                className="underline cursor-pointer decoration-black/25 underline-offset-4"
              >
                globally
              </span>
            )}
          </div>

          <div className="grow" />

          <div className="flex mt-4 sm:mt-0 gap-3 items-center">
            <div className="flex whitespace-nowrap h-10 gap-3.5 border border-black/10 rounded-lg bg-white">
              <button
                onClick={() => setPolicy("ONSITE")}
                className={cn(
                  "text-sm pl-3",
                  policy === "ONSITE" ? "font-semibold" : "opacity-60",
                )}
              >
                📒 On-site
              </button>

              <button
                onClick={() => setPolicy("REMOTE")}
                className={cn(
                  "text-sm pr-3",
                  policy === "REMOTE" ? "font-semibold" : "opacity-60",
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
        {isGlobalLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={`mock-load-${i}`}
                className="h-52 sm:h-36 bg-white rounded-xl animate-pulse border border-black/10"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <section className="flex gap-2 py-16 flex-col items-center justify-center">
            <div className="text-black/50">
              Nothing found, try adjusting your search
            </div>

            <button onClick={resetFilters} className="underline text-black/50">
              Clear filters
            </button>
          </section>
        ) : (
          <div className="space-y-4 mb-24">
            {filteredListings.map((listing) => (
              <JobListing
                key={`listing-item-${listing.id}`}
                listing={listing}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        <p className="text-center max-w-lg mx-auto text-sm text-black/50">
          This is a community project and is not affiliated with UpTop. Visit{" "}
          <a
            href="https://uptop.notion.site/job-board"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            UpTop's Notion Page
          </a>{" "}
          for the official listings.
        </p>
      </footer>
    </div>
  )
}
