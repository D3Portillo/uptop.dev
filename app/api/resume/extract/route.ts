import { formatCVContent } from "@/app/actions/cv"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export type ResumeExtract = {
  summary: string
  jobTitle: string
  sections: { title: string; content: string }[]
  rawText: string
  metadata: {
    pages: number
    textLength: number
    fileName: string
    fileSize: number
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return new Response("Missing file", { status: 400 })

    if (!file.type.endsWith("pdf"))
      return new Response("Only PDF files are allowed", { status: 400 })

    if (file.size > MAX_SIZE)
      return new Response("File exceeds 5MB limit", { status: 400 })

    // Step 1: Extract text from PDF
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let pdfData
    try {
      require("pdf-parse/worker")
      const { PDFParse } = require("pdf-parse")
      const parser = new PDFParse({ data: buffer })
      pdfData = await parser.getText()
    } catch (error) {
      console.error("PDF parsing error:", error)
      return new Response("Failed to parse PDF file", { status: 422 })
    }

    const extractedText = pdfData.text
    const numPages = pdfData.total

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        "No text found in PDF. The file may be an image or scanned document.",
        { status: 422 },
      )
    }

    // Step 2: Use OpenAI to extract structured resume data
    let sections = []
    let summary = ""
    let jobTitle = ""

    try {
      const {
        sections: sectionsResult,
        summary: summaryResult,
        jobTitle: jobTitleResult,
      } = await formatCVContent(extractedText)

      sections = sectionsResult
      summary = summaryResult
      jobTitle = jobTitleResult
    } catch (error) {
      console.error("OpenAI parsing error:", error)
      return new Response("Failed to parse resume content with AI", {
        status: 500,
      })
    }

    return Response.json({
      summary,
      jobTitle,
      sections,
      rawText: extractedText,
      metadata: {
        pages: numPages,
        textLength: extractedText.length,
        fileName: file.name,
        fileSize: file.size,
      },
    } satisfies ResumeExtract)
  } catch (error) {
    console.error("Unexpected error:", error)
    return new Response("An unexpected error occurred", { status: 500 })
  }
}
