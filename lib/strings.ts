/**
 * Calculate Jaro-Winkler distance between two strings
 * Returns a value between 0 and 1, where 1 is an exact match
 */
export function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroDistance(s1, s2)

  // Find common prefix up to 4 characters
  let prefixLength = 0
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) {
      prefixLength++
    } else break
  }

  const p = 0.1 // Standard scaling factor
  return jaro + prefixLength * p * (1 - jaro)
}

function jaroDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches = new Array(s1.length).fill(false)
  const s2Matches = new Array(s2.length).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, s2.length)

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  // Count transpositions
  let k = 0
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3.0
  )
}

/**
 * Find the best match for a string from a list of candidates
 * Returns the best matching candidate if similarity is above threshold, otherwise null
 */
export function findBestMatch(
  input: string,
  candidates: string[],
  threshold = 0.85
): string | null {
  let bestMatch: string | null = null
  let bestScore = 0

  const normalizedInput = input.toUpperCase()

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toUpperCase()
    const score = jaroWinkler(normalizedInput, normalizedCandidate)

    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = candidate
    }
  }

  return bestMatch
}
