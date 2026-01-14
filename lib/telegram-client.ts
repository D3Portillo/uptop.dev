import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"

const apiId = parseInt(process.env.TELEGRAM_API_ID || "")
const apiHash = process.env.TELEGRAM_API_HASH || ""
const sessionString = process.env.TELEGRAM_SESSION || ""

let clientInstance: TelegramClient | null = null

async function getClient() {
  if (clientInstance) {
    return clientInstance
  }

  const session = new StringSession(sessionString)
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  })

  await client.connect()
  clientInstance = client
  return client
}

export async function getTelegramMessages(channelId: string, limit = 100) {
  const client = await getClient()

  const messages = await client.getMessages(channelId, {
    limit,
  })

  // Close connection after fetching messages
  await client.disconnect()
  return messages.map(({ id, date, text, message, entities }) => ({
    id,
    date,
    text,
    message,
    entities,
  }))
}

export async function disconnectTelegram() {
  if (clientInstance) {
    await clientInstance.disconnect()
    clientInstance = null
  }
}
