// The film stills shown at the top of every page. Shared with scripts/backgroundsPlugin.ts
// (which inlines the rotation into index.html), so this file must not import app code.

/** How a still is framed in the hero. */
export interface BackgroundLook {
  /** CSS object-position on wide screens. */
  position?: string
  /** CSS object-position on phones, where only a narrow slice of the still is visible. */
  mobilePosition?: string
  /**
   * Zooms out on wide screens: the image box shrinks to this fraction of the hero (centered,
   * with soft edges), showing the whole frame smaller instead of filling the width.
   */
  scale?: number
  /**
   * Zooms out on phones: the image box is this fraction of the hero's height (full width, soft
   * bottom edge), so a wider part of the still fits across the screen.
   */
  mobileScale?: number
}

export interface Background {
  film: string
  director: string
  year: number
  look: BackgroundLook
}

/** File names in public/backgrounds (each has an .avif and a .webp). */
export const BACKGROUND_NAMES = [
  '8-1-2',
  'all-that-jazz',
  'blue-velvet',
  'cria',
  'days-of-heaven',
  'elevator-to-the-gallows',
  'eyes-wide-shut',
  'la-notte',
  'mulholland-drive',
  'persona',
  'playtime',
  'stalker',
  'whiplash',
] as const

export type BackgroundName = (typeof BACKGROUND_NAMES)[number]

export const BACKGROUNDS: Record<BackgroundName, Background> = {
  '8-1-2': { film: '8½', director: 'Federico Fellini', year: 1963, look: { mobilePosition: '36% top' } },
  'all-that-jazz': { film: 'All That Jazz', director: 'Bob Fosse', year: 1979, look: { mobilePosition: '70% top' } },
  // Zoomed out on phones so both faces show.
  'blue-velvet': {
    film: 'Blue Velvet',
    director: 'David Lynch',
    year: 1986,
    look: { mobilePosition: '30% top', mobileScale: 0.62 },
  },
  cria: { film: 'Cría Cuervos', director: 'Carlos Saura', year: 1976, look: { mobilePosition: '20% top' } },
  'days-of-heaven': { film: 'Days of Heaven', director: 'Terrence Malick', year: 1978, look: { mobilePosition: '23% top' } },
  // Zoomed out on phones: more of the newspaper, and her face sits higher.
  'elevator-to-the-gallows': {
    film: 'Elevator to the Gallows',
    director: 'Louis Malle',
    year: 1958,
    look: { mobilePosition: '74% top', mobileScale: 0.72 },
  },
  // Zoomed out: a smaller mask with soft edges.
  'eyes-wide-shut': {
    film: 'Eyes Wide Shut',
    director: 'Stanley Kubrick',
    year: 1999,
    look: { scale: 0.8, mobilePosition: '32% top', mobileScale: 0.7 },
  },
  'la-notte': { film: 'La Notte', director: 'Michelangelo Antonioni', year: 1961, look: { mobilePosition: '62% top' } },
  'mulholland-drive': { film: 'Mulholland Drive', director: 'David Lynch', year: 2001, look: { mobilePosition: '35% top' } },
  persona: { film: 'Persona', director: 'Ingmar Bergman', year: 1966, look: {} },
  // Zoomed out on phones: the man, the building and the sphere.
  playtime: {
    film: 'Playtime',
    director: 'Jacques Tati',
    year: 1967,
    look: { mobilePosition: '58% top', mobileScale: 0.7 },
  },
  stalker: { film: 'Stalker', director: 'Andrei Tarkovsky', year: 1979, look: { mobilePosition: '40% top' } },
  whiplash: { film: 'Whiplash', director: 'Damien Chazelle', year: 2014, look: {} },
}

/** The background with this name, if there is one. */
export const findBackground = (name: string | undefined): BackgroundName | undefined =>
  BACKGROUND_NAMES.find((candidate) => candidate === name)

export const BACKGROUND_ROTATE_MS = 60 * 1000

/** Deterministic 0..1 from a 32-bit seed (same seed → same value). Must stay self-contained. */
export function seededUnit(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Each background ships as AVIF with a WebP fallback. */
export function backgroundImageUrls(baseUrl: string, name: BackgroundName): { avif: string; webp: string } {
  const root = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}backgrounds/${encodeURIComponent(name)}`
  return { avif: `${root}.avif`, webp: `${root}.webp` }
}
