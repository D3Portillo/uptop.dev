"use client"

import { Fragment, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { atom, useAtom } from "jotai"

import { IoCloseOutline } from "react-icons/io5"
import { useJobsList, useJobDetails } from "@/lib/jobs"

import { MdArrowOutward } from "react-icons/md"
import Markdown from "@/components/Markdown"
import { cn } from "@/lib/utils"

const atomJobUpdated = atom({} as Record<string, boolean>)
const atomOpenJobID = atom("")

export const useOpenJobID = () => useAtom(atomOpenJobID)

function ModalJob() {
  const [updatedJobs, setUpdatedJobs] = useAtom(atomJobUpdated)
  const [openJobID, setOpenJobID] = useOpenJobID()

  const searchParams = useSearchParams()
  const queryJobID = searchParams.get("job")

  const isUpdated = updatedJobs[openJobID] === true

  const router = useRouter()
  const { data: listingsData } = useJobsList()
  const { data: detailsData, isLoading: isLoadingDetails } =
    useJobDetails(openJobID)

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

  const job = listingsData?.data?.find((l) => l.id === openJobID)
  const title = job?.properties.title
  const applyLink = job?.applyLink

  if (!isOpen) return null

  const workPolicy = (() => {
    const policy = job?.properties?.remotePolicy?.toUpperCase() || ""

    const isHybrid = policy.includes("HYBRID")
    const isRemote = policy.includes("REMOTE")
    if (isHybrid) {
      return {
        emoji: "☕",
        label: "Hybrid",
      }
    }

    if (isRemote) {
      return {
        emoji: "💻",
        label: "Remote",
      }
    }

    return {
      emoji: "🧳",
      label: "On-site",
    }
  })()

  return (
    <>
      <style>{`
        body,
        html {
          overflow: hidden;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={closeModal}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-x-0 bottom-0 top-14 sm:top-20 z-50 max-w-2xl mx-auto px-2 sm:px-6">
        <div className="h-full bg-white rounded-t-2xl shadow-2xl border border-black/10 flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 pr-3 border-b border-black/10 shrink-0">
            <h2 className="text-lg font-semibold text-black">
              <button
                className="text-black/50 hover:text-black/70"
                onClick={closeModal}
              >
                <span>Jobs /</span>
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
            ) : detailsData?.post ? (
              <div className="space-y-6">
                <nav className="flex gap-3">
                  {detailsData.post.datePosted && (
                    <div className="rounded-full border text-sm border-black/10 bg-black/5 font-semibold px-3 py-1 text-black/70">
                      {new Date(detailsData.post.datePosted).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                  )}
                  <div
                    role="button"
                    tabIndex={-1}
                    className="rounded-full cursor-pointer whitespace-nowrap flex gap-2 items-center group border text-sm border-black/10 bg-black/5 font-semibold px-3 py-1 text-black/70"
                  >
                    <span className="pointer-events-none">
                      {workPolicy.emoji}
                    </span>
                    <span
                      className={cn(
                        // Hide-show label based on datePosted presence
                        detailsData.post.datePosted &&
                          "hidden group-hover:block group-focus-within:block"
                      )}
                    >
                      {workPolicy.label}
                    </span>
                  </div>
                </nav>

                {detailsData.post.description ? (
                  <Fragment>
                    <Markdown>{detailsData.post.description}</Markdown>

                    <div
                      className={cn(
                        "flex flex-wrap py-6 px-4 mb-12 bg-black/3 rounded-2xl gap-4",
                        [
                          job?.properties?.location,
                          job?.properties?.salaryRange?.length,
                          job?.properties?.skills.length,
                        ].every((v) => !v) && "hidden" // Hide if no data
                      )}
                    >
                      {job?.properties.location ? (
                        <section className="px-2">
                          <h2 className="text-sm mb-4 text-black/60">
                            Location
                          </h2>

                          <nav className="flex">
                            <div className="rounded-full whitespace-nowrap capitalize h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                              📍{" "}
                              {job.properties.location
                                .split(",")
                                .join(" • ")
                                .toLowerCase()}
                            </div>
                          </nav>
                        </section>
                      ) : null}

                      {job?.properties.salaryRange?.length ? (
                        <section className="px-2">
                          <h2 className="text-sm mb-4 text-black/60">Salary</h2>

                          <nav className="flex flex-wrap gap-3">
                            {job.properties.salaryRange.map((range) => (
                              <div className="rounded-full whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                                💰 {range}
                              </div>
                            ))}
                          </nav>
                        </section>
                      ) : null}

                      {job?.properties.skills.length ? (
                        <section className="px-2">
                          <h2 className="text-sm mb-4 text-black/60">Skills</h2>

                          <nav className="flex flex-wrap gap-3">
                            {job.properties.skills.map((skill) => (
                              <div
                                className={cn(
                                  skill.length > 3 ? "capitalize" : "uppercase",
                                  "rounded-full whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70"
                                )}
                              >
                                {skill.toLowerCase()}
                              </div>
                            ))}
                          </nav>
                        </section>
                      ) : null}
                    </div>
                  </Fragment>
                ) : (
                  <DefaultEmptyState />
                )}
              </div>
            ) : (
              <DefaultEmptyState />
            )}
          </div>

          {applyLink && (
            <nav className="flex relative shrink-0 w-full pb-4 pt-2 px-6">
              <div className="absolute bottom-full left-0 right-0 h-12 pointer-events-none bg-linear-to-b from-white/0 to-white" />

              <a
                href={applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-4 p-4 bg-ut-purple text-white text-center rounded-lg hover:bg-ut-purple/90 transition-colors font-black"
              >
                <span>Apply Now</span>
                <MdArrowOutward className="text-xl" />
              </a>
            </nav>
          )}
        </div>
      </div>
    </>
  )
}

function DefaultEmptyState() {
  return (
    <section>
      <p className="text-black/50 pt-20 text-center max-w-md mx-auto">
        We haven't create an AI summary for this job yet. Please check back
        later. Or click apply anyways.
      </p>
    </section>
  )
}

export default function ModalJobWithSuspense() {
  // NextJS shi for query params in client components
  return (
    <Suspense fallback={null}>
      <ModalJob />
    </Suspense>
  )
}
