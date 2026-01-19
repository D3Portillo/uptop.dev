import puppeteer, { Browser } from "puppeteer-core"
import chromium from "@sparticuz/chromium"
import { redis, CACHE_KEYS } from "./redis"

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false

export type { Browser }

/**
 * Acquires an atomic lock and launches browser
 * @param resourceId - identifier for debugging (e.g., "listings", "listing:abc-123")
 * @throws Error if lock is already held
 */
export async function acquireBrowserLock(resourceId: string): Promise<Browser> {
  // Single browser (key-based) shared across requests
  const lockKey = CACHE_KEYS.browserLock
  const lockValue = `${resourceId}:${Date.now()}`
  const lockTTL = 5 * 60 // 5 minutes in seconds

  // Attempt to acquire lock
  const acquired = await redis.set(lockKey, lockValue, {
    nx: true, // Only set if not exists
    ex: lockTTL, // Expire after TTL
  })

  if (!acquired) {
    throw new Error("Browser is locked by another process")
  }

  // Lock acquired, launch browser
  const isLocal = process.env.NODE_ENV !== "production"

  const browser = await puppeteer.launch({
    acceptInsecureCerts: true,
    args: isLocal
      ? puppeteer.defaultArgs()
      : puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    defaultViewport: {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    },
    executablePath: isLocal
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : await chromium.executablePath(),
    headless: isLocal ? false : "shell",
  })

  return browser
}

/**
 * Closes browser and releases the lock
 */
export async function releaseLockedBrowser(browser: Browser): Promise<void> {
  try {
    await browser.close()
  } catch (error) {
    console.error("Error closing browser:", error)
  } finally {
    await redis.del(CACHE_KEYS.browserLock)
  }
}
