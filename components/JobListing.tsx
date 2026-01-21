"use client"

import type { JobsList } from "@/lib/jobs"

import { Fragment } from "react/jsx-runtime"
import { useAtom } from "jotai"
import { differenceInDays } from "date-fns"
import { blo } from "blo"
import { atomWithStorage } from "jotai/utils"
import { keccak256, toHex } from "viem"
import useSWR from "swr"

import { useRouter } from "next/navigation"
import { useOpenJobID, useAppliedJobs } from "./ModalJob"

import { IoLocationOutline } from "react-icons/io5"
import { cn, jsonify, normalizeLocation } from "@/lib/utils"

import { CRYPTO_JOB_LOCATIONS } from "@/lib/constants/countries"

const atomViewededJobs = atomWithStorage("ut.jobs.viewedJobs", [] as string[])
export const useViewededJobs = () => useAtom(atomViewededJobs)
export default function JobListing({
  listing: { id, properties, rowIndex },
}: {
  listing: JobsList[number]
}) {
  const router = useRouter()
  const [, setOpenJobID] = useOpenJobID()

  const [viewededJobs, setViewedJobs] = useViewededJobs()
  const [appliedJobs] = useAppliedJobs()

  // User-specific states
  const isApplied = appliedJobs.includes(id)
  const isViewed = viewededJobs.includes(id)

  const isPriority = properties.status === "PRIORITY"
  const isLastPotedItem = rowIndex === 0
  const daysSincePosted = properties.datePosted
    ? differenceInDays(new Date(), new Date(properties.datePosted))
    : null

  const isLatest =
    isLastPotedItem || (daysSincePosted != null && daysSincePosted <= 5)

  const openDrawer = () => {
    if (!isViewed) setViewedJobs((current) => [...current, id])
    setOpenJobID(id)
    router.push(`?job=${id}`, { scroll: false })
  }

  const { favicon, unsafeFaviconURL, dominantColor } = useDomainFavicon(
    properties.faviconBaseDomain,
  )

  // Fallback to job ID to avoid generics
  const gravatar = blo(keccak256(toHex(properties.company || id)), 16)

  return (
    <button
      key={`list-${id}`}
      onClick={openDrawer}
      className={cn(
        "w-full text-left p-5 border border-black/10 rounded-2xl hover:border-black/15 shadow-black/5 hover:shadow transition-all",
        isPriority
          ? "bg-linear-to-bl border-black/7 from-ut-purple/10 to-black/3"
          : "bg-white",
      )}
    >
      <div className="flex min-h-24 gap-6">
        {/* Company Image */}
        <div
          data-company-image={unsafeFaviconURL || "null"}
          style={{
            backgroundImage: `url(${gravatar})`,
            filter: favicon
              ? undefined
              : "saturate(1.2) brightness(0.7) contrast(1.2)",
          }}
          className="size-16 overflow-hidden bg-cover sm:size-20 bg-white border-2 border-black rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0"
        >
          <div
            style={{
              backgroundColor: dominantColor || "white",
            }}
            className={cn(
              "grid p-1.5 size-full place-items-center",
              favicon ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <figure className="rounded-md overflow-hidden">
              {favicon ? <img src={favicon} alt="" /> : null}
            </figure>
          </div>
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-black">
              {properties.title}
            </h3>

            {isPriority && (
              <span className="px-3 py-1 border border-transparent text-xs font-bold bg-ut-purple text-white rounded-full uppercase">
                PRIORITY
              </span>
            )}

            {isLatest && (
              <span className="px-3 py-1 border border-black text-xs font-bold bg-ut-green text-black rounded-full uppercase">
                NEW
              </span>
            )}
          </div>

          {/* Job Details */}
          <div className="flex *:min-h-10 pb-6 max-w-xl flex-wrap items-center gap-3 text-sm text-black/50">
            {properties.formattedJobPolicy && (
              <div className="flex rounded-lg px-3 py-2 text-black bg-black/5 items-center">
                <span>
                  {properties.formattedJobPolicy.emoji}{" "}
                  {properties.formattedJobPolicy.label}
                </span>
              </div>
            )}

            {properties.location && (
              <div className="flex rounded-lg pl-2 py-2 gap-2 pr-4 bg-black/5 items-center">
                <IoLocationOutline className="text-base shrink-0 hidden sm:block" />
                <div
                  className={cn(
                    "flex flex-wrap text-black items-center gap-2",
                    properties.location.includes(",") && "py-2 sm:py-0",
                  )}
                >
                  {properties.location.split(",").map((location) => {
                    const formatted =
                      CRYPTO_JOB_LOCATIONS[normalizeLocation(location)]

                    return (
                      <span
                        className="whitespace-nowrap px-1.5"
                        key={`location-${formatted.name}`}
                      >
                        {formatted.emoji} {formatted.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Salary Range */}
            {properties.salaryRange?.map((range) => (
              <div
                key={`salary-${range}`}
                className="flex text-black rounded-lg pl-3 py-2 gap-2 pr-4 bg-black/5 items-center"
              >
                <span>💰</span>
                <span className="font-medium">{range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav className="flex mt-2 text-sm sm:mt-0 opacity-50 items-center gap-2 justify-end">
        {isApplied ? (
          <Fragment>
            <p title="You've already applied to this job">applied</p>
            <p>•</p>
          </Fragment>
        ) : isViewed ? (
          <Fragment>
            <p title="You've already viewed this job">viewed</p>
            <p>•</p>
          </Fragment>
        ) : null}

        <p title="Time posted">
          {daysSincePosted != null
            ? daysSincePosted == 0
              ? "now"
              : `${daysSincePosted}d`
            : "days ago"}
        </p>
      </nav>
    </button>
  )
}

export const useDomainFavicon = (domain?: string | null) => {
  const favicon = domain
    ? `https://www.google.com/s2/favicons?domain=${domain.replace(
        "www.",
        "",
      )}&sz=128`
    : null

  const { data = null } = useSWR(favicon, async () => {
    if (!favicon) return null

    const LOCAL_FAVICON_KEY = `ut.jobs.favicon.${domain}`
    const localCache = localStorage.getItem(LOCAL_FAVICON_KEY)
    if (localCache) {
      return JSON.parse(localCache) as {
        isValid: boolean
        dominantColor: string
      }
    }

    const [formattedURL, { hex: dominantColor }] = await Promise.all([
      loadFavicon(favicon),
      jsonify<{ hex: string }>(
        fetch(`/api/images/tools?bg-color=${encodeURIComponent(favicon)}`),
      ),
    ])

    const isValid = Boolean(formattedURL)
    if (isValid && dominantColor) {
      localStorage.setItem(
        LOCAL_FAVICON_KEY,
        JSON.stringify({
          isValid,
          dominantColor,
        }),
      )
    }

    return { isValid, dominantColor }
  })

  return {
    unsafeFaviconURL: favicon,
    favicon: data?.isValid === false ? null : favicon,
    dominantColor: data?.dominantColor || null,
  }
}

function loadFavicon(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = async () => resolve(url)
    img.onerror = () => resolve(null)
    img.src = url
  })
}
