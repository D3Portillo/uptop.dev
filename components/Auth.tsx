"use client"

import { Fragment, useEffect, useState } from "react"
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useFastApply } from "@/lib/autoapply"

import { toAddres } from "@/lib/profile"
import {
  IoChevronDownOutline,
  IoChevronForwardSharp,
  IoCloseOutline,
} from "react-icons/io5"
import AddressBlock from "./AddressBlock"

export const ID_BUTTON_CONNECT = "button-connect"
export default function Auth() {
  const router = useRouter()
  const { signOut, isSignedIn, userId } = useAuth()
  const { modal: fastApplyModal } = useFastApply()

  const [_isSignInOpen, setIsSignInOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    // Close modal when signed in
    if (isSignedIn) setIsSignInOpen(false)
  }, [isSignedIn])

  // We won't show modal if already signed in
  const isSignInOpen = isSignedIn ? false : _isSignInOpen
  const AUTH_URL = typeof window !== "undefined" ? location.href : undefined

  return (
    <Fragment>
      <div className="h-9" />

      <SignedOut>
        <button
          id={ID_BUTTON_CONNECT}
          onClick={() => setIsSignInOpen(true)}
          className="h-9 group active:scale-98 outline-2 shadow-lg shadow-ut-blue-dark/10 hover:shadow-ut-blue-dark/15 outline-ut-blue-dark/15 text-sm pr-3 relative pl-4 flex gap-1.5 items-center bg-linear-to-br from-ut-blue-dark to-ut-purple rounded-full text-white font-semibold transition-colors"
        >
          <span>Connect</span>
          <IoChevronForwardSharp className="scale-115 group-hover:-translate-x-px" />
        </button>
      </SignedOut>

      <SignedIn>
        <div className="relative">
          <button
            data-user-id={userId || "null"}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-9 rounded-lg pl-1 pr-2 bg-black/3 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
          >
            <AddressBlock
              showAuthImage
              address={toAddres(userId || "")}
              className="size-7 rounded-full border border-black dark:border-stone-700"
            />
            <span className="text-xs ml-1 font-semibold">Profile</span>
            <IoChevronDownOutline />
          </button>

          {showProfileMenu && (
            <Fragment>
              <div
                tabIndex={-1}
                role="button"
                onClick={() => setShowProfileMenu(false)}
                className="fixed z-5 inset-0"
              />

              <div className="absolute right-0 mt-2 w-36 bg-white/80 dark:bg-white/5 backdrop-blur-xl dark:border-white/10 text-black/70 dark:text-white border border-black/10 rounded-lg shadow-lg z-10 flex flex-col">
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    router.push("/profile")
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/7 first:rounded-t-lg font-medium"
                >
                  Manage Profile
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    fastApplyModal.open()
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/7 first:rounded-t-lg font-medium"
                >
                  Fast Apply ⚡
                </button>

                <div className="h-px bg-black/7 dark:bg-white/7 w-full" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    signOut()
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/7 last:rounded-b-lg font-medium"
                >
                  Disconnect
                </button>
              </div>
            </Fragment>
          )}
        </div>
      </SignedIn>

      {/* Sign-In Modal */}
      {isSignInOpen && (
        <Fragment>
          <style>{`body,html{overflow:hidden}`}</style>

          {/* Backdrop */}
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 animate-in fade-in duration-200"
            onClick={() => setIsSignInOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
            <div className="bg-white overflow-hidden rounded-3xl shadow-2xl border border-black/10 max-w-md w-full relative pointer-events-auto">
              {/* Close Button */}
              <button
                onClick={() => setIsSignInOpen(false)}
                className="absolute top-5 right-5 p-2 text-black/50 hover:text-black transition-colors rounded-full hover:bg-black/5"
              >
                <IoCloseOutline className="text-2xl" />
              </button>

              {/* Content */}
              <div className="text-center w-full">
                <h2 className="pt-12 mb-2 text-2xl font-bold text-black">
                  Welcome back
                </h2>

                <div className="flex min-h-48 items-center justify-center">
                  <SignIn
                    routing="virtual"
                    oauthFlow="popup"
                    fallback={
                      <div className="p-8 animate-pulse w-full h-48">
                        <div className="size-full bg-black/5 rounded-2xl" />
                      </div>
                    }
                    forceRedirectUrl={AUTH_URL}
                    signUpForceRedirectUrl={AUTH_URL}
                    appearance={{
                      elements: {
                        rootBox: "!w-full",
                        cardBox: "!w-full !max-w-none !shadow-none",
                        card: "bg-transparent !pt-0 shadow-none border-none",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  )
}

export const tryTriggerSignIn = () => {
  document.getElementById(ID_BUTTON_CONNECT)?.click()
}
