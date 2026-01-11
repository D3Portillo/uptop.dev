"use server"

import { GPT4Nano } from "@/lib/openai"
import { generateText, Output } from "ai"
import { z } from "zod"

const FormattedDescriptionSchema = z.object({
  markdown: z.string(),
})

export const formatJobDescription = async (currentDescription: string) => {
  const { output } = await generateText({
    model: GPT4Nano,
    output: Output.object({
      schema: FormattedDescriptionSchema,
    }),
    prompt: `
You are a job description formatter. Your task is to format the following job description as clean, readable markdown.

RULES:
- DO NOT rewrite or change the content
- DO NOT add new information
- DO NOT remove important details
- ONLY format the existing text into proper markdown structure
- Use headers (# only) for sections
- Use bullet points for lists
- Use bold for important terms (do not overuse)
- Keep all original content as intact as possible, only changing formatting

Job Description:
${currentDescription}

Return the formatted markdown version.
    `,
  })

  return output.markdown
}
