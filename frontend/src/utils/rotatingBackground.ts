export const BACKGROUND_ROTATE_MS = 60 * 1000

/** Deterministic 0..1 from a 32-bit seed (same seed → same value). */
export function seededUnit(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** UTC minute bucket since epoch (Date.now() is UTC-based). */
export function backgroundSlot(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / BACKGROUND_ROTATE_MS)
}

/**
 * Picks a stable "random" image for the current UTC minute.
 * Chosen once per page load — refresh to get a new pick.
 */
export function pickBackgroundUrl(
  urls: readonly string[],
  nowMs: number = Date.now(),
): string | null {
  if (urls.length === 0) return null
  const slot = backgroundSlot(nowMs)
  const index = Math.floor(seededUnit(slot) * urls.length)
  return urls[index] ?? urls[0]
}

export function backgroundImageUrl(baseUrl: string, fileName: string): string {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${root}backgrounds/${encodeURIComponent(fileName)}`
}
