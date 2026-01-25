"use client"

import { Fragment, useEffect, useState } from "react"
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs"
import {
  IoChevronDownOutline,
  IoChevronForwardSharp,
  IoCloseOutline,
} from "react-icons/io5"
import AddressBlock from "./AddressBlock"
import { toHex } from "viem"

export default function Auth() {
  const { signOut, isSignedIn, userId } = useAuth()
  const [_isSignInOpen, setIsSignInOpen] = useState(false)

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
          onClick={() => setIsSignInOpen(true)}
          className="h-9 active:scale-98 outline-2 shadow-lg shadow-pink-600/10 hover:shadow-pink-600/20 outline-pink-600/15 text-sm pr-3 relative pl-4 flex gap-1.5 items-center bg-linear-to-br from-pink-600 to-ut-purple rounded-full text-white font-semibold transition-colors"
        >
          <span>Connect</span>
          <IoChevronForwardSharp className="scale-115" />
        </button>
      </SignedOut>

      <SignedIn>
        <button
          data-user-id={userId || "null"}
          onClick={() => signOut()}
          className="h-9 rounded-lg pl-1 pr-2 bg-black/3 hover:bg-black/5 transition-colors flex items-center gap-1"
        >
          <AddressBlock
            address={toHex(userId?.replace("user_", "") || "DEFEAULT_ADDRESS")}
            className="size-7 rounded-full border border-black"
          />
          <span className="text-xs ml-1 font-semibold">Profile</span>
          <IoChevronDownOutline />
        </button>
      </SignedIn>

      {/* Sign-In Modal */}
      {isSignInOpen && (
        <Fragment>
          <style>{`body,html{overflow:hidden}`}</style>

          {/* Backdrop */}
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setIsSignInOpen(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
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
