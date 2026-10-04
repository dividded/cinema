import { backgroundImageUrls } from './rotatingBackground'

/**
 * How a background is shown. Regular backgrounds use the defaults; the debug-only variants
 * (see DEBUG_BACKGROUND_VARIANTS) try other crops, focal points and washes for the same still.
 */
export interface BackgroundLook {
  /** Image name in public/backgrounds (variants/ for re-cropped files), without extension. */
  file: string
  /** CSS object-position on wide screens. */
  position?: string
  /** CSS object-position on phones, where only a narrow slice of the still is visible. */
  mobilePosition?: string
  /** Image opacity under the wash (default 0.7). */
  opacity?: number
  /** Extra CSS filter applied to the image. */
  filter?: string
  /** Wash strength: 1 is the default, higher pushes the image further into the paper color. */
  wash?: number
  /** Mirror the image horizontally (moves an off-center subject to the other side). */
  flip?: boolean
}

export const DEFAULT_POSITION = 'center top'
export const DEFAULT_OPACITY = 0.7

// Lifts a dark still so the header text (nav, search) stays readable over it. Lowering the
// contrast is what raises near-black areas; brightness alone leaves them dark.
const LIFT = 'contrast(0.62) brightness(1.4)'

/**
 * Debug-only looks, shown in the ?debugbg picker after the regular backgrounds. Names are
 * <film>-<fix>:  -m  re-centers the subject on phones (only the middle third shows there);
 * -lift  brightens a dark still for text contrast;  -flip  mirrors it;  -r  a crop that
 * moves the subject right, out from behind the list on wide screens.
 */
export const DEBUG_BACKGROUND_VARIANTS: Record<string, BackgroundLook> = {
  '812-m': { file: '8-1-2', mobilePosition: '36% top' },
  'jazz-m': { file: 'all-that-jazz', mobilePosition: '84% top' },
  'jazz-calm': { file: 'all-that-jazz', mobilePosition: '84% top', filter: 'saturate(0.55)', wash: 1.15 },
  'velvet-lift': { file: 'blue-velvet', mobilePosition: '32% top', filter: 'contrast(0.55) brightness(1.55)', wash: 1.25 },
  'velvet-mono': { file: 'blue-velvet', mobilePosition: '32% top', filter: 'grayscale(1) contrast(0.6) brightness(1.6)', wash: 1.2 },
  'cria-m': { file: 'cria', mobilePosition: '20% top' },
  'heaven-m': { file: 'days-of-heaven', mobilePosition: '23% top' },
  'gallows-m': { file: 'elevator-to-the-gallows', mobilePosition: '74% top' },
  'ews-lift': { file: 'eyes-wide-shut', mobilePosition: '30% top', filter: LIFT, wash: 1.3 },
  'ews-flip': { file: 'eyes-wide-shut', flip: true, mobilePosition: '30% top', filter: LIFT, wash: 1.3 },
  'notte-lift': { file: 'la-notte', filter: LIFT, wash: 1.2 },
  'mulho-lift': { file: 'mulholland-drive', mobilePosition: '58% top', filter: 'contrast(0.75) brightness(1.3)', wash: 1.2 },
  'persona-r': { file: 'variants/persona-r', mobilePosition: '84% top' },
  'playtime-m': { file: 'playtime', mobilePosition: '64% top' },
  'spirit-m': { file: 'spirit-of-the-beehive', mobilePosition: '57% top' },
  'whip-lift': { file: 'whiplash', filter: LIFT, wash: 1.2 },
}

export interface ResolvedBackground {
  name: string
  look: BackgroundLook
  avif: string
  webp: string
}

export function resolveBackground(baseUrl: string, name: string): ResolvedBackground {
  const look = DEBUG_BACKGROUND_VARIANTS[name] ?? { file: name }
  return { name, look, ...backgroundImageUrls(baseUrl, look.file) }
}
