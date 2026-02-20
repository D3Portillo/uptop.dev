import type { AutoApplyPayload } from "@/app/api/auto-apply/route"

export const AUTO_APPLY_REQUIRED_FIELDS = [
  "email",
  "linkedin",
  "resumeURL",
  "isCryptoSavvy",
  "jobId",
] satisfies (keyof AutoApplyPayload)[]

export const isRequiredFieldsPresent = (
  payload: Pick<AutoApplyPayload, (typeof AUTO_APPLY_REQUIRED_FIELDS)[number]>,
) => {
  // Validate required fields
  const missingFields = AUTO_APPLY_REQUIRED_FIELDS.filter(
    (field) => typeof payload[field] === "undefined",
  )

  return missingFields.length > 0
}
