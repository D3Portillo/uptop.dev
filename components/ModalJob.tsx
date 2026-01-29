"use client"

import { Fragment, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Drawer } from "vaul"

import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useJobsList, useJobDetails } from "@/lib/jobs"
import { formatID } from "@/lib/id"
import { cn } from "@/lib/utils"

import { IoCloseOutline } from "react-icons/io5"
import { MdArrowOutward } from "react-icons/md"

import Markdown from "@/components/Markdown"
import { GEOGRAPHIC_REGIONS } from "@/lib/constants/countries"

const atomAppliedJobs = atomWithStorage("ut.jobs.appliedJobs", [] as string[])
const atomJobUpdated = atom({} as Record<string, boolean>)
const atomOpenJobID = atom("")

export const useOpenJobID = () => useAtom(atomOpenJobID)
export const useAppliedJobs = () => useAtom(atomAppliedJobs)

function ModalJob() {
  const [updatedJobs, setUpdatedJobs] = useAtom(atomJobUpdated)
  const [openJobID, setOpenJobID] = useOpenJobID()
  const [appliedJobs, setAppliedJobs] = useAppliedJobs()

  const searchParams = useSearchParams()
  const queryJobID = searchParams.get("job")

  const isUpdated = updatedJobs[openJobID] === true
  const isApplied = appliedJobs.includes(openJobID)

  const router = useRouter()
  const { jobs } = useJobsList()
  const {
    description,
    datePosted,
    isLoading: isLoadingDetails,
  } = useJobDetails(openJobID)

  const isOpen = Boolean(openJobID)

  const closeModal = () => {
    setOpenJobID("")
    router.push("/", {
      scroll: false,
    })
  }

  useEffect(() => {
    if (openJobID && !isUpdated && isOpen) {
      // NOTE: This is simple logic to randomly update job details in the background
      // to try and keep data fresh without overwhelming the backend with requests :p

      const shouldSendUpdate = Math.random() < 0.33 // 33% chance
      if (shouldSendUpdate) {
        // Notify backend to try update cache for this job
        fetch(`/api/listings/${openJobID}`, { method: "POST" })
      }

      // Mark as updated to avoid redundant calls
      setUpdatedJobs((prev) => ({ ...prev, [openJobID]: true }))
    }
  }, [openJobID, isUpdated, isOpen])

  useEffect(() => {
    setOpenJobID(queryJobID || "")
  }, [queryJobID])

  const job = jobs.find(({ id }) => id === openJobID)
  const title = job?.properties.title
  const applyLink = job?.applyLink

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 top-14 sm:top-20 z-50 max-w-2xl mx-auto px-2 sm:px-6 flex outline-none">
          <div className="h-full bg-white text-black rounded-t-2xl shadow-2xl border border-black/10 flex flex-col w-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 pr-3 border-b border-black/10 shrink-0">
              <h2 className="text-lg uppercase font-semibold text-black">
                <button
                  className="text-black/50 hover:text-black/70"
                  onClick={closeModal}
                >
                  <span>JOBS /</span>
                </button>{" "}
                {title || "Full Job Details"}
              </h2>

              <button
                onClick={closeModal}
                className="p-2 text-black/70 hover:text-black"
              >
                <IoCloseOutline className="text-2xl" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="grow overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="space-y-4">
                  <div className="h-12 bg-black/5 rounded-md animate-pulse" />
                  <div className="h-12 bg-black/5 delay-150 rounded-md animate-pulse" />
                  <div className="h-40 bg-black/5 delay-300 rounded-md animate-pulse" />
                </div>
              ) : description ? (
                <div className="space-y-6">
                  <nav className="flex gap-3">
                    {datePosted && (
                      <div className="rounded-full border text-sm border-black/10 bg-black/5 font-semibold px-3 py-1 text-black/70">
                        {new Date(datePosted).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                    {job?.properties.formattedJobPolicy && (
                      <div
                        role="button"
                        tabIndex={-1}
                        className="rounded-full cursor-pointer whitespace-nowrap flex gap-2 items-center group border text-sm border-black/10 bg-black/5 font-semibold px-3 py-1 text-black/70"
                      >
                        <span className="pointer-events-none">
                          {job.properties.formattedJobPolicy.emoji}
                        </span>
                        <span
                          className={cn(
                            // Hide-show label based on datePosted presence
                            datePosted &&
                              "hidden group-hover:block group-focus-within:block",
                          )}
                        >
                          {job.properties.formattedJobPolicy.label}
                        </span>
                      </div>
                    )}
                  </nav>

                  {description ? (
                    <Fragment>
                      <Markdown>{formatDescription(description)}</Markdown>
                      <div
                        className={cn(
                          "flex flex-wrap [&_section]:sm:px-5 [&_section]:sm:py-2 px-6 sm:px-2 pb-6 sm:pb-5 pt-5 mb-12 bg-black/3 rounded-2xl gap-4",
                          [
                            job?.properties?.location,
                            job?.properties.company,
                            job?.properties?.salaryRange?.length,
                            job?.properties?.skills.length,
                          ].every((v) => !v) && "hidden", // Hide if no data
                        )}
                      >
                        {job?.properties.location ? (
                          <section className="px-2 py-3">
                            <h2 className="text-sm mb-4 text-black/60">
                              Location
                            </h2>

                            <nav className="flex">
                              <div className="rounded-full whitespace-nowrap capitalize h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                                📍{" "}
                                {job.properties.location
                                  .split(",")
                                  .map((location) => {
                                    return GEOGRAPHIC_REGIONS.some(
                                      (r) => r.name === location,
                                    )
                                      ? // Keep geo regions capitalized
                                        location
                                      : location.toLowerCase()
                                  })
                                  .join(" • ")}
                              </div>
                            </nav>
                          </section>
                        ) : null}

                        {job?.properties.skills.length ? (
                          <section className="px-2 py-3">
                            <h2 className="text-sm mb-4 text-black/60">
                              Skills
                            </h2>

                            <nav className="flex flex-wrap gap-3">
                              {job.properties.skills.map((skill) => (
                                <div
                                  className={cn(
                                    skill.length > 3
                                      ? "capitalize"
                                      : "uppercase",
                                    "rounded-full whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70",
                                  )}
                                >
                                  {skill.toLowerCase()}
                                </div>
                              ))}
                            </nav>
                          </section>
                        ) : null}

                        {job?.properties.company ? (
                          <section className="px-2 py-3">
                            <h2 className="text-sm mb-4 text-black/60">
                              Company
                            </h2>

                            <nav className="flex">
                              <div className="rounded-full capitalize whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                                {job.properties.company.toLowerCase()}
                              </div>
                            </nav>
                          </section>
                        ) : null}

                        {job?.properties.salaryRange?.length ? (
                          <section className="px-2 py-3">
                            <h2 className="text-sm mb-4 text-black/60">
                              Salary
                            </h2>

                            <nav className="flex flex-wrap gap-3">
                              {job.properties.salaryRange.map((range) => (
                                <div className="rounded-full whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                                  💰 {range}
                                </div>
                              ))}
                            </nav>
                          </section>
                        ) : null}
                      </div>
                    </Fragment>
                  ) : (
                    <DefaultEmptyState formattedID={formatID(openJobID)} />
                  )}
                </div>
              ) : (
                <DefaultEmptyState formattedID={formatID(openJobID)} />
              )}
            </div>

            {applyLink && (
              <nav className="flex relative shrink-0 w-full pb-4 pt-2 px-6">
                <div className="absolute bottom-full left-0 right-0 h-12 pointer-events-none bg-linear-to-b from-white/0 to-white" />

                <a
                  href={applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (isApplied) return
                    setAppliedJobs((current) => [...current, openJobID])
                  }}
                  className="flex w-full items-center justify-center gap-4 p-4 bg-ut-purple text-white text-center rounded-lg hover:bg-ut-purple/90 transition-colors font-black"
                >
                  <span>{isApplied ? "Applied" : "Apply Now"}</span>
                  <MdArrowOutward className="text-xl" />
                </a>
              </nav>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function DefaultEmptyState({ formattedID }: { formattedID?: string }) {
  return (
    <section>
      <p
        className={cn(
          "text-black/50 pt-20 text-center mx-auto",
          formattedID ? "max-w-md" : "max-w-xs",
        )}
      >
        No AI-summary created for this job yet. Please check back later.{" "}
        {formattedID ? (
          <>
            Or view the{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
              href={`https://uptop.notion.site/${formattedID}`}
            >
              original job posting
            </a>{" "}
            for more details.
          </>
        ) : null}
      </p>
    </section>
  )
}

function formatDescription(description: string) {
  // Sometimes clients use "CONFIDENTIAL CLIENT" in place of company name
  return description.replaceAll(/CONFIDENTIAL CLIENT/gi, "\n")
}

export default function ModalJobWithSuspense() {
  // NextJS shi for query params in client components
  return (
    <Suspense fallback={null}>
      <ModalJob />
    </Suspense>
  )
}
