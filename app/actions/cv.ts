"use server"

import { GPT4Nano } from "@/lib/openai"
import { generateText, Output } from "ai"
import { z } from "zod"

export const formatCVContent = async (extractedContent: string) => {
  const { output } = await generateText({
    model: GPT4Nano,
    output: Output.object({
      name: "formattedContent",
      schema: z.object({
        summary: z.string(),
        jobTitle: z.string(),
        sections: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
          }),
        ),
      }),
    }),
    prompt: `
You're a CV content formatter. Your task is to take raw text extracted from a PDF resume/cv and format it into clean, structured markdown suitable for a tech-focused job application.
1. Do not go crazy with formatting simple text
2. Don't add emojis or icons or any unnecessary symbols
3. Use common CV sections like "Experience", "Education", "Skills", "Projects" as headers if they are identifiable in the text
4. Use bullet points for job responsibilities and achievements
5. Try keep the original content intact, only change formatting
6. There MUST be a "Summary" section that won't be included in the "sections list" but will be in a seprate output field
7. "Summary" should start with "[Person - like the actual guy/person's first name - do not put complete name, just first name] is a" and take any existent summary or description from the CV, or as a last resort, generate a brief summary based on the content of the CV (1-2 sentences max)
9. Do not "Markdown" format stuff, simple bullet points, and raw text - as if to be put on a console or plain text.
10. Lastly. Provide a concise job title based on user's profile and experience. This should be something short and to the point like "Senior Frontend Developer" or "Data Scientist", not the freaking bible long shit

------------------
RAW CV CONTENT:
${extractedContent}
`,
  })

  return output
}

export const getProfileWorth = async (
  rawCvContent: string,
  referenceSalaryCSVFiles: string[],
) => {
  const { output } = await generateText({
    model: GPT4Nano,
    output: Output.object({
      name: "profileWorth",
      schema: z.object({
        explanation: z.string(),
        estimatedSalaryRangeInUSD: z.string(),
      }),
    }),
    prompt: `
You're a cv evaluator. Your task is to take the raw CV content and give an estimate of the candidate's market worth based on their experience, skills, and the current market salaries for tech and non-tech roles.
1. Analyze the CV content to identify key skills, years of experience, and notable achievements.
2. If provided, use the reference salary data to inform your evaluation, considering how the candidate's profile compares to typical profiles in the salary data.
3. Provide a short explanation of the candidate's profile and an estimated salary range they could expect in the current market - Has to be really short/scannable, no emojis, no fluff, to the point.
4. Explanation starts with profile name like "Jhon [do not put complete name, just first name] is a senior software engineer with 10 years of experience..."
5. Include the solid value in USD, eg: "$120k-$150k" nothing else, just pure value, no emojis and shit

RAW_CV_CONTENT:
${rawCvContent}

${
  referenceSalaryCSVFiles.length > 0
    ? `
------
And here's some reference data about the current salaries for tech and non-tech roles:
${referenceSalaryCSVFiles.map(() => "\n--------------\n")}

  `
    : ""
}
`,
  })

  return output
}

export const getJobRecommendations = async (
  jobTitleOrSummary: string,
  referenceJobs: string[],
) => {
  const { output } = await generateText({
    model: GPT4Nano,
    output: Output.array({
      name: "jobRecommendations",
      element: z.string(),
      description: "A list of up to 5 recommended job titles",
    }),
    prompt: `
You're a job recommendation engine.
Your task is to take a candidate's profile summary or job title and recommend at most 5 revelant jobs from the provided list of reference jobs.
Rules:
1. Do not recommended jobs not present in the reference list
2. Output same job title as in the reference list, do not change or modify the job titles
3. If the candidate's profile is very junior, recommend more junior roles, if it's senior, recommend more senior roles. Be mindful of the candidate's experience level as inferred from the job title or summary.
4. Take profile skills + summary when making recommendation, example: do not recommend "iOS Developer" to a non-mobile dev or pure frontend dev

REFERENCE_JOBS:
${referenceJobs.map((job) => `- ${job}`).join("\n")}

CANDIDATE_PROFILE:
${jobTitleOrSummary}
    `,
  })

  return output
}
