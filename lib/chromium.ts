import puppeteer, { Browser } from "puppeteer-core"
import chromium from "@sparticuz/chromium"

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false

export type { Browser }

/**
 * Launches a browser instance with appropriate configuration for local and production environments
 */
export async function getBrowser(): Promise<Browser> {
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
