import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"

const apiId = parseInt(process.env.TELEGRAM_API_ID || "")
const apiHash = process.env.TELEGRAM_API_HASH || ""
const sessionString = process.env.TELEGRAM_SESSION || ""

export async function getTelegramMessages(channelId: string, limit = 100) {
  const session = new StringSession(sessionString)
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 2,
    requestRetries: 2,
    timeout: 5_000, // 5 seconds
  })

  try {
    await client.connect()
    const messages = await client.getMessages(channelId, { limit })

    return messages.map(({ id, date, text, message, entities }) => ({
      id,
      date,
      text,
      message,
      entities,
    }))
  } finally {
    await client.destroy()
  }
}
