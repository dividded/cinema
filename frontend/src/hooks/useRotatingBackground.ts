import { useMemo } from 'react'
import { backgroundImageUrls } from '../utils/rotatingBackground'

/** The background picked (and already preloading) by the inline script in index.html. */
export function useRotatingBackground() {
  return useMemo(() => {
    const name = window.__CINEMA_BACKGROUND__
    return name ? backgroundImageUrls(import.meta.env.BASE_URL, name) : null
  }, [])
}
