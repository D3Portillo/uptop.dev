"use client"

import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { useProfileData } from "@/lib/profile"
import { isRequiredFieldsPresent } from "./utils"

const atomIsModalOpen = atom(false)
const atomIsAutoApplyEnabled = atomWithStorage("ut.autoApplyEnabled", false)

// A helper hook to manage auto-apply state and modal visibility
export const useAutoApply = () => {
  const [isEnabled, setIsEnabled] = useAtom(atomIsAutoApplyEnabled)
  const [isModalOpen, setIsModalOpen] = useAtom(atomIsModalOpen)
  const { profile, userId } = useProfileData()

  const canEnableAutoApply = userId
    ? isRequiredFieldsPresent({
        ...profile,
        jobId: "DEFAULT", // This will be overriden, we care only for profile-data
      })
    : false

  return {
    isEnabled,
    canEnableAutoApply,
    enable: () => {
      if (canEnableAutoApply) return setIsEnabled(true)
      // TODO: Add an action to help fill user data
    },
    disable: () => setIsEnabled(false),
    modal: {
      isOpen: isModalOpen,
      open: () => setIsModalOpen(true),
      close: () => setIsModalOpen(false),
    },
  }
}
