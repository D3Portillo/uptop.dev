"use client"

import { Fragment } from "react"

import { IoCloseOutline } from "react-icons/io5"
import { useRouter } from "next/navigation"
import { useFastApply } from "@/lib/autoapply"
import { useAuth } from "@clerk/nextjs"

import { cn } from "@/lib/utils"
import { tryTriggerSignIn } from "./Auth"

export default function ModalFastApply() {
  const router = useRouter()

  const { isSignedIn } = useAuth()
  const { modal, isEnabled, enable, disable, canEnableFastApply } =
    useFastApply()

  function handleEnable() {
    if (!isSignedIn) return tryTriggerSignIn()
    if (canEnableFastApply) {
      return isEnabled ? disable() : enable()
    }

    router.push("/profile")
    modal.close()
  }

  if (!modal.isOpen) return null
  return (
    <Fragment>
      <style>{`body,html{overflow:hidden}`}</style>

      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={modal.close}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
        <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 max-w-md w-full p-8 relative pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={modal.close}
            className="absolute top-5 right-5 p-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <IoCloseOutline className="text-2xl" />
          </button>

          {/* Content */}
          <div className="text-center space-y-10 pt-2">
            <div className="space-y-1">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Apply on Autopilot
              </h2>

              <p className="text-black/60 dark:text-white/60 max-w-xs mx-auto leading-relaxed mt-2">
                {canEnableFastApply
                  ? isEnabled
                    ? "You're all set. Now you can one-click apply to any matching job."
                    : "Enable fast-apply to automatically submit applications to matching jobs."
                  : "Complete your profile (email, LinkedIn, and resume) to unlock fast-apply."}
              </p>
            </div>

            <button
              onClick={handleEnable}
              className={cn(
                "w-full border-2 border-transparent py-4 rounded-xl font-bold shadow-lg transition-colors shadow-ut-purple/20",
                isEnabled
                  ? "bg-ut-purple text-white"
                  : "bg-ut-purple/80 dark:bg-ut-purple/70 text-white",
              )}
            >
              {isSignedIn
                ? canEnableFastApply
                  ? isEnabled
                    ? "Disable Fast Apply"
                    : "Enable Fast Apply"
                  : "Complete Profile"
                : "Connect Account"}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
