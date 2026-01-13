"use client"

import { Fragment, useState } from "react"
import { IoChevronDownOutline } from "react-icons/io5"

export default function SelectSortBy({
  value,
  options,
  onValueChange,
}: {
  value: string
  options: string[]
  onValueChange: (newValue: string) => void
}) {
  const [showSortMenu, setShowSortMenu] = useState(false)

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setShowSortMenu(!showSortMenu)}
        className="flex h-10 items-center gap-2 px-3 border border-black/10 rounded-lg bg-white hover:bg-black/5 transition-colors"
      >
        <span className="text-sm whitespace-nowrap text-black/70">{value}</span>
        <IoChevronDownOutline className="text-black/50" />
      </button>
      {showSortMenu && (
        <Fragment>
          <div
            tabIndex={-1}
            role="button"
            onClick={() => setShowSortMenu(false)}
            className="fixed z-5 inset-0"
          />

          <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-lg shadow-lg z-10">
            {options.map((option) => (
              <button
                onClick={() => {
                  onValueChange(option)
                  setShowSortMenu(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-black/5 first:rounded-t-lg ${
                  option === value
                    ? "text-black/80"
                    : "text-black/50 font-medium"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Fragment>
      )}
    </div>
  )
}
