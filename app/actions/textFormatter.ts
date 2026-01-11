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
- Remove redundant title like "Job Description" at start or main content. It's completely unnecessary here.
- ONLY format the existing text into proper markdown structure
- Use headers (# only) for sections
- Use bullet points for lists
- Use bold for important terms (do not overuse)
- Remove final action-texts like "Apply here: [link]" or "TOS", "Privacy Policy"
- Keep all original content as intact as possible, only changing formatting

RULE: Some context or text fragments to be aware of to be removed from final/formatted description:
- 👉🏻 LINK TO APPLY 💰
- Feel free to drop us an email at talent@uptopsearch.com
- Or any other similar call to action or external apply links (we just need the description here)

Job Description:
${currentDescription}

Return the formatted markdown version.
    `,
  })

  return output.markdown
}

export const formatJobTitles = async (titles: string[]) => {
  const { output } = await generateText({
    model: GPT4Nano,
    output: Output.array(z.array(z.string())),
    prompt: `
You are a job title formatter. Your task is to take the following list of job titles and format them into concise, professional titles suitable for a job listing website.

RULES:
- Keep titles concise (ideally under 60 characters)
- Use proper capitalization (Title Case, avoid ALL CAPS)
- Remove any unnecessary words or phrases
- Ensure titles accurately reflect common industry terminology
- If "empty" or "NO_TITLE", or "", return "Untitled Position"
- Even if titles are similar, always return a formatted version - need same list length as input

Job Titles:
${titles.map((title) => `- ${title}`).join("\n")}

Return the formatted job titles as a list.
    `,
  })

  return output
}
