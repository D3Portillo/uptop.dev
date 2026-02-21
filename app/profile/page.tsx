"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setProfileData, type CvMetadata } from "@/app/actions/profile"
import { extractSkillsFromJobs, useJobsList } from "@/lib/jobs"
import { toAddres, useProfileData } from "@/lib/profile"
import { cn } from "@/lib/utils"

import { MdCheck } from "react-icons/md"
import { FaEye, FaFilePdf, FaTrashAlt } from "react-icons/fa"

import SkillChip from "@/components/SkillChip"
import TopNavigation from "@/components/TopNavigation"
import AddressBlock from "@/components/AddressBlock"
import Spinner from "@/components/Spinner"
import { tryTriggerSignIn } from "@/components/Auth"

const MAX_SKILLS = 5
export default function ProfilePage() {
  const router = useRouter()
  const { userId, isSignedIn } = useAuth()
  const { user, isLoaded: isUserDataLoaded } = useUser()

  const [isSaving, setIsSaving] = useState(false)

  const { jobs, isLoading } = useJobsList()
  const skills = extractSkillsFromJobs(jobs)

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [hasCryptoExperience, setHasCryptoExperience] = useState(false)
  const [twitter, setTwitter] = useState("")
  const [telegram, setTelegram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [githubOrPortfolioURL, setGithubOrPortfolioURL] = useState("")

  const [cvFile, setCvFile] = useState<File | null>(null)

  const { profile } = useProfileData()

  useEffect(() => {
    if (profile) {
      setSelectedSkills(profile.skills || [])
      setHasCryptoExperience(profile.isCryptoSavvy || false)
      setGithubOrPortfolioURL(profile.githubOrPortfolioURL || "")
      setTwitter(profile.twitter || "")
      setTelegram(profile.telegram || "")
      setLinkedin(profile.linkedin || "")
    }
  }, [profile])

  const cvFileURI = useMemo(
    () => (cvFile ? URL.createObjectURL(cvFile) : null),
    [cvFile?.name, cvFile?.lastModified],
  )

  const cvPreviewName = cvFile?.name || profile?.cvMetadata?.name || null
  const cvViewURL = cvFileURI || profile?.cvMetadata?.vercelURL || null

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit")
      return
    }
    setCvFile(file)
  }

  const handleSave = async () => {
    // Try to trigger connect-flow
    if (!isSignedIn) return tryTriggerSignIn()
    if (!userId) return

    setIsSaving(true)

    // Determine if we need to update remote profile data
    const shouldUpdateRemote = [
      twitter !== profile?.twitter,
      linkedin !== profile?.linkedin,
      telegram !== profile?.telegram,
      githubOrPortfolioURL !== profile?.githubOrPortfolioURL,
      hasCryptoExperience !== profile?.isCryptoSavvy,
      JSON.stringify(selectedSkills) !== JSON.stringify(profile?.skills || []),
      cvFile !== null,
    ]
      // Only update if there's at least one change
      .some(Boolean)

    // Only update if there are changes
    if (shouldUpdateRemote) {
      try {
        console.debug(`Updating data for userId: ${userId}`)

        let cvMetadata: CvMetadata | undefined = profile?.cvMetadata

        if (cvFile) {
          const formData = new FormData()
          formData.append("file", cvFile)
          const res = await fetch("/api/resume", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) throw new Error("Failed to upload CV")
          const { url } = await res.json()
          cvMetadata = { name: cvFile.name, vercelURL: url }
        }

        await setProfileData(userId, {
          email: user?.primaryEmailAddress?.emailAddress,
          fullName: user?.fullName || undefined,
          twitter,
          linkedin,
          telegram,
          skills: selectedSkills,
          isCryptoSavvy: hasCryptoExperience,
          githubOrPortfolioURL,
          resumeURL: cvMetadata?.vercelURL,
          cvMetadata,
        })
      } catch (error) {
        toast.error("Oops, something went wrong.")
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250)) // Small delay for UX
    setIsSaving(false)
    toast.success("Profile updated successfully!")
  }

  if (!isUserDataLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const fullName = user?.fullName || "Anonymous User"

  return (
    <div className="min-h-screen">
      <TopNavigation
        className="[&_nav]:mb-1 [&_nav]:sm:mb-3"
        onHomeButtonPress={() => router.push("/")}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto sm:px-8 sm:pt-8 sm:pb-32">
        <div className="bg-white/30 dark:bg-white/7 text-black dark:text-white sm:rounded-xl border border-black/0 sm:border-black/10 dark:sm:border-white/10 p-7 sm:p-16 sm:mt-16">
          {/* Profile Header */}
          <div
            tabIndex={-1}
            onClick={() => {
              if (isSignedIn) return
              tryTriggerSignIn()
            }}
            role={isSignedIn ? "banner" : "button"}
            className={cn(
              isSignedIn || "cursor-pointer",
              "flex items-center gap-6 mt-6 sm:mt-0 mb-8 pb-8 border-b border-black/7 dark:border-white/7",
            )}
          >
            <figure className="size-17 sm:size-20 overflow-hidden rounded-2xl sm:rounded-full border border-black dark:border-white/10">
              <AddressBlock
                showAuthImage
                address={toAddres(userId || "")}
                className="size-full rounded-none object-cover"
              />
            </figure>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {isSignedIn ? fullName : "Disconnected User"}
              </h2>
              <p className="opacity-50 text-sm mt-1">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <section className={cn(isSignedIn || "pointer-events-none blur-xs")}>
            {/* Social Links */}
            <div className="space-y-8 pb-12 border-b border-black/10 dark:border-white/7">
              <section className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Telegram</h3>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@telegram"
                    className="w-full px-4 h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Twitter{" "}
                    <span className="font-normal text-base opacity-60">
                      (optional)
                    </span>
                  </h3>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@twitter"
                    className="w-full px-4 h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                  />
                </div>
              </section>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Portfolio / Website{" "}
                  <span className="font-normal text-base opacity-60">
                    (optional)
                  </span>
                </h3>

                <input
                  type="text"
                  value={githubOrPortfolioURL}
                  onChange={(e) => setGithubOrPortfolioURL(e.target.value)}
                  placeholder="Github, portfolio, or anything to showcase your work"
                  className="w-full px-4 h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">LinkedIn</h3>

                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 h-12 bg-transparent border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
                />
              </div>

              {/* CV Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resume / CV</h3>

                <label className="block cursor-pointer">
                  <div className="border-2 relative flex flex-col items-center justify-center border-dashed border-black/10 dark:border-white/10 rounded-lg h-36 sm:h-40 px-8 text-center hover:border-ut-purple/50 hover:bg-ut-purple/5 transition-all">
                    {cvPreviewName ? (
                      <Fragment>
                        <div
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            if (cvViewURL) window.open(cvViewURL, "_blank")
                          }}
                          className="absolute border border-transparent bg-black/3 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/5 rounded-full flex items-center gap-1 top-2 right-2 py-1 px-2"
                        >
                          <span className="text-xs font-semibold">View</span>
                          <FaEye />
                        </div>

                        <FaFilePdf className="text-4xl opacity-80 dark:opacity-100 scale-110" />
                        <p className="text-sm whitespace-nowrap opacity-50 mt-2 mb-1">
                          {cvPreviewName}
                        </p>
                      </Fragment>
                    ) : (
                      <Fragment>
                        <div className="text-4xl mb-2">📤</div>
                        <p className="text-sm font-medium opacity-70">
                          Upload CV
                        </p>
                        <p className="text-xs opacity-50 my-1">PDF (Max 5MB)</p>
                      </Fragment>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Skills Selection */}
            {isSignedIn ? (
              // Hide if not signed in
              <div className="mt-8 pb-8 border-b border-black/7 dark:border-white/7">
                <h3 className="text-lg font-semibold mb-4">
                  Skills{" "}
                  {selectedSkills.length ? (
                    <span className="font-normal text-base">
                      <span className="opacity-60">
                        ({selectedSkills.length}/{MAX_SKILLS})
                      </span>{" "}
                      <button
                        onClick={() => setSelectedSkills([])}
                        className="text-xs opacity-60 hover:opacity-90 ml-1 inline-flex items-center gap-1 border border-black/10 dark:border-white/15 px-2 py-1 rounded-lg"
                      >
                        <FaTrashAlt />
                        <span>Clear</span>
                      </button>
                    </span>
                  ) : (
                    <span className="font-normal text-base opacity-60">
                      (optional)
                    </span>
                  )}
                </h3>

                <div className="flex flex-wrap gap-2 items-center">
                  {skills.map((skill) => (
                    <SkillChip
                      skill={skill}
                      key={`p-skill-${skill}`}
                      isSelected={selectedSkills.includes(skill)}
                      onSelect={() => {
                        setSelectedSkills((prev) => {
                          const newSkills = prev.includes(skill)
                            ? prev.filter((s) => s !== skill)
                            : [...prev, skill]

                          return newSkills.slice(0, MAX_SKILLS)
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Crypto Experience */}
            <div className="mt-6 pb-12 flex justify-start">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative pt-1">
                  <input
                    type="checkbox"
                    checked={hasCryptoExperience}
                    onChange={(e) => setHasCryptoExperience(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="size-5 border-2 border-black/20 dark:border-white/20 rounded group-hover:border-black/35 dark:group-hover:border-ut-purple peer-checked:border-ut-purple peer-checked:bg-ut-purple transition-all flex items-center justify-center">
                    {hasCryptoExperience && (
                      <MdCheck className="text-white text-sm" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Do you have experience working in the crypto/web3 industry?
                  </p>
                  <p className="text-xs opacity-50 mt-1">
                    This is not required, but helps us match you with relevant
                    opportunities.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Action Buttons */}
          <nav className="flex w-full mb-24 sm:mb-4">
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 flex items-center justify-center gap-3 w-full py-3 bg-ut-purple text-white rounded-lg font-semibold hover:bg-ut-purple/90 transition-colors shadow-lg shadow-ut-purple/20"
            >
              {isSignedIn ? (
                isSaving ? (
                  <Fragment>
                    <Spinner themeSize="size-5" />
                    <span className="mr-3">Saving</span>
                  </Fragment>
                ) : (
                  "Save Changes"
                )
              ) : (
                "Connect & Continue"
              )}
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
