"use client"

import { cn } from "@/lib/utils"

const Spinner = ({
  themeSize = "size-7",
}: {
  themeSize?: "size-7" | "size-5"
}) => {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent",
        themeSize === "size-5" ? "border-3" : "border-4 ",
        themeSize,
      )}
    />
  )
}

export default Spinner
