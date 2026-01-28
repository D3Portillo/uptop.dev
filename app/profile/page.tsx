"use client"

import { Fragment, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toHex } from "viem"

import { extractSkillsFromJobs, useJobsList } from "@/lib/jobs"
import { cn } from "@/lib/utils"

import { IoCloseOutline } from "react-icons/io5"
import { MdCheck } from "react-icons/md"
import TopNavigation from "@/components/TopNavigation"
import AddressBlock from "@/components/AddressBlock"

export default function ProfilePage() {
  const router = useRouter()
  const { signOut, userId } = useAuth()
  const { user, isLoaded: isUserDataLoaded } = useUser()

  const { jobs, isLoading } = useJobsList()
  const skills = extractSkillsFromJobs(jobs)

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [hasCryptoExperience, setHasCryptoExperience] = useState(false)
  const [twitter, setTwitter] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCvFile(file)
      // Create preview URL for PDF
      const url = URL.createObjectURL(file)
      setCvPreviewUrl(url)
    }
  }

  const handleRemoveCv = () => {
    setCvFile(null)
    if (cvPreviewUrl) {
      URL.revokeObjectURL(cvPreviewUrl)
      setCvPreviewUrl(null)
    }
  }

  const handleDeleteProfile = () => {
    // TODO: Implement actual profile deletion
    console.log("Delete profile requested")
    setShowDeleteConfirm(false)
    signOut(() => router.push("/"))
  }

  const handleSave = () => {
    // TODO: Implement actual save functionality
    console.log({
      selectedSkills,
      hasCryptoExperience,
      twitter,
      linkedin,
      cvFile,
    })
  }

  if (!isUserDataLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-black/60">Loading...</div>
      </div>
    )
  }

  const profileImage = user?.imageUrl
  const fullName = user?.fullName || "Anonymous User"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <TopNavigation
        className="[&_nav]:mb-1 [&_nav]:sm:mb-3"
        onHomeButtonPress={() => router.push("/")}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-black/10 p-6 sm:p-8 mt-4 sm:mt-16 mb-24">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-black/7">
            <figure className="size-18 sm:size-20 overflow-hidden rounded-full border-2 border-black">
              {profileImage ? (
                <img
                  alt=""
                  src={profileImage}
                  className="size-full object-cover"
                />
              ) : (
                <AddressBlock
                  address={toHex(userId?.replace("user_", "") || "DEFAULT")}
                  className="size-full object-cover"
                />
              )}
            </figure>
            <div>
              <h2 className="text-2xl font-bold text-black">{fullName}</h2>
              <p className="text-black/50 text-sm mt-1">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-8 pb-12 border-b border-black/10">
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">Twitter</h3>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
                className="w-full px-4 h-12 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                LinkedIn
              </h3>

              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 h-12 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-ut-purple focus:ring-2 focus:ring-ut-purple/20 transition-all text-sm"
              />
            </div>

            {/* CV Upload */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                Resume / CV
              </h3>

              {cvFile || cvPreviewUrl ? (
                <div className="bg-gray-50 border border-black/10 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-ut-purple/20 rounded-lg flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">
                        {cvFile?.name || "current-cv.pdf"}
                      </p>
                      <p className="text-xs text-black/50">
                        {cvFile?.size
                          ? `${(cvFile.size / 1024).toFixed(1)} KB`
                          : "PDF Document"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCv}
                    className="p-2 text-black/50 hover:text-black transition-colors rounded-lg hover:bg-black/5"
                  >
                    <IoCloseOutline className="text-xl" />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-black/10 rounded-lg p-8 text-center hover:border-ut-purple/50 hover:bg-ut-purple/5 transition-all">
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-sm font-medium text-black/70">
                      Upload CV
                    </p>
                    <p className="text-xs text-black/50 mt-1">PDF (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCvUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Skills Selection */}
          <div className="mb-8 mt-8">
            <h3 className="text-lg font-semibold text-black mb-4">
              Skills <span className="font-normal text-base">(Max 5)</span>
            </h3>

            <div className="flex flex-wrap gap-2 items-center">
              {skills.map((skill) => (
                <button
                  key={`skill-p-${skill}`}
                  onClick={() => {
                    setSelectedSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill],
                    )
                  }}
                  className={cn(
                    "px-3 py-1 h-8 border border-transparent rounded-lg text-sm transition-colors",
                    skill.length > 3 ? "capitalize" : "uppercase",
                    selectedSkills.includes(skill)
                      ? "bg-ut-blue/20 text-black/90 border-black/10"
                      : "bg-black/3 text-black/50 border-black/5 hover:bg-black/5",
                  )}
                >
                  {skill.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto Experience */}
          <div className="pt-6 pb-12 flex justify-start border-t border-black/7">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative pt-0.5">
                <input
                  type="checkbox"
                  checked={hasCryptoExperience}
                  onChange={(e) => setHasCryptoExperience(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="size-5 border-2 border-black/20 rounded group-hover:border-black/30 peer-checked:border-ut-purple peer-checked:bg-ut-purple transition-all flex items-center justify-center">
                  {hasCryptoExperience && (
                    <MdCheck className="text-white text-sm" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-black">
                  Do you have experience working in the crypto/web3 industry?
                </p>
                <p className="text-xs text-black/50 mt-1">
                  This is not required, but helps us match you with relevant
                  opportunities.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <nav className="flex w-full">
            <button
              onClick={handleSave}
              className="px-6 w-full py-3 bg-ut-purple text-white rounded-lg font-semibold hover:bg-ut-purple/90 transition-colors shadow-lg shadow-ut-purple/20"
            >
              Save Changes
            </button>
          </nav>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Fragment>
          <style>{`body,html{overflow:hidden}`}</style>

          {/* Backdrop */}
          <div
            role="button"
            tabIndex={-1}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl border border-black/10 max-w-md w-full relative pointer-events-auto p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-black mb-2">
                  Delete Profile?
                </h2>
                <p className="text-sm text-black/60">
                  This action cannot be undone. All your data will be
                  permanently deleted.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-black/5 text-black/70 rounded-lg font-medium hover:bg-black/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="flex-1 px-4 py-3 bg-ut-red text-white rounded-lg font-semibold hover:bg-ut-red/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )
}
