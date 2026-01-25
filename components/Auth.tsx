"use client"

import { Fragment, useState } from "react"
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs"
import { Drawer } from "vaul"
import { IoChevronForwardSharp, IoCloseOutline } from "react-icons/io5"

export default function Auth() {
  const { signOut } = useAuth()
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  const AUTH_URL = typeof window !== "undefined" ? location.href : undefined
  return (
    <Fragment>
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
          onClick={() => signOut()}
          className="text-sm font-semibold text-black/70"
        >
          Disconnect
        </button>
      </SignedIn>

      {/* Sign-In Modal */}
      <Drawer.Root open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 top-14 sm:top-20 z-50 max-w-md mx-auto px-2 sm:px-6 flex outline-none">
            <div className="h-full bg-white rounded-t-2xl shadow-2xl border border-black/10 flex flex-col w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 pr-3 border-b border-black/10 shrink-0">
                <h2 className="text-lg font-semibold text-black">
                  Sign in to UpTop
                </h2>

                <button
                  onClick={() => setIsSignInOpen(false)}
                  className="p-2 text-black/70 hover:text-black"
                >
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
                <SignIn
                  routing="virtual"
                  oauthFlow="popup"
                  forceRedirectUrl={AUTH_URL}
                  signUpForceRedirectUrl={AUTH_URL}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      cardBox: "w-full !shadow-none",
                      card: "bg-transparent !pt-0 shadow-none border-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                    },
                  }}
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </Fragment>
  )
}
