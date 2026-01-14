import { staledResponse } from "@/lib/routes"
import { getTelegramMessages } from "@/lib/telegram-client"

// UpTop's job posting channel ID
const CHANNEL_ID = "-1002053820209"

export const revalidate = 900 // 15 minutes

export async function GET() {
  try {
    // Get latest 100 messages from channel
    const messages = await getTelegramMessages(CHANNEL_ID, 100)
    const CLIENT_MARKER = "CLIENT — "
    const jobs = await Promise.all(
      messages
        .filter((msg) => msg.message.includes(CLIENT_MARKER))
        .map(async (msg) => {
          const message = msg.message
          const clientName = `${
            message.split(CLIENT_MARKER)[1]?.split("\n")[0] || ""
          }`
            .replaceAll("☑️", "")
            .trim()

          const links = (msg.entities || []).filter((e: any) =>
            Boolean(e.url)
          ) as Array<{
            url: string
          }>

          const notionLink = links.find((link) => link.url.includes("notion"))
          const companySite = links.find((link) => !link.url.includes("notion"))

          // Can't retrieve job ID
          const jobIDPart = notionLink?.url.split("-").pop() || ""
          if (!jobIDPart) return null

          return {
            clientName,
            datePosted: new Date(msg.date * 1000).toISOString(),
            formattedJobID: jobIDPart,
            companySite: companySite?.url || null,
            faviconBaseDomain: companySite?.url
              ? new URL(companySite.url).hostname
              : null,
          }
        })
        // Remove any null jobs due to parsing issues
        .filter(Boolean)
    )

    return staledResponse(jobs, {
      timeInSeconds: revalidate,
    })
  } catch (error) {
    console.error("Telegram fetch error:", error)
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
