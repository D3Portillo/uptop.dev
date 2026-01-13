"use client"

import type { JobsList } from "@/lib/jobs"
import { blo } from "blo"
import { keccak256, toHex } from "viem"

import { useRouter } from "next/navigation"
import { useOpenJobID } from "./ModalJob"

import { IoLocationOutline } from "react-icons/io5"
import { cn, normalizeLocation } from "@/lib/utils"
import { CRYPTO_JOB_LOCATIONS } from "@/lib/constants/countries"

export default function JobListing({
  listing: { id, properties, rowIndex },
}: {
  listing: JobsList[number]
}) {
  const router = useRouter()
  const [, setOpenJobID] = useOpenJobID()

  const isPriority = properties.status === "PRIORITY"
  const isLatest = rowIndex === 0

  const openDrawer = () => {
    setOpenJobID(id)
    router.push(`?job=${id}`, { scroll: false })
  }

  return (
    <button
      key={`list-${id}`}
      onClick={openDrawer}
      className={cn(
        "w-full text-left p-5 border border-black/10 rounded-2xl hover:border-black/15 shadow-black/5 hover:shadow transition-all",
        isPriority
          ? "bg-linear-to-bl border-black/7 from-ut-purple/10 to-black/3"
          : "bg-white"
      )}
    >
      <div className="flex min-h-24 gap-6">
        {/* Company Logo Placeholder */}
        <div
          style={{
            backgroundImage: `url(${blo(
              keccak256(toHex(properties.company || id)),
              16
            )})`,
            filter: "saturate(1.2) brightness(0.7) contrast(1.2)",
          }}
          className="size-16 bg-cover sm:size-20 bg-black border-2 border-black rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0"
        />

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
                    properties.location.includes(",") && "py-2 sm:py-0"
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
    </button>
  )
}
