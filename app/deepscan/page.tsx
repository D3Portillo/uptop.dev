"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import useSWRMutation from "swr/mutation"
import TopNavigation from "@/components/TopNavigation"
import Spinner from "@/components/Spinner"

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
    position: "Tech Lead",
    salary: "$220k",
    left: 78,
    top: 78,
    rotation: 6,
    delay: 1.1,
    floatOffset: 4,
  },
]

async function sendRequest(url: string, { arg }: { arg: File }) {
  const formData = new FormData()
  formData.append("file", arg)
  const response = await fetch(url, { method: "POST", body: formData })
  return response.json()
}

export default function PageDeepscan() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)

  const { trigger, isMutating, error, data } = useSWRMutation(
    "/api/resume/extract",
    sendRequest,
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      trigger(selectedFile)
    }
  }

  return (
    <main className="dark">
      <div className="min-h-screen bg-linear-to-b from-black via-ut-blue-dark/10 to-ut-blue-dark/20">
        <section className="backdrop-blur-xl [&_.Menu]:bg-black/90 bg-black/30 relative z-1">
          <TopNavigation
            className="bg-transparent!"
            onHomeButtonPress={() => router.push("/")}
          />
        </section>

        {/* Floating PDFs */}
        <div className="absolute overflow-hidden top-20 left-0 right-0 bottom-0 pointer-events-none">
          {FLOATING_PDFS.map((pdf, i) => (
            <div
              key={i}
              className="absolute"
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

        {/* Hero Section */}
        <div className="relative z-10 max-w-4xl px-6 pt-24 pb-12 mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white">
            How much are your skills worth?
          </h1>

          <p className="mt-4 text-xl text-white/60">
            Upload your resume. Discover your market value.
          </p>

          {/* Upload Area */}
          <div className="mt-12 max-w-md mx-auto">
            <label
              htmlFor="pdf-upload"
              className="group relative flex flex-col items-center justify-center w-full h-48 border border-white/10 rounded-2xl cursor-pointer bg-white/5 backdrop-blur-sm hover:border-ut-purple/60 hover:bg-white/8 transition-all hover:shadow-xl hover:shadow-ut-purple/10"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                {isMutating ? (
                  <Spinner themeSize="size-7" />
                ) : (
                  <svg
                    className="w-10 h-10 text-white/20 group-hover:text-ut-purple/60 transition-colors"
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
                <p className="text-sm text-white/40">
                  {file ? file.name : "Drop your CV here"}
                </p>
                <p className="text-xs text-white/20">PDF, max 5MB</p>
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && (
              <p className="mt-4 text-ut-red text-sm text-center">
                {error.message}
              </p>
            )}

            {data && (
              <p className="mt-4 text-ut-green text-sm text-center">
                Done — check console for results.
              </p>
            )}
          </div>
        </div>

        <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(calc(var(--float-offset, 6px) * -1)); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
      </div>
    </main>
  )
}
