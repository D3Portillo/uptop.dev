import { getBrowser, type Browser } from "@/lib/chromium"

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

async function fetchListings() {
  let browser = null as Browser | null

  try {
    // Launch browser with chromium
    browser = await getBrowser()

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

      const elements = container.querySelectorAll(
        "[data-block-id].notion-collection-item"
      )

      return Array.from(elements).map((el) => {
        const ID = el.getAttribute("data-block-id") || ""
        const rowElement = el.querySelector(".notion-table-view-row")
        const rowItems = rowElement?.querySelectorAll("[data-col-index]")

        const rowIndex = Number(
          rowItems?.item(0)?.getAttribute("data-row-index") || "0"
        )

        return {
          id: ID,
          rowIndex,
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

    await browser.close()
    const formattedBlocks = rawBlockData
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
          // "$300k +" => "$300k+"
          // "+$300k"  => "$300k+"
          const isUpperSalaryOrMore = ["+", ">"].some((c) => range.includes(c))
          const isSingleRange = !range.includes("-")
          return isUpperSalaryOrMore && isSingleRange
            ? `${range.replaceAll(/[+>]/g, "").trim()}+`
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

    const result = {
      success: true,
      count: formattedBlocks.length,
      data: formattedBlocks,
    }

    return result
  } catch (error) {
    if (browser) await browser.close()
    throw error
  }
}

export type TListingResponse = Awaited<ReturnType<typeof fetchListings>>

export const revalidate = 3600

export async function GET() {
  try {
    const result = await fetchListings()
    return Response.json(result, {
      headers: {
        "Cache-Control": `public, max-age=${revalidate}, s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
      },
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
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
