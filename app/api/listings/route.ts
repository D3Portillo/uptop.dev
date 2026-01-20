import { formatJobTitles } from "@/app/actions/textFormatter"
import { acquireBrowserLock, releaseLockedBrowser } from "@/lib/chromium"
import { formatID } from "@/lib/id"
import { redis, CACHE_KEYS } from "@/lib/redis"
import { staledResponse } from "@/lib/routes"
import { formatTitleCase } from "@/lib/utils"

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
  propertyName: (typeof ROW_HEADERS)[number],
) => {
  const index = ROW_HEADERS.indexOf(propertyName)
  const value = index !== -1 ? block?.properties[index]?.trim() : null

  // Avoid falsy values - keep consitent
  return value || null
}

async function fetchListings() {
  const browser = await acquireBrowserLock("listings")

  try {
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
        "[data-block-id].notion-collection-item",
      )

      return Array.from(elements).map((el) => {
        const ID = el.getAttribute("data-block-id") || ""
        const rowElement = el.querySelector(".notion-table-view-row")
        const rowItems = rowElement?.querySelectorAll("[data-col-index]")

        const rowIndex = Number(
          rowItems?.item(0)?.getAttribute("data-row-index") || "0",
        )

        return {
          id: ID,
          rowIndex,
          // Notion removes dashes from IDs in URLs
          formattedId: formatID(ID),
          applyLink: `https://noteforms.com/forms/top-shelf-job-application-cheqot?084f5395-fbce-48de-81e2-ca34d396c6a0%5B%5D=${ID}`,
          properties: Array.from(rowItems || []).map((item) => {
            const popUps = Array.from(
              item.querySelectorAll("[data-popup-origin=true]"),
            )

            return popUps.length > 0
              ? popUps.map((popup) => popup.textContent).join(", ")
              : item.textContent
          }),
        }
      })
    })

    await releaseLockedBrowser(browser)
    const formattedBlocks = rawBlockData
      // Remove empty blocks
      .filter((block) => block.properties.length > 0)
      // Remove duplicate blocks
      .filter(
        (block, idx, arr) => idx === arr.findIndex(({ id }) => id === block.id),
      )
      .map((block) => {
        const SALARY_RANGE = tagify(
          fetchBlockProperty(block, "SALARY")
            // Remove "MARKET RATE" from notion entry
            ?.replace(/market rate/i, ""),
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
            category: fetchBlockProperty(block, "CATEGORY"),
            remotePolicy: fetchBlockProperty(block, "OFFICE_POLICY"),
            skills: tagify(fetchBlockProperty(block, "SKILLS") || ""),
            // Null when salary not present
            salaryRange: SALARY_RANGE.length ? SALARY_RANGE : null,
            company: COMPANY,
          },
        }
      })

    const formattedTitles = await formatJobTitles(
      formattedBlocks.map((block) => block.properties.title || "NO_TITLE"),
    )

    const result = {
      success: true,
      count: formattedBlocks.length,
      data: formattedBlocks.map((block, index) => ({
        ...block,
        properties: {
          ...block.properties,
          // Use formatted title from AI, or fallback to original
          title:
            formattedTitles[index] ||
            formatTitleCase(block.properties.title || "Untitled Job"),
        },
      })),
    }

    return result
  } catch (error) {
    await releaseLockedBrowser(browser)
    throw error
  }
}

export type TListingResponse = Awaited<ReturnType<typeof fetchListings>>

//////////////////////////////////////////
// API Route Handlers
//////////////////////////////////////////

export const revalidate = 3600 // 1 hour

export async function GET() {
  try {
    const cache = await redis.get<TListingResponse>(CACHE_KEYS.listings)
    if (cache) return Response.json(cache)

    // No cached data
    return Response.json({
      success: false,
      count: 0,
      data: [],
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    )
  }
}

export async function POST() {
  try {
    const cacheKey = CACHE_KEYS.listings
    const timestampKey = `${cacheKey}:timestamp`

    const lastUpdate = await redis.get<number>(timestampKey)
    const now = Date.now()
    const cacheTimeInMs = revalidate * 1000 // Time in milliseconds

    const getNextUpdate = (ts: number) =>
      new Date(ts + cacheTimeInMs).toISOString()

    if (lastUpdate && now - lastUpdate < cacheTimeInMs) {
      // We're still within the cache period
      return staledResponse(
        {
          cached: true,
          nextUpdate: getNextUpdate(lastUpdate),
        },
        {
          timeInSeconds: revalidate,
        },
      )
    }

    // Fetch new data from Notion
    const freshData = await fetchListings()

    // Get existing cached data for merge
    const existingData = await redis.get<TListingResponse>(cacheKey)

    // Merge approach: keep all jobs, update existing ones with fresh data
    const mergedJobs = new Map<string, (typeof freshData.data)[number]>()

    // First, add all existing jobs to the map
    existingData?.data?.forEach((job) => {
      mergedJobs.set(job.id, job)
    })

    // Then, add/update with fresh data (overwrites existing)
    freshData.data.forEach((job) => {
      mergedJobs.set(job.id, job)
    })

    const mergedResult: TListingResponse = {
      success: true,
      count: mergedJobs.size,
      data: Array.from(mergedJobs.values()),
    }

    // Update cache with merged data
    await Promise.all([
      redis.set(cacheKey, mergedResult),
      redis.set(timestampKey, now),
    ])

    return staledResponse(
      {
        cached: false,
        data: mergedResult,
        nextUpdate: getNextUpdate(now),
        mergedCount: mergedJobs.size,
        freshCount: freshData.data.length,
      },
      {
        timeInSeconds: revalidate,
      },
    )
  } catch (error) {
    return staledResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        timeInSeconds: revalidate / 2,
        statusCode: 500,
      },
    )
  }
}

//////////////////////////////////////////
// Helper Functions
//////////////////////////////////////////

/**
 * Turn a comma-separated string into an array of tags
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
