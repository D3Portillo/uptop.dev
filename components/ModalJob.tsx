"use client"

import { Fragment, Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Drawer } from "vaul"

import { toast } from "sonner"
import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { useJobsList, useJobDetails } from "@/lib/jobs"
import { formatID } from "@/lib/id"
import { cn, isActiveJobListing } from "@/lib/utils"

import { LuBadgeAlert } from "react-icons/lu"
import { IoCloseOutline } from "react-icons/io5"
import { MdArrowOutward, MdBolt, MdCheck } from "react-icons/md"

import Markdown from "@/components/Markdown"
import { GEOGRAPHIC_REGIONS } from "@/lib/constants/countries"
import { useFastApply } from "@/lib/autoapply"
import { useProfileData } from "@/lib/profile"

import Spinner from "./Spinner"
import { AutoApplyPayload } from "@/app/api/auto-apply/route"

const atomAppliedJobs = atomWithStorage("ut.jobs.appliedJobs", [] as string[])
const atomFastAppliedJobs = atomWithStorage(
  "ut.jobs.fastAppliedJobs",
  [] as string[],
)

const atomJobUpdated = atom({} as Record<string, boolean>)
const atomOpenJobID = atom("")

export const useOpenJobID = () => useAtom(atomOpenJobID)
export const useAppliedJobs = () => useAtom(atomAppliedJobs)

