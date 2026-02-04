import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  CRYPTO_JOB_LOCATIONS,
  LOCATION_KEYS,
  type LocationKey,
} from "./constants/countries"
import { findBestMatch } from "./strings"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const jsonify = <T>(response: Response | Promise<Response>) => {
  return response instanceof Response
    ? (response.json() as Promise<T>)
    : response.then((r) => r.json() as Promise<T>)
}

/**
 * Returns the highest salary number from a salary string
 */
export const getHighestSalaryFromProperty = (salaryStr: string): number => {
  salaryStr = salaryStr.trim()
  if (!salaryStr) return 0

  // Remove $ and k, < less than, handle > sign, +, and spaces
  const formatted = salaryStr.replace(/[$k,><\s+ ]/g, "")
  const possiblyRange = formatted.split("-")

  // If it's a range, take the higher number
  if (possiblyRange.length > 1) {
    const higherPart = possiblyRange[1].trim()
    return Number(higherPart || "0")
  }

  return Number(formatted || "0")
}

export const normalizeLocation = (locationStr: string): LocationKey => {
  const trimmed = locationStr.trim().toUpperCase()

  // Exact match first
  if (trimmed in CRYPTO_JOB_LOCATIONS) return trimmed as LocationKey

  // Try fuzzy matching with Jaro-Winkler
  const bestMatch = findBestMatch(trimmed, LOCATION_KEYS, 0.85)

  // Return best match or fallback to "ANYWHERE"
  return (bestMatch as LocationKey) || "ANYWHERE"
}

export function formatTitleCase(str: string) {
  // Normalize to lowercase first, then use regex to find the start of each word (\b)
  // and replace the matched character with its uppercase version.
  return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())
}

export const isActiveJobListing = (status?: string | null) => {
  return ["OPEN", "COVERED", "PRIORITY", "PASSIVE"].includes(
    status?.toUpperCase() || "",
  )
}
