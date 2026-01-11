"use client"

import { IoCloseOutline } from "react-icons/io5"
import { useJobDetails } from "@/lib/jobs"
import Markdown from "@/components/Markdown"

type ModalJobProps = {
  open: boolean
  title?: string
  onOpenChange: (open: boolean) => void
  postID: string | null
  applyLink?: string
}

export default function ModalJob({
  open,
  onOpenChange,
  title,
  postID,
  applyLink,
}: ModalJobProps) {
  const { data: detailsData, isLoading: isLoadingDetails } =
    useJobDetails(postID)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-x-0 bottom-0 top-14 sm:top-20 z-50 max-w-2xl mx-auto px-2 sm:px-6">
        <div className="h-full bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 pr-3 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {title ? (
                <>
                  <span className="text-black/50">Jobs /</span> {title}
                </>
              ) : (
                "Job Details"
              )}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-black/60 hover:text-black"
            >
              <IoCloseOutline className="text-2xl" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="grow overflow-y-auto p-6">
            {isLoadingDetails ? (
              <div className="space-y-4">
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-32 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : detailsData?.post ? (
              <div className="space-y-6">
                {detailsData.post.datePosted && (
                  <nav className="flex">
                    <div className="rounded-full border text-sm border-black/7 bg-black/5 font-semibold px-3 py-1 text-black/60">
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
                  <p className="text-gray-400 italic">
                    No detailed description available.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
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
                className="block w-full p-4 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors font-black"
              >
                Apply Now
              </a>
            </nav>
          )}
        </div>
      </div>
    </>
  )
}
