"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import useSWRImmutable from "swr/immutable"
import { useJobsList } from "@/lib/jobs"

import {
  getJobRecommendations,
  getProfileJobTitle,
  getProfileWorth,
} from "@/app/actions/cv"
import { cn } from "@/lib/utils"

import { ModalProfileWorth } from "@/components/ModalProfileWorth"

import TopNavigation from "@/components/TopNavigation"
import Spinner from "@/components/Spinner"

export default function PageDeepscan() {
  const router = useRouter()

  const [isDragging, setIsDragging] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const FILE_ID = file ? `${file.name}-${file.lastModified}-${file.size}` : null

  const { jobs } = useJobsList()
  const JOB_TITLES = jobs.map((job) => job.properties.title)

  const { isLoading: isParsingPDF, data: profile } = useSWRImmutable(
    `extract-file-${FILE_ID}`,
    async () => {
      if (!file) return null

      const { PDFParse } = await import("pdf-parse")
      PDFParse.setWorker(
        "https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.min.mjs",
      )

      const parser = new PDFParse({
        data: Buffer.from(await file.arrayBuffer()),
      })

      const { text: rawContent, total } = await parser.getText()
      const jobTitle = await getProfileJobTitle(rawContent)

      return {
        rawContent,
        jobTitle,
        totalPages: total,
      }
    },
  )

  const { data: salariesInCSV = null } = useSWRImmutable(
    `reference-salaries`,
    async () => {
      const [nonTech, tech] = await Promise.all([
        fetch("/salaries/non-tech.csv").then((r) => r.text()),
        fetch("/salaries/tech.csv").then((r) => r.text()),
      ])
      return { nonTech, tech }
    },
  )

  const { data: result = null, isLoading: isGettingProfileData } =
    useSWRImmutable(profile ? `cv-value-${FILE_ID}` : null, async () => {
      if (!profile) return null

      const [recommendedJobs, profileWorth] = await Promise.all([
        getJobRecommendations(
          profile.jobTitle,
          // JOB_TITLES - we'll iterate this later
          [],
        ),
        getProfileWorth(
          profile.rawContent,
          salariesInCSV ? Object.values(salariesInCSV) : [],
        ),
      ])

      return {
        recommendedJobs,
        profileWorth,
      }
    })

  // Open modal when result is available
  useEffect(() => {
    if (result) {
      setIsModalOpen(true)
    }
  }, [result, FILE_ID])

  const tryLoadFile = (file?: File) => {
    if (file?.type?.endsWith("pdf")) {
      setFile(file)
    } else {
      toast.error("Invalid File. Only PDF files are accepted")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    tryLoadFile(e.target.files?.[0])

  const updateDragState = (e: React.DragEvent, { isDragging = false }) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(isDragging)
  }

  const handleDragOver = (e: any) => updateDragState(e, { isDragging: true })
  const handleDragLeave = (e: any) => updateDragState(e, { isDragging: false })
  const handleDrop = (e: any) => {
    updateDragState(e, { isDragging: false })
    tryLoadFile(e?.dataTransfer?.files?.[0])
  }

  const isLoading = file ? isParsingPDF || isGettingProfileData : false

  return (
    <main className="dark relative overflow-hidden">
      <div className="min-h-screen bg-linear-to-b from-black via-ut-blue-dark/10 to-ut-blue-dark/20">
        <section className="[&_#button-connect]:bg-transparent [&_#theme-toggle]:hidden [&_.Menu]:bg-black/90 bg-black/30 backdrop-blur relative z-1">
          <TopNavigation
            className="bg-transparent! [&_nav]:mb-1 [&_nav]:sm:mb-3"
            onHomeButtonPress={() => router.push("/")}
          />
        </section>

        {/* Floating PDFs */}
        <div className="absolute overflow-hidden -top-30 sm:top-20 -left-5 sm:left-0 -right-5 sm:right-0 bottom-0 pointer-events-none">
          {FLOATING_PDFS.map((pdf, i) => (
            <div
              key={`floating-pdf-${i}`}
              className="absolute opacity-75 sm:opacity-100"
              style={{
                left: `${pdf.left}%`,
                top: `${pdf.top}%`,
                rotate: `${pdf.rotation}deg`,
              }}
            >
              <div
                className="animate-float"
                style={{
                  animationDelay: `${pdf.delay}s`,
                  animationDuration: "4s",
                }}
              >
                <div
                  className="w-36 h-48 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between p-4"
                  style={
                    {
                      "--float-offset": `${pdf.floatOffset}px`,
                    } as any
                  }
                >
                  <div className="space-y-1.5">
                    <div className="h-1 rounded-full bg-white/15 w-full" />
                    <div className="h-1 rounded-full bg-white/15 w-4/5" />
                    <div className="h-1 rounded-full bg-white/10 w-3/5" />
                    <div className="h-1 rounded-full bg-white/10 w-2/5" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs text-white leading-tight">
                      {pdf.position}
                    </span>
                    <span className="text-xs text-ut-green tabular-nums shrink-0">
                      {pdf.salary}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="max-w-3xl px-6 pt-28 pb-12 mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold text-white">
            How valuable are your skills?
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-white/70 sm:text-white/60">
            Upload resume {"->"} Discover your market value
          </p>

          {/* Upload Area */}
          <section className="mt-14 max-w-md mx-auto">
            <label
              htmlFor="pdf-upload"
              data-type="drag-n-drop-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "group relative flex flex-col items-center justify-center w-full h-48 border rounded-2xl cursor-pointer bg-ut-blue-alien/80 backdrop-blur transition-all",
                isLoading && "pointer-events-none",
                isDragging
                  ? "border-ut-blue-dark scale-102 shadow-xl shadow-ut-blue-dark/20"
                  : "border-white/10 hover:border-ut-blue-dark/60 hover:shadow-xl hover:shadow-ut-blue-dark/10",
              )}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                {isLoading ? (
                  <Spinner themeSize="size-7" />
                ) : (
                  <svg
                    className={cn(
                      "size-10 transition-colors",
                      "text-white/25 group-hover:text-white/60",
                      isDragging && "text-white/60",
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )}

                <p className="text-sm transition-colors text-white/50">
                  {isDragging
                    ? "Drop your PDF here"
                    : file?.name || "Drop or click to upload"}
                </p>

                {isDragging ? null : (
                  <p className="text-xs -mt-2 text-white/30">PDF (5MB MAX)</p>
                )}
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </section>

          <div className="py-12"></div>
        </div>

        <style>{`
        html,body { background: black }
        #tg-button { display: none }

        @keyframes float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(calc(var(--float-offset, 5px) * -1)) }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
      </div>

      <div className="fixed pointer-events-none z-1 from-black/0 to-black/40 bg-linear-to-b h-8 w-full bottom-0 left-0" />

      {/* Profile Worth Modal */}
      {result && (
        <ModalProfileWorth
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setFile(null)
          }}
          profileWorth={result.profileWorth}
        />
      )}
    </main>
  )
}

// left%, top%, rotation, delay, floatOffset (random movement amount)
const FLOATING_PDFS = [
  {
    position: "Senior Developer",
    salary: "$180k",
    left: 8,
    top: 15,
    rotation: -12,
    delay: 0,
    floatOffset: 6,
  },
  {
    position: "Product Manager",
    salary: "$165k",
    left: 80,
    top: 10,
    rotation: 8,
    delay: 0.7,
    floatOffset: 9,
  },
  {
    position: "UX Designer",
    salary: "$140k",
    left: 3,
    top: 48,
    rotation: -7,
    delay: 1.4,
    floatOffset: 5,
  },
  {
    position: "DevOps Engineer",
    salary: "$175k",
    left: 85,
    top: 45,
    rotation: 10,
    delay: 0.3,
    floatOffset: 8,
  },
  {
    position: "Data Scientist",
    salary: "$195k",
    left: 12,
    top: 80,
    rotation: -5,
    delay: 1.8,
    floatOffset: 7,
  },
  {
    position: "Financial Analyst",
    salary: "$220k",
    left: 78,
    top: 78,
    rotation: 6,
    delay: 1.1,
    floatOffset: 4,
  },
]
