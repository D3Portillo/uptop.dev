import useSWR from "swr"
import type { TListingResponse } from "@/app/api/listings/route"
import type { TListingDetailsResponse } from "@/app/api/listings/[postID]/route"
import { jsonify } from "@/lib/utils"

export const useJobsList = () => {
  return useSWR(
    "/api/listings",
    async (url: string) => {
      return await jsonify<TListingResponse>(fetch(url))
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  )
}

export const useJobDetails = (postID: string | null) => {
  return useSWR(
    postID ? `/api/listings/${postID}` : null,
    async (url: string) => {
      if (!postID) return null
      return await jsonify<TListingDetailsResponse>(fetch(url))
    }
  )
}
