import { backgroundImageUrls } from './rotatingBackground'

/** How a background is framed. Regular backgrounds use BACKGROUND_LOOKS, or the defaults. */
export interface BackgroundLook {
  /** Image name in public/backgrounds, without extension. */
  file: string
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
  /** Image opacity under the wash (default 0.7). */
  opacity?: number
  /** Extra CSS filter applied to the image. */
  filter?: string
  /** Wash strength: 1 is the default, higher pushes the image further into the paper color. */
  wash?: number
  /** What a test variant changes, shown in the ?debugbg picker. */
  note?: string
}

export const DEFAULT_POSITION = 'center top'
export const DEFAULT_OPACITY = 0.7

/** Framing for backgrounds in the rotation, mostly to keep the subject in view on phones. */
export const BACKGROUND_LOOKS: Record<string, Omit<BackgroundLook, 'file'>> = {
  '8-1-2': { mobilePosition: '36% top' },
  'all-that-jazz': { mobilePosition: '70% top' },
  cria: { mobilePosition: '20% top' },
  'days-of-heaven': { mobilePosition: '23% top' },
  // Zoomed out on phones: more of the newspaper, and her face sits higher.
  'elevator-to-the-gallows': { mobilePosition: '74% top', mobileScale: 0.72 },
  'mulholland-drive': { mobilePosition: '35% top' },
  stalker: { mobilePosition: '40% top' },
  // Zoomed out on phones so both faces show.
  'blue-velvet': { mobilePosition: '30% top', mobileScale: 0.62 },
  // Zoomed out: a smaller mask with soft edges, same colors.
  'eyes-wide-shut': { scale: 0.8, mobilePosition: '32% top', mobileScale: 0.7 },
}

/**
 * Test-only looks, listed after the live ones in the ?debugbg picker. A <film>-old variant is
 * the framing a live background had before its last change, for comparison.
 */
export const DEBUG_BACKGROUND_VARIANTS: Record<string, BackgroundLook> = {
  'playtime-wide': { file: 'playtime', mobilePosition: '58% top', mobileScale: 0.7, note: 'Zoomed out on phones: the man, the building and the sphere' },
  '812-old': { file: '8-1-2', note: 'Before' },
  'jazz-old': { file: 'all-that-jazz', note: 'Before' },
  'cria-old': { file: 'cria', note: 'Before' },
  'heaven-old': { file: 'days-of-heaven', note: 'Before' },
  'gallows-old': { file: 'elevator-to-the-gallows', note: 'Before' },
  'mulho-old': { file: 'mulholland-drive', note: 'Before' },
  'stalker-old': { file: 'stalker', note: 'Before' },
  'velvet-old': { file: 'blue-velvet', note: 'Before' },
  'ews-old': { file: 'eyes-wide-shut', note: 'Before' },
}

export interface ResolvedBackground {
  name: string
  look: BackgroundLook
  avif: string
  webp: string
}

export function resolveBackground(baseUrl: string, name: string): ResolvedBackground {
  const look = DEBUG_BACKGROUND_VARIANTS[name] ?? { file: name, ...BACKGROUND_LOOKS[name] }
  return { name, look, ...backgroundImageUrls(baseUrl, look.file) }
}
