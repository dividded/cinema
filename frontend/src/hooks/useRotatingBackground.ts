import { useEffect, useState } from 'react'
import {
  backgroundImageUrl,
  pickBackgroundUrl,
} from '../utils/rotatingBackground'

interface BackgroundManifest {
  files: string[]
}

function resolveUrls(files: string[]): string[] {
  const base = import.meta.env.BASE_URL
  return files.map((file) => backgroundImageUrl(base, file))
}

/** Picks once per page load from the current UTC-minute hash. No live swapping. */
export function useRotatingBackground(): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const manifestUrl = `${import.meta.env.BASE_URL}backgrounds/manifest.json`

    fetch(manifestUrl, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { files: [] }))
      .then((data: BackgroundManifest) => {
        if (cancelled) return
        const urls = resolveUrls(Array.isArray(data.files) ? data.files : [])
        setImageUrl(pickBackgroundUrl(urls))
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return imageUrl
}
