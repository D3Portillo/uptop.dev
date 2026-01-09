import puppeteer, { Browser } from "puppeteer-core"
import chromium from "@sparticuz/chromium"

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false

const ROW_HEADERS = [
  "STATUS",
  "TITLE",
  "COMPANY",
  "CATEGORY",
  "OFFICE_POLICY",
  "LOCATION",
  "SKILLS",
  "SALARY",
] as const

const fetchBlockProperty = (
  block: {
    properties: string[]
  },
  propertyName: (typeof ROW_HEADERS)[number]
) => {
  const index = ROW_HEADERS.indexOf(propertyName)
  const value = index !== -1 ? block?.properties[index]?.trim() : null

  // Avoid falsy values - keep consitent
  return value || null
}

export async function GET() {
  let browser = null as Browser | null

  try {
    const isLocal = process.env.NODE_ENV !== "production"

    // Launch browser with chromium
    browser = await puppeteer.launch({
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

    const page = await browser.newPage()

    // Navigate to the Notion job board
    await page.goto("https://uptop.notion.site/job-board", {
      waitUntil: "networkidle2",
    })

    // Wait for the collection view to load
    await page.waitForSelector(".notion-table-view")

    // Extract all data-block-id attributes
    const rawBlockData = await page.evaluate(() => {
      const container = document.querySelector(".notion-table-view")
      if (!container) return []

      const elements = container.querySelectorAll("[data-block-id]")
      return Array.from(elements).map((el) => {
        const ID = el.getAttribute("data-block-id") || ""
        const rowElement = el.querySelector(".notion-table-view-row")
        const rowItems = rowElement?.querySelectorAll("[data-col-index]")

        return {
          id: ID,
          // Notion removes dashes from IDs in URLs
          formattedId: ID.replaceAll("-", ""),
          applyLink: `https://noteforms.com/forms/top-shelf-job-application-cheqot?084f5395-fbce-48de-81e2-ca34d396c6a0%5B%5D=${ID}`,
          properties: Array.from(rowItems || []).map((item) => {
            const popUps = Array.from(
              item.querySelectorAll("[data-popup-origin=true]")
            )

            return popUps.length > 0
              ? popUps.map((popup) => popup.textContent).join(", ")
              : item.textContent
          }),
        }
      })
    })

    // Reuse a single page instead of creating 50+
    const detailPage = await browser.newPage()

    type BlockData = (typeof rawBlockData)[number]
    type FinalBlockData = BlockData & {
      description: string | null
    }

    const blockData = [] as Array<FinalBlockData>

    for (const block of rawBlockData) {
      // Omit for now - testing purposes
      let blockWithMetadata: FinalBlockData = {
        ...block,
        description: null,
      }

      try {
        throw new Error("Skipping detail fetch for testing")
        await detailPage.goto(
          `https://uptop.notion.site/${block.formattedId}`,
          {
            waitUntil: "domcontentloaded",
            timeout: 15_000,
          }
        )

        await detailPage.waitForSelector(".notion-page-content", {
          timeout: 10_000,
        })

        const { description } = await detailPage.evaluate(() => {
          const applyLink = document.querySelector(".notion-page-block a")

          return {
            applyLink: applyLink?.getAttribute("href") || null,
            description:
              document.querySelector(".notion-page-content")?.textContent ||
              null,
          }
        })

        blockWithMetadata = {
          ...block,
          description,
        }
      } catch (error) {
        console.error(
          `Error fetching details for ID: ${block.formattedId}:`,
          error
        )
      }

      blockData.push(blockWithMetadata)
    }

    await Promise.all([page, detailPage].map((p) => p.close()))

    const formattedBlocks = blockData
      // Remove empty blocks
      .filter((block) => block.properties.length > 0)
      // Remove duplicate blocks
      .filter(
        (block, idx, arr) => idx === arr.findIndex(({ id }) => id === block.id)
      )
      .map((block) => {
        const SALARY_RANGE = tagify(
          fetchBlockProperty(block, "SALARY")
            // Remove "MARKET RATE" from notion entry
            ?.replace(/market rate/i, "")
        ).map((range) => {
          // Format from possible inputs to standard format
          // "$300k +" => "> $300k"
          // "+$300k"  => "> $300k"
          const isPlus = range.includes("+")
          const isSingleRange = !range.includes("-")
          return isPlus && isSingleRange
            ? `> ${range.replaceAll("+", "").trim()}`
            : range
        })

        const COMPANY =
          `${fetchBlockProperty(block, "COMPANY") || ""}`
            .replace("No access", "")
            .trim() || null

        return {
          ...block,
          properties: {
            title: fetchBlockProperty(block, "TITLE"),
            status: fetchBlockProperty(block, "STATUS"),
            location: fetchBlockProperty(block, "LOCATION"),
            remotePolicy: fetchBlockProperty(block, "OFFICE_POLICY"),
            skills: tagify(fetchBlockProperty(block, "SKILLS") || ""),
            // Null when salary not present
            salaryRange: SALARY_RANGE.length ? SALARY_RANGE : null,
            company: COMPANY,
          },
        }
      })

    return Response.json({
      success: true,
      count: formattedBlocks.length,
      data: formattedBlocks,
    })
  } catch (error) {
    if (browser) {
      await browser.close()
    }

    console.error("Error scraping Notion:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Helper to turn a comma-separated string into an array of tags
 */
function tagify(str = "") {
  return (
    str
      // Clean up comman and turn into array
      .split(",")
      .map((s) => s.trim())
      // Filter out empty strings
      .filter(Boolean) || null
  )
}
