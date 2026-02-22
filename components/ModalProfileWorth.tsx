"use client"

import { Fragment } from "react"
import { IoCloseOutline } from "react-icons/io5"

interface ProfileWorthData {
  explanation: string
  estimatedSalaryRangeInUSD: string
}

interface ModalProfileWorthProps {
  isOpen: boolean
  onClose: () => void
  profileWorth: ProfileWorthData | null
}

export function ModalProfileWorth({
  isOpen,
  onClose,
  profileWorth,
}: ModalProfileWorthProps) {
  if (!isOpen || !profileWorth) return null

  return (
    <Fragment>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <style>{`body, html { overflow: hidden }`}</style>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="bg-linear-to-b overflow-y-auto max-h-[calc(100dvh-2rem)] backdrop-blur from-[#11082e] to-black border shadow-2xl shadow-ut-blue-dark/10 border-white/10 rounded-2xl p-6">
            {/* Header */}
            <div className="flex sticky top-0 z-1 items-center justify-end mb-4">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <IoCloseOutline className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Salary Display */}
              <div className="space-y-2 text-center">
                <p className="text-xs text-white/70 uppercase tracking-wider">
                  YOUR PROFILE MARKET VALUE
                </p>
                <p className="text-4xl whitespace-nowrap sm:text-5xl font-black text-ut-green tabular-nums">
                  {profileWorth.estimatedSalaryRangeInUSD}
                </p>
              </div>

              {/* CV-style Summary Cards */}
              <div className="flex flex-wrap justify-center gap-3 py-4">
                {getSummaryCards(profileWorth.estimatedSalaryRangeInUSD).map(
                  (card, i) => (
                    <div
                      key={i}
                      className="relative group"
                      style={{
                        rotate: `${card.rotation}deg`,
                      }}
                    >
                      <div className="w-32 cursor-pointer h-40 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between p-3 transition-all group-hover:border-white/15 active:scale-100 select-none group-hover:scale-105">
                        <div className="space-y-1.5">
                          <div className="h-1 rounded-full bg-ut-green/30 w-full" />
                          <div className="h-1 rounded-full bg-white/15 w-4/5" />
                          <div className="h-1 rounded-full bg-white/10 w-3/5" />
                          <div className="h-1 rounded-full bg-white/10 w-2/5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white leading-tight">
                            {card.position}
                          </span>
                          <span className="text-xs text-ut-green/80 tabular-nums shrink-0">
                            {card.salary}
                          </span>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Explanation */}
              <div className="bg-white/5 mt-2 sm:m-2 rounded-2xl p-6">
                <h2 className="font-bold text-white/80 mb-1">Summary</h2>
                <p className="text-sm text-white/70 leading-relaxed text-left">
                  {profileWorth.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}

// Summary cards in the main content area
const getSummaryCards = (salaryRange: string) => [
  { position: "Resume", salary: salaryRange, rotation: -3 },
  { position: "Skills", salary: "Analyzed", rotation: 4 },
  { position: "Market Value", salary: "Calculated", rotation: -2 },
]
