// Shared by the app and scripts/backgroundsPlugin.ts, which inlines the picker into
// index.html so the chosen image starts downloading before any JS has loaded.

export const BACKGROUND_ROTATE_MS = 60 * 1000

/** Deterministic 0..1 from a 32-bit seed (same seed → same value). Must stay self-contained. */
export function seededUnit(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Picks a stable "random" background name for the current UTC minute. */
export function pickBackground(
  names: readonly string[],
  nowMs: number = Date.now(),
): string | null {
  if (names.length === 0) return null
  const slot = Math.floor(nowMs / BACKGROUND_ROTATE_MS)
  return names[Math.floor(seededUnit(slot) * names.length)] ?? names[0]
}

/** Each background ships as AVIF with a WebP fallback. */
export function backgroundImageUrls(baseUrl: string, name: string) {
  const root = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}backgrounds/${name.split('/').map(encodeURIComponent).join('/')}`
  return { avif: `${root}.avif`, webp: `${root}.webp` }
}
