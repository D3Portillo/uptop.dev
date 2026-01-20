import { formatJobDescription } from "@/app/actions/textFormatter"
import { acquireBrowserLock, releaseLockedBrowser } from "@/lib/chromium"
import { formatID } from "@/lib/id"
import { redis, CACHE_KEYS } from "@/lib/redis"
import { staledResponse } from "@/lib/routes"

async function fetchListingDetails(postID: string) {
  const formattedId = formatID(postID)
  const browser = await acquireBrowserLock(`api/listings/${postID}`, "jobs")

  try {
    const page = await browser.newPage()

    await page.goto(`https://uptop.notion.site/${formattedId}`, {
      waitUntil: "networkidle2",
    })

    await page.waitForSelector(".notion-page-content")

    const { description, datePosted } = await page.evaluate(() => {
      // Remove all bookmarks
      document
        .querySelectorAll(".notion-bookmark-block")
        .forEach((el) => el.remove())

      // Remove any back link or board link
      document.querySelectorAll("a").forEach((el) => {
        if (el.href.includes("notion.site")) {
          // Remove whole block containing the link
          el.parentElement?.remove()
        }
      })

      // Remove no link blocks with placeholder text
      document.querySelectorAll(".notion-text-block").forEach((el) => {
        const elementText = el.textContent?.toUpperCase() || ""
        const TEXTS = ["TO JOB BOARD"]
        if (TEXTS.some((text) => elementText.includes(text))) {
          el.remove()
        }
      })

      const datePosted = (
        document.querySelector(
          '[aria-label="Page properties"]',
        ) as HTMLElement | null
      )?.innerText
        ?.split("\n")
        ?.find((s) => /202[56]/.test(s))

      let description =
        (document.querySelector(".notion-page-content") as HTMLElement | null)
          ?.innerText || ""

      return {
        datePosted: datePosted ? new Date(datePosted).toISOString() : null,
        description:
          // Only return when description is meaningful (>10 words)
          description.split(" ").length > 10 ? description : null,
      }
    })

    await releaseLockedBrowser(browser)
    return {
      postID,
      formattedId,
      post: {
        datePosted,
        // AI format description to markdown
        description: description
          ? await formatJobDescription(description)
          : null,
      },
    }
  } catch (error) {
    await releaseLockedBrowser(browser)
    throw error
  }
}

export type TListingDetailsResponse = Awaited<
  ReturnType<typeof fetchListingDetails>
>

//////////////////////////////////////////
// API Route Handlers
//////////////////////////////////////////

export const revalidate = 300 // 5 minutes

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ postID: string }>
  },
) {
  const { postID } = await params

  let data: any = {}
  try {
    const cacheKey = CACHE_KEYS.listingDetail(postID)
    data = (await redis.get<TListingDetailsResponse>(cacheKey)) || {}
  } catch (error) {}

  return staledResponse(
    {
      success: Object.keys(data).length > 0,
      ...data,
    },
    {
      timeInSeconds: revalidate,
    },
  )
}

export async function POST(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ postID: string }>
  },
) {
  const { postID } = await params

  try {
    const cacheKey = CACHE_KEYS.listingDetail(postID)
    const timestampKey = `${cacheKey}:timestamp`

    const lastUpdate = await redis.get<number>(timestampKey)
    const now = Date.now()
    const cacheTimeInMs = 60 * 60 * 1000 // 1 hour

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

    // Fetch new data + update cache
    const result = await fetchListingDetails(postID)
    if ([result.post.datePosted, result.post.description].some(Boolean)) {
      // Store if we have meaningful data
      await Promise.all([
        redis.set(cacheKey, result),
        redis.set(timestampKey, now),
      ])
    }

    return staledResponse(
      {
        cached: false,
        data: result,
        nextUpdate: getNextUpdate(now),
      },
      {
        timeInSeconds: revalidate,
      },
    )
  } catch (error) {
    return staledResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        timeInSeconds: revalidate,
        statusCode: 500,
      },
    )
  }
}
