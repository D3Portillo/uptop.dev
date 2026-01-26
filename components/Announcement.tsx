"use client"

import { Fragment, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

import { IoCloseOutline } from "react-icons/io5"
import { MdOutlineNotificationsActive } from "react-icons/md"

const QRCode = dynamic(() => import("react-qr-code"), {
  ssr: false,
  loading: () => (
    <div className="size-full grid grid-cols-2 gap-4 p-2">
      <div className="size-full rounded-lg bg-black/5 animate-pulse" />
      <div className="size-full delay-100 rounded-lg bg-black/5 animate-pulse" />
      <div className="size-full delay-200 rounded-lg bg-black/5 animate-pulse" />
    </div>
  ),
})

const TELEGRAM_CHANNEL = "https://t.me/+sYrwGzNRWQI5NGIx"

export default function Announcement() {
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const openModal = () => {
    setIsMobile(window.innerWidth < 768)
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  const QR_CODE = (
    <QRCode
      className="size-full object-cover"
      viewBox="0 0 120 120"
      value={TELEGRAM_CHANNEL}
    />
  )

  useEffect(() => {
    // Close modal when URL params change
    if (searchParams.size > 0) closeModal()
  }, [searchParams.size])

  return (
    <Fragment>
      {/* Fixed Bell Button */}
      <button
        onClick={openModal}
        className="fixed animate-in fade-in duration-100 group grid place-items-center bottom-3 sm:bottom-6 right-3 sm:right-8 z-5 size-15 border border-black/10 bg-gray-200/90 backdrop-blur drop-shadow-2xl rounded-2xl"
      >
        <div className="absolute size-2 rounded-full bg-[#2c00ff] top-2 right-2" />
        <MdOutlineNotificationsActive className="text-3xl group-hover:scale-103 opacity-80" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <style>{`
            body,
            html {
              overflow: hidden;
            }

            @keyframes bell-ring {
              0% { transform: rotate(0deg); }
              10% { transform: rotate(15deg); }
              20% { transform: rotate(-15deg); }
              30% { transform: rotate(15deg); }
              40% { transform: rotate(-15deg); }
              50% { transform: rotate(10deg); }
              60% { transform: rotate(-10deg); }
              70% { transform: rotate(5deg); }
              80% { transform: rotate(-5deg); }
              90% { transform: rotate(0deg); }
              100% { transform: rotate(0deg); }
            }
            .bell-animate {
              animation: bell-ring 1s ease-in-out;
              transform-origin: top center;
              display: inline-block;
            }
          `}</style>

          {/* Backdrop */}
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl border border-black/10 max-w-md w-full p-8 relative pointer-events-auto">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 p-2 text-black/50 hover:text-black transition-colors rounded-full hover:bg-black/5"
              >
                <IoCloseOutline className="text-2xl" />
              </button>

              {/* Content */}
              <div className="text-center space-y-6 pt-2">
                <div className="space-y-1">
                  <div className="text-4xl mb-4">
                    <span className="bell-animate">🔔</span>
                  </div>

                  <h2 className="text-2xl font-bold text-black">
                    Follow Up Top on Telegram
                  </h2>

                  <p className="text-black/60 mt-6 sm:mt-0 leading-relaxed">
                    Get job updates and stay connected with the community!
                  </p>
                </div>

                {isMobile ? (
                  /* Mobile: Show button */
                  <a
                    href={TELEGRAM_CHANNEL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 bg-ut-purple text-white text-center rounded-xl font-bold shadow-lg shadow-ut-purple/20"
                  >
                    JOIN NOW
                  </a>
                ) : (
                  /* Desktop: Show QR Code */
                  <div className="flex flex-col items-center gap-4 pt-2 pb-4">
                    <div className="bg-white p-4 rounded-xl border border-black/10 shadow-lg">
                      <figure className="aspect-square size-56">
                        {QR_CODE}
                      </figure>
                    </div>
                    <p className="text-sm text-black/50 font-medium">
                      Scan with your phone, or{" "}
                      <a
                        href={TELEGRAM_CHANNEL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline underline-offset-4"
                      >
                        click here
                      </a>{" "}
                      to join
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Fragment>
  )
}
