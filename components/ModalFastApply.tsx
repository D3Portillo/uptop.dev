"use client"

import { Fragment } from "react"

import { IoCloseOutline } from "react-icons/io5"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

import { useFastApply } from "@/lib/autoapply"
import { tryTriggerSignIn } from "./Auth"

export default function ModalFastApply() {
  const router = useRouter()

  const { isSignedIn } = useAuth()
  const { modal, isEnabled, enable, canEnableFastApply } = useFastApply()

  function handleEnable() {
    modal.close()

    if (!isSignedIn) return tryTriggerSignIn()
    if (canEnableFastApply) return enable()

    // Complete profile flow
    router.push("/profile")
  }

  if (!modal.isOpen) return null
  return (
    <Fragment>
      <style>{`body,html{overflow:hidden}`}</style>

      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 animate-in fade-in duration-200"
        onClick={modal.close}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 max-w-md w-full p-8 relative pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={modal.close}
            className="absolute top-5 right-5 p-2 text-black/50 hover:text-black transition-colors rounded-full hover:bg-black/5"
          >
            <IoCloseOutline className="text-2xl" />
          </button>

          {/* Content */}
          <div className="text-center space-y-10 pt-2">
            <div className="space-y-1">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold text-black">
                Apply on Autopilot
              </h2>

              <p className="text-black/60 max-w-xs mx-auto leading-relaxed mt-2">
                {canEnableFastApply
                  ? isEnabled
                    ? "You're all set. Now you can one-click apply to any matching job."
                    : "Enable fast-apply to automatically send applications with your profile."
                  : "Complete your profile (email, LinkedIn, and resume) to unlock fast-apply."}
              </p>
            </div>

            <button
              onClick={handleEnable}
              className="w-full bg-ut-purple text-white border-2 border-transparent py-4 rounded-xl font-bold shadow-lg transition-colors shadow-ut-purple/20"
            >
              {isSignedIn
                ? canEnableFastApply
                  ? isEnabled
                    ? "Continue Exploring"
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
