"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { atom, useAtom } from "jotai"

import { IoCloseOutline } from "react-icons/io5"
import { useJobsList, useJobDetails } from "@/lib/jobs"

import { MdArrowOutward } from "react-icons/md"
import Markdown from "@/components/Markdown"

const atomJobUpdated = atom({} as Record<string, boolean>)
function ModalJob() {
  const [updatedJobs, setUpdatedJobs] = useAtom(atomJobUpdated)

  const searchParams = useSearchParams()
  const JOB_ID = searchParams.get("job") || ""

  const isUpdated = updatedJobs[JOB_ID] || false

  const router = useRouter()
  const { data: listingsData } = useJobsList()
  const { data: detailsData, isLoading: isLoadingDetails } =
    useJobDetails(JOB_ID)

  const isOpen = Boolean(JOB_ID)

  const closeModal = () =>
    router.push("/", {
      scroll: false,
    })

  useEffect(() => {
    if (isOpen && JOB_ID && !isUpdated) {
      fetch(`/api/listings/${JOB_ID}`, { method: "POST" })
        .then(console.debug)
        .catch((error) => console.error({ error }))
        .finally(() => {
          // Mark as updated (ignore if error)
          setUpdatedJobs((prev) => ({ ...prev, [JOB_ID]: true }))
        })
    }
  }, [isOpen, JOB_ID, isUpdated])

  const job = listingsData?.data?.find((l) => l.id === JOB_ID)
  const title = job?.properties.title
  const applyLink = job?.applyLink

  if (!isOpen) return null

  return (
    <>
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
              {title ? (
                <>
                  <button
                    className="text-black/50 hover:text-black/70"
                    onClick={closeModal}
                  >
                    <span>Jobs /</span>
                  </button>{" "}
                  {title}
                </>
              ) : (
                "Job Details"
              )}
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
                <div className="h-8 bg-black/5 rounded animate-pulse" />
                <div className="h-4 bg-black/5 rounded animate-pulse" />
                <div className="h-32 bg-black/5 rounded animate-pulse" />
              </div>
            ) : detailsData?.post ? (
              <div className="space-y-6">
                {detailsData.post.datePosted && (
                  <nav className="flex">
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
                  </nav>
                )}

                {detailsData.post.description ? (
                  <Markdown>{detailsData.post.description}</Markdown>
                ) : (
                  <p className="text-black/50 italic">
                    No detailed description available.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-black/50">
                No details available yet.
              </div>
            )}
          </div>

          {applyLink && (
            <nav className="flex shrink-0 w-full pb-4 pt-2 px-6">
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

export default function ModalJobWithSuspense() {
  // NextJS shi for query params in client components
  return (
    <Suspense fallback={null}>
      <ModalJob />
    </Suspense>
  )
}