function ModalJob() {
  const { profile } = useProfileData()

  const [updatedJobs, setUpdatedJobs] = useAtom(atomJobUpdated)
  const [openJobID, setOpenJobID] = useOpenJobID()

  const [fastAppliedJobs, setFastAppliedJobs] = useAtom(atomFastAppliedJobs)
  const [appliedJobs, setAppliedJobs] = useAppliedJobs()

  const [isFastApplying, setIsFastApplying] = useState(false)
  const { isEnabled, modal: faModal } = useFastApply()

  const searchParams = useSearchParams()
  const queryJobID = searchParams.get("job")

  const isUpdated = updatedJobs[openJobID] === true
  const isApplied = appliedJobs.includes(openJobID)
  const isFastApplied = fastAppliedJobs.includes(openJobID)

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

  const tryMarkAsApplied = ({ isFastApply = false } = {}) => {
    if (!isApplied) {
      setAppliedJobs((current) => [...current, openJobID])
    }

    if (isFastApply) {
      setFastAppliedJobs((current) => {
        if (current.includes(openJobID)) return current
        return [...current, openJobID]
      })
    }
  }

  useEffect(() => {
    if (openJobID && !isUpdated && isOpen) {
      // NOTE: This is simple logic to randomly update job details in the background
      // to try and keep data fresh without overwhelming the backend with requests :p

      const EXECUTE_CHANCE = 0.66 // (1-100)%
      const shouldSendUpdate = Math.random() < EXECUTE_CHANCE
      if (shouldSendUpdate) {
        // Notify backend to try update cache for this job
        fetch(`/api/listings/${openJobID}`, { method: "POST" })
      }

      // Mark as updated to avoid redundant calls (We ok with this raced condition)
      setUpdatedJobs((prev) => ({ ...prev, [openJobID]: true }))
    }
  }, [openJobID, isUpdated, isOpen])

  useEffect(() => {
    setOpenJobID(queryJobID || "")
    setIsFastApplying(false) // Reset fast-apply state when job changes
  }, [queryJobID])

  const job = jobs.find(({ id }) => id === openJobID)
  const title = job?.properties.title

  // Up Top's apply link
  const applyLink = `https://noteforms.com/forms/top-shelf-job-application-cheqot?084f5395-fbce-48de-81e2-ca34d396c6a0%5B%5D=${openJobID}`

  // Determine if the job is still active
  const isInactiveJob =
    job?.properties?.status && !isActiveJobListing(job.properties.status)

  // Handle platform automatic apply logic
  async function handleFastApply() {
    // Edge case: Prevent multiple calls
    if (isFastApplying) return
    if (isFastApplied || isInactiveJob) return closeModal()
    if (!isEnabled) return faModal.open()

    try {
      setIsFastApplying(true)

      const payload = {
        ...(profile || {}),
        jobId: openJobID,
        resumeURL: profile?.cvMetadata?.vercelURL,
      } satisfies AutoApplyPayload

      const res = await fetch("/api/auto-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to apply")

      // Mark as applied for current user
      tryMarkAsApplied({
        isFastApply: true,
      })
    } catch (error) {
      console.error({ error })
      toast.error("Failed to submit. Please try again.")
    } finally {
      setIsFastApplying(false)
    }
  }

  // Open regular notion form link
  function handleApply() {
    tryMarkAsApplied()
    window.open(applyLink, "_blank")
  }

  return (
    <Fragment>
      {isOpen && <style>{`body,html{overflow:hidden}`}</style>}
      <Drawer.Root
        modal={false}
        open={isOpen}
        onOpenChange={(open) => !open && closeModal()}
      >
        <Drawer.Portal>
          <Drawer.Close asChild>
            <div
              role="button"
              tabIndex={-1}
              style={{
                pointerEvents: "auto",
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            />
          </Drawer.Close>

          <Drawer.Content className="fixed inset-x-0 bottom-0 top-14 sm:top-20 z-50 max-w-2xl min-[100rem]:max-w-228 mx-auto sm:px-6 flex outline-none">
            <div className="h-full bg-white text-black rounded-t-3xl shadow-2xl border border-black/10 flex flex-col w-full">
              {/* Drawer Header */}
              <div className="flex gap-1 items-center justify-between p-6 pr-3 border-b border-black/10 shrink-0">
                <h2 className="sm:text-lg whitespace-nowrap overflow-hidden text-ellipsis uppercase font-semibold text-black">
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
                  className="px-2.5 py-1.5 text-black/70 hover:text-black"
                >
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="grow overflow-y-auto p-6">
                {isInactiveJob ? (
                  <section className="pt-20 grid gap-6 place-items-center">
                    <LuBadgeAlert className="text-5xl scale-105 opacity-70" />
                    <p className="text-black/50 max-w-[18rem] text-center mx-auto">
                      Sorry, this role is no longer active. Check out other
                      opportunities on the platform.
                    </p>
                  </section>
                ) : isLoadingDetails ? (
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
                        <Markdown>{description}</Markdown>
                        <section className="relative bg-ut-ink rounded-2xl overflow-hidden sm:mt-8 mb-12">
                          <div className="bg-linear-to-r pointer-events-none from-ut-ink/0 to-ut-ink z-1 w-4 sm:w-2 absolute top-0 bottom-0 right-0" />
                          <div
                            className={cn(
                              "flex overflow-x-auto flex-wrap [&_section]:sm:px-5 [&_section]:sm:py-2 px-6 sm:px-2 pb-6 sm:pb-5 pt-5 gap-4",
                              [
                                job?.properties?.location,
                                // job?.properties.company,
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

                            {
                              // *NOTE: Company name is not used for now
                              false ? (
                                // job?.properties.company
                                <section className="px-2 py-3">
                                  <h2 className="text-sm mb-4 text-black/60">
                                    Company
                                  </h2>

                                  <nav className="flex">
                                    <div className="rounded-full capitalize whitespace-nowrap h-8 border text-sm border-black/10 font-semibold px-3 py-1 text-black/70">
                                      {job?.properties?.company?.toLowerCase()}
                                    </div>
                                  </nav>
                                </section>
                              ) : null
                            }

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
                        </section>
                      </Fragment>
                    ) : (
                      <DefaultEmptyState formattedID={formatID(openJobID)} />
                    )}
                  </div>
                ) : (
                  <DefaultEmptyState formattedID={formatID(openJobID)} />
                )}
              </div>

              <nav className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative shrink-0 w-full pb-6 sm:pb-4 pt-2 px-6">
                <div className="absolute bottom-full left-0 right-0 h-12 pointer-events-none bg-linear-to-b from-white/0 to-white" />

                {isInactiveJob || isFastApplied ? null : (
                  <button
                    onClick={handleApply}
                    className="flex active:scale-98 h-14 w-full items-center justify-center gap-2 px-4 border border-black/15 text-black/80 text-center rounded-lg font-black"
                  >
                    <span>Apply</span>
                    <MdArrowOutward className="text-xl scale-105" />
                  </button>
                )}

                <button
                  onClick={handleFastApply}
                  disabled={isFastApplying}
                  className="flex active:scale-98 h-14 w-full items-center justify-center gap-1 px-4 bg-linear-to-br from-ut-blue-dark to-ut-purple text-white text-center rounded-lg font-black"
                >
                  {isFastApplied ? null : isFastApplying ? (
                    <Spinner themeSize="size-5" />
                  ) : isInactiveJob ? null : (
                    <MdBolt className="text-2xl scale-110" />
                  )}

                  <div className={cn(isFastApplying && "ml-1")}>
                    {isFastApplied
                      ? "Submitted"
                      : isFastApplying
                        ? "Applying"
                        : isInactiveJob
                          ? "Continue Exploring"
                          : "Fast Apply"}
                  </div>

                  {isFastApplied && <MdCheck className="text-2xl ml-1" />}
                </button>
              </nav>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </Fragment>
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

export default function ModalJobWithSuspense() {
  // NextJS shi for query params in client components
  return (
    <Suspense fallback={null}>
      <ModalJob />
    </Suspense>
  )
}
