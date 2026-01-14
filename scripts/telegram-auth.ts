import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"
import * as readline from "readline"
import "dotenv/config"

const apiId = parseInt(process.env.TELEGRAM_API_ID || "")
const apiHash = process.env.TELEGRAM_API_HASH || ""

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve))
}

async function authenticate() {
  if (!apiId || !apiHash) {
    console.error("Missing TELEGRAM_API_ID or TELEGRAM_API_HASH env vars")
    console.log("\nGet credentials from: https://my.telegram.org")
    process.exit(1)
  }

  const stringSession = new StringSession()
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  })

  await client.start({
    phoneNumber: async () => await question("Phone number: "),
    password: async () => await question("Password (if enabled): "),
    phoneCode: async () => await question("Telegram code: "),
    onError: (err) => console.error(err),
  })

  console.log("\nAuthentication successful!")
  console.log("\nAdd this to your .env.local:\n")
  console.log(`TELEGRAM_SESSION="${client.session.save()}"`)

  rl.close()
  process.exit(0)
}

authenticate()
