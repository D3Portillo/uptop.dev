import { getBrowser, type Browser } from "@/lib/chromium"

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

    const details = await page.evaluate(() => {
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
    const result = {
      success: true,
      postID,
      formattedId,
      post: details,
    }

    return result
  } catch (error) {
    if (browser) await browser.close()

    console.error(`Error fetching listing details for ${postID}:`, error)
    throw error
  }
}

export type TListingDetailsResponse = Awaited<
  ReturnType<typeof fetchListingDetails>
>

export async function GET(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ postID: string }>
  }
) {
  const { postID } = await params

  try {
    const result = await fetchListingDetails(postID)
    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
