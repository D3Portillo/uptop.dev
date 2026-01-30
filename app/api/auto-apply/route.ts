/**
 * * Raw request example:
 * curl 'https://api.noteforms.com/forms/top-shelf-job-application-cheqot/answer' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0' \
  -H 'Accept: application/json' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Referer: https://noteforms.com/' \
  -H 'content-type: application/json' \
  -H 'Origin: https://noteforms.com' \
  -H 'Connection: keep-alive' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  --data-raw '{"084f5395-fbce-48de-81e2-ca34d396c6a0":["2eff30f9-bdff-8014-bcfa-f759dd5c23f8"],"713c5ec3-ad07-4d4c-ba06-d8ad89b0eb86":"JOB APPLICATION","3396155e-ded6-40c5-9d26-09ff591678b2":["https://api.noteforms.com/forms/assets/TALENT-PROFILE-CLEAN_a8f38ad8-d25c-4b5a-bf27-83d091082417.jpg"],"e9ec6ba9-7f0b-4fd0-b7da-9969fcb329a4":["https://api.noteforms.com/forms/assets/user_3397425_417a1064-512c-45e8-804c-7953fcc6e6d3.png"],"334bcfc2-17f0-4372-8a0a-06c302da61f4":"test@test.com","92c76303-f59e-4742-8551-a22704c504aa":"https://test.com","1a1a4462-5afb-477c-a5b0-d1709045ed34":"NO","c0545651-88f8-4f30-bfbf-34e4c3c0633e":"@test","f4afeaf4-b518-4e49-bda0-e0fe623f5c72":"https://x.com/test","2f09a216-71da-47f0-baf0-45bbbe3dbc11":["UI","UX"],"d4cc8f55-a316-4f45-97ea-67e4c0706297":"Test note","e18bafe8-c644-4e15-8ef8-1591032a5ad2":"Test Testo Testing","9df55e3a-254f-4475-af52-8c3d72dbdfb2":["bitcoin_cf8088d4-2e21-4dbc-90f9-7d9d93558031.pdf"],"completion_time":156}'
 */

export type AutoApplyPayload = Partial<{
  email: string
  jobId: string
  linkedin: string
  profileImage: string
  fullName: string
  telegram: string
  twitter: string
  skills: string[]
  notes: string
  resumeURL: string
  githubOrPortfolioURL: string
  isCryptoSavvy: boolean
}>

const NOTEFORMS_API_URL =
  "https://api.noteforms.com/forms/top-shelf-job-application-cheqot/answer"

// Field IDs from the noteforms API
const FIELD_IDS = {
  formID: "084f5395-fbce-48de-81e2-ca34d396c6a0",
  formType: "713c5ec3-ad07-4d4c-ba06-d8ad89b0eb86",
  defaultBanner: "3396155e-ded6-40c5-9d26-09ff591678b2",
  defaultAvatar: "e9ec6ba9-7f0b-4fd0-b7da-9969fcb329a4",
  email: "334bcfc2-17f0-4372-8a0a-06c302da61f4",
  linkedin: "92c76303-f59e-4742-8551-a22704c504aa",
  isCryptoSavvy: "1a1a4462-5afb-477c-a5b0-d1709045ed34",
  telegram: "c0545651-88f8-4f30-bfbf-34e4c3c0633e",
  twitter: "f4afeaf4-b518-4e49-bda0-e0fe623f5c72",
  skills: "2f09a216-71da-47f0-baf0-45bbbe3dbc11",
  notes: "d4cc8f55-a316-4f45-97ea-67e4c0706297",
  fullName: "e18bafe8-c644-4e15-8ef8-1591032a5ad2",
  resumeURL: "9df55e3a-254f-4475-af52-8c3d72dbdfb2",
  githubOrPortfolioURL: "84327978-66a6-4382-a647-234cd2232b65",
} as const

const REQUIRED_FIELDS = [
  "email",
  "linkedin",
  "resumeURL",
  "isCryptoSavvy",
  "jobId",
] satisfies (keyof AutoApplyPayload)[]

export async function POST(request: Request) {
  try {
    const payload: AutoApplyPayload = await request.json()

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter(
      (field) => typeof payload[field] === "undefined",
    )

    if (missingFields.length > 0) {
      return Response.json(
        {
          data: null,
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Build the dynamic form data based on the noteforms field structure
    const formData: Record<string, any> = {
      [FIELD_IDS.formID]: [payload.jobId], // Always use the constant form ID
      [FIELD_IDS.formType]: "JOB APPLICATION",
      [FIELD_IDS.email]: payload.email,
      [FIELD_IDS.linkedin]: payload.linkedin,
      [FIELD_IDS.notes]: "Sent using uptop.dev auto-apply feature",
      [FIELD_IDS.resumeURL]: [payload.resumeURL],
      [FIELD_IDS.defaultBanner]: [
        "https://api.noteforms.com/forms/assets/TALENT-PROFILE-CLEAN_a8f38ad8-d25c-4b5a-bf27-83d091082417.jpg",
      ],
      [FIELD_IDS.defaultAvatar]: [
        "https://api.noteforms.com/forms/assets/user_3397425_417a1064-512c-45e8-804c-7953fcc6e6d3.png",
      ],
      [FIELD_IDS.isCryptoSavvy]: payload.isCryptoSavvy ? "YES" : "NO",
      completion_time: 250, // Default
    }

    if (payload.profileImage) {
      formData[FIELD_IDS.defaultAvatar] = [payload.profileImage]
    }

    if (payload.telegram) {
      formData[FIELD_IDS.telegram] = payload.telegram
    }

    if (payload.twitter) {
      formData[FIELD_IDS.twitter] = payload.twitter
    }

    if (payload.skills && payload.skills.length > 0) {
      formData[FIELD_IDS.skills] = payload.skills
    }

    if (payload.notes) {
      formData[FIELD_IDS.notes] = payload.notes
    }

    if (payload.fullName) {
      formData[FIELD_IDS.fullName] = payload.fullName
    }

    if (payload.githubOrPortfolioURL) {
      // Sems like links/files are expected as arrays
      formData[FIELD_IDS.githubOrPortfolioURL] = [payload.githubOrPortfolioURL]
    }

    // Make the request to noteforms API
    const response = await fetch(NOTEFORMS_API_URL, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        Referer: "https://noteforms.com/",
        Origin: "https://noteforms.com",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const errorText = (await response.text()) || "Unknown error"
      throw new Error(`[API_ERROR] (${response.status}) ${errorText}`)
    }

    const result = await response.json()

    return Response.json({
      success: true,
      data: result,
      error: null,
    })
  } catch (error) {
    console.error({ error })
    return Response.json(
      {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
