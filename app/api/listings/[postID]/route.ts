import { formatJobDescription } from "@/app/actions/textFormatter"
import { getBrowser, type Browser } from "@/lib/chromium"
import { redis, CACHE_KEYS } from "@/lib/redis"

async function fetchListingDetails(postID: string) {
  const formattedId = postID.replaceAll("-", "")
  let browser = null as Browser | null

  try {
    // Launch browser with chromium
    browser = await getBrowser()
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
          '[aria-label="Page properties"]'
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

    await browser.close()
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
    if (browser) await browser.close()
    throw error
  }
}

export type TListingDetailsResponse = Awaited<
  ReturnType<typeof fetchListingDetails>
>

export const revalidate = 300 // 5 minutes

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ postID: string }>
  }
) {
  const { postID } = await params

  let data: any = {}
  try {
    const cacheKey = CACHE_KEYS.listingDetail(postID)
    data = (await redis.get<TListingDetailsResponse>(cacheKey)) || {}
  } catch (error) {}

  return Response.json({
    success: Object.keys(data).length > 0,
    ...data,
  })
}

export async function POST(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ postID: string }>
  }
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
      return Response.json({
        cached: true,
        nextUpdate: getNextUpdate(lastUpdate),
      })
    }

    // Fetch new data + update cache
    const result = await fetchListingDetails(postID)
    if ([result.post.datePosted, result.post.description].every(Boolean)) {
      // Store only when we have data necessary data to store
      await Promise.all([
        redis.set(cacheKey, result),
        redis.set(timestampKey, now),
      ])
    }

    return Response.json({
      cached: false,
      data: result,
      nextUpdate: getNextUpdate(now),
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
