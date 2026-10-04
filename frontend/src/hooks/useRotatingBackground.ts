import { useMemo } from 'react'
import { useLocation } from '../router'
import { DEBUG_BACKGROUND_VARIANTS, resolveBackground } from '../utils/backgroundLooks'

/** Every background the ?debugbg picker can show: the rotation, then the debug variants. */
export function allBackgroundNames(): string[] {
  return [...(window.__CINEMA_BACKGROUNDS__ ?? []), ...Object.keys(DEBUG_BACKGROUND_VARIANTS)]
}

/**
 * The background picked (and already preloading) by the inline script in index.html.
 * With ?debugbg the picker is shown, and ?debugbg=<name> overrides the pick.
 */
export function useRotatingBackground() {
  const { search } = useLocation()
  const debugValue = search.get('debugbg')
  const debug = debugValue !== null

  const background = useMemo(() => {
    const wanted = debugValue && allBackgroundNames().includes(debugValue) ? debugValue : null
    const name = wanted ?? window.__CINEMA_BACKGROUND__
    return name ? resolveBackground(import.meta.env.BASE_URL, name) : null
  }, [debugValue])

  return { background, debug }
}
