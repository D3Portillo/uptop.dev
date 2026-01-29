"use client"

import { useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toHex } from "viem"

import { extractSkillsFromJobs, useJobsList } from "@/lib/jobs"
import { MdCheck } from "react-icons/md"

import SkillChip from "@/components/SkillChip"
import TopNavigation from "@/components/TopNavigation"
import AddressBlock from "@/components/AddressBlock"

export default function ProfilePage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user, isLoaded: isUserDataLoaded } = useUser()

  const { jobs, isLoading } = useJobsList()
  const skills = extractSkillsFromJobs(jobs)

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [hasCryptoExperience, setHasCryptoExperience] = useState(false)
  const [twitter, setTwitter] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null)

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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-black/60 dark:text-white/60">Loading...</div>
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
      <div className="max-w-4xl mx-auto sm:px-8 sm:pt-8 sm:pb-32">
        <div className="bg-white text-black dark:text-white dark:bg-white/5 sm:rounded-xl border border-black/0 sm:border-black/10 dark:sm:border-white/10 p-7 sm:p-16 sm:mt-16">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mt-6 sm:mt-0 mb-8 pb-8 border-b border-black/7 dark:border-white/7">
            <figure className="size-18 sm:size-20 overflow-hidden rounded-2xl sm:rounded-full border border-black dark:border-white/10">
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
              <h2 className="text-xl sm:text-2xl font-bold">{fullName}</h2>
              <p className="opacity-50 text-sm mt-1">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-8 pb-12 border-b border-black/10 dark:border-white/7">
            <div>
              <h3 className="text-lg font-semibold mb-4">Twitter</h3>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
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
                <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-lg p-8 text-center hover:border-ut-purple/50 hover:bg-ut-purple/5 transition-all">
                  <div className="text-4xl mb-2">📤</div>
                  <p className="text-sm font-medium opacity-70">Upload CV</p>
                  <p className="text-xs opacity-50 mt-1">PDF (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCvUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Skills Selection */}
          <div className="mb-8 mt-8">
            <h3 className="text-lg font-semibold mb-4">
              Skills <span className="font-normal text-base">(Max 5)</span>
            </h3>

            <div className="flex flex-wrap gap-2 items-center">
              {skills.map((skill) => (
                <SkillChip
                  skill={skill}
                  key={`p-skill-${skill}`}
                  isSelected={selectedSkills.includes(skill)}
                  onSelect={() => {
                    setSelectedSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill],
                    )
                  }}
                />
              ))}
            </div>
          </div>

          {/* Crypto Experience */}
          <div className="pt-6 pb-12 flex justify-start border-t border-black/7 dark:border-white/7">
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

          {/* Action Buttons */}
          <nav className="flex w-full mb-24 sm:mb-4">
            <button
              onClick={handleSave}
              className="px-6 w-full py-3 bg-ut-purple text-white rounded-lg font-semibold hover:bg-ut-purple/90 transition-colors shadow-lg shadow-ut-purple/20"
            >
              Save Changes
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
