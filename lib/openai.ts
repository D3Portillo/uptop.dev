import { createOpenAI } from "@ai-sdk/openai"

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const GPT5Nano = openai("gpt-5-nano")
export const GPT4Nano = openai("gpt-4.1-nano")
