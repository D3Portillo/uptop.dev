import { auth } from "@clerk/nextjs/server"
import { keccak256, toHex } from "viem"
import { put } from "@vercel/blob"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return new Response("Missing file", { status: 400 })

  if (!file.type.endsWith("pdf"))
    return new Response("Only PDF files are allowed", { status: 400 })

  if (file.size > MAX_SIZE)
    return new Response("File exceeds 5MB limit", { status: 400 })

  const hash = keccak256(toHex(userId)).slice(2)
  const filename = `resumes/${hash}-cv.pdf`

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/pdf",
    allowOverwrite: true,
  })

  return Response.json({ url: blob.url })
}
