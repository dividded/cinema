import { useSearch } from '@tanstack/react-router'
import { BACKGROUNDS, backgroundImageUrls, Background, BackgroundName, findBackground } from '../backgrounds'

export interface ResolvedBackground extends Background {
  name: BackgroundName
  avif: string
  webp: string
}

/**
 * The background picked (and already preloading) by the inline script in index.html.
 * With ?debugbg the picker is shown, and ?debugbg=<name> overrides the pick.
 */
export function useRotatingBackground(): { background: ResolvedBackground | null; debug: boolean } {
  const { debugbg } = useSearch({ from: '__root__' })
  const name = findBackground(debugbg) ?? findBackground(window.__CINEMA_BACKGROUND__)
  const background = name ? { name, ...BACKGROUNDS[name], ...backgroundImageUrls(import.meta.env.BASE_URL, name) } : null
  return { background, debug: debugbg !== undefined }
}
