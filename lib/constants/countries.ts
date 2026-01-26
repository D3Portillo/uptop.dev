export const CRYPTO_JOB_LOCATIONS = {
  ANYWHERE: { emoji: "🪐", name: "Anywhere" },
  "UNITED STATES": { emoji: "🇺🇸", name: "United States" },
  CANADA: { emoji: "🇨🇦", name: "Canada" },
  EUROPE: { emoji: "🇪🇺", name: "Europe" },
  APAC: { emoji: "🌏", name: "APAC" },
  ARGENTINA: { emoji: "🇦🇷", name: "Argentina" },
  COLOMBIA: { emoji: "🇨🇴", name: "Colombia" },
  CHILE: { emoji: "🇨🇱", name: "Chile" },
  LATAM: { emoji: "🥑", name: "LATAM" },
  "NEW YORK": { emoji: "🗽", name: "New York" },
  "SAN FRANCISCO": { emoji: "🌉", name: "San Francisco" },
  MIAMI: { emoji: "🏖️", name: "Miami" },
  CHICAGO: { emoji: "🏙️", name: "Chicago" },
  LONDON: { emoji: "🇬🇧", name: "London" },
  SINGAPORE: { emoji: "🇸🇬", name: "Singapore" },
  "HONG KONG": { emoji: "🇭🇰", name: "Hong Kong" },
  DUBAI: { emoji: "🇦🇪", name: "Dubai" },
  TORONTO: { emoji: "🇨🇦", name: "Toronto" },
  BERLIN: { emoji: "🇩🇪", name: "Berlin" },
  KOREA: { emoji: "🇰🇷", name: "Korea" },
  JAPAN: { emoji: "🇯🇵", name: "Japan" },
} as const

export const LOCATION_KEYS = Object.keys(CRYPTO_JOB_LOCATIONS) as LocationKey[]

export const LOCATION_ANYWHERE = "ANYWHERE" as const
export const GEOGRAPHIC_REGIONS = [
  CRYPTO_JOB_LOCATIONS.APAC,
  CRYPTO_JOB_LOCATIONS.LATAM,
] as const

export type LocationKey = keyof typeof CRYPTO_JOB_LOCATIONS
