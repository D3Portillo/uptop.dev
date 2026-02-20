"use client"

import type { JobsList } from "@/lib/jobs"

import { Fragment } from "react/jsx-runtime"
import { useAtom } from "jotai"
import { differenceInDays } from "date-fns"
import { atomWithStorage } from "jotai/utils"

import { useRouter } from "next/navigation"
import { useOpenJobID, useAppliedJobs } from "./ModalJob"

import { IoLocationOutline } from "react-icons/io5"
import { cn, normalizeLocation } from "@/lib/utils"

import { CRYPTO_JOB_LOCATIONS } from "@/lib/constants/countries"
import Image from "next/image"

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

  const COVER_IMAGE = getImageForCategory(properties?.category || "")

  return (
    <button
      key={`list-${id}`}
      onClick={openDrawer}
      className={cn(
        "text-black dark:text-white",
        "border-black/10 dark:border-white/5 hover:border-black/15 dark:hover:border-white/10",
        "w-full text-left rounded-2xl p-5 border shadow-black/5 hover:shadow transition-all",
        isPriority
          ? "bg-linear-to-bl border-black/7 dark:border-white/7 from-ut-purple/10 dark:from-ut-purple/15 to-black/3 dark:to-white/3"
          : "bg-white/30 backdrop-blur dark:bg-white/5",
      )}
    >
      <div className="flex min-h-20 gap-6">
        {/* Company Image */}
        <div className="size-16 p-1 bg-[#2b108e] overflow-hidden bg-cover sm:size-20 border-2 border-black dark:border-white/10 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
          <Image
            width={300}
            height={300}
            loading="lazy"
            className="size-full"
            src={COVER_IMAGE}
            alt=""
          />
        </div>

        {/* Job Info */}
        <div className="flex-1 dark:text-white/80">
          <div className="flex items-start gap-3 mb-4 sm:mb-3">
            <h3 className="text-lg uppercase opacity-90 text-black dark:text-white w-2/3 sm:w-auto font-semibold">
              {properties.title}
            </h3>

            <div className="grow flex flex-wrap justify-end items-center gap-2">
              {isPriority && (
                <span className="px-3 py-1 border border-black text-xs font-bold bg-ut-purple text-white rounded-full uppercase">
                  PRIORITY
                </span>
              )}

              {isLatest && (
                <span className="px-3 py-1 border border-black text-xs font-bold bg-ut-green text-black rounded-full uppercase">
                  NEW
                </span>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="flex *:min-h-10 max-w-xl flex-wrap items-center gap-3 text-sm">
            {properties.formattedJobPolicy && (
              <div className="flex rounded-lg px-3 py-2 bg-black/5 dark:bg-white/5 items-center">
                <span>
                  {properties.formattedJobPolicy.emoji}{" "}
                  {properties.formattedJobPolicy.label}
                </span>
              </div>
            )}

            {properties.location && (
              <div className="flex rounded-lg pl-2 py-2 gap-2 pr-4 bg-black/5 dark:bg-white/5 items-center">
                <IoLocationOutline className="text-base shrink-0 hidden sm:block" />
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2",
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
                className="flex rounded-lg pl-3 py-2 gap-2 pr-4 bg-black/5 dark:bg-white/5 items-center"
              >
                <span>💰</span>
                <span className="font-medium">{range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav className="flex mt-10 sm:mt-0 text-sm opacity-50 items-center gap-2 justify-end">
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

const getImageForCategory = (category = "") => {
  const categoryMap: Record<string, string> = {
    "BIZ DEV": "/icons/bizdev.svg",
    ENGINEERING: "/icons/development.svg",
    MARKETING: "/icons/marketing.svg",
    PRODUCT: "/icons/product.svg",
    DESIGN: "/icons/product.svg",
    FINANCE: "/icons/trading.svg",
    OPERATIONS: "/icons/operations.svg",
  }

  return categoryMap[category.toUpperCase().trim()] || "/icons/default.svg"
}
