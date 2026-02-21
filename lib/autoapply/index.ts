"use client"

import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { useProfileData } from "@/lib/profile"
import { isRequiredFieldsPresent } from "./utils"

const atomIsModalOpen = atom(false)
const atomIsFastApplyEnabled = atomWithStorage("ut.fastApplyEnabled", false)

// A helper hook to manage fast-apply state and modal visibility
export const useFastApply = () => {
  const [isEnabled, setIsEnabled] = useAtom(atomIsFastApplyEnabled)
  const [isModalOpen, setIsModalOpen] = useAtom(atomIsModalOpen)
  const { profile, userId } = useProfileData()

  const canEnableFastApply = userId
    ? isRequiredFieldsPresent({
        email: profile?.email,
        linkedin: profile?.linkedin,
        isCryptoSavvy: profile?.isCryptoSavvy,
        resumeURL: profile?.cvMetadata?.vercelURL,
        jobId: "DEFAULT", // This will be overriden, we care only for profile-data
      })
    : false

  return {
    isEnabled: userId ? isEnabled : false, // Force disable if not signed in
    canEnableFastApply,
    enable: () => {
      if (canEnableFastApply) return setIsEnabled(true)
      console.error(
        `[useFastApply] Can't enable. Missing required profile fields.`,
      )
    },
    disable: () => setIsEnabled(false),
    modal: {
      isOpen: isModalOpen,
      open: () => setIsModalOpen(true),
      close: () => setIsModalOpen(false),
    },
  }
}
