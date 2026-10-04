import styled from '@emotion/styled'
import { useState } from 'react'
import { DEFAULT_OPACITY, DEFAULT_POSITION, ResolvedBackground } from '../utils/backgroundLooks'

const Hero = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: min(78vh, 730px);
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
`

/** Soft edges for a zoomed-out image, so it melts into the paper instead of ending in a line. */
const FADE_BOTTOM = 'linear-gradient(to bottom, #000 62%, transparent)'
const FADE_SIDES = 'linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)'

function zoomStyles(scale: number, sides: boolean): string {
  if (scale >= 1) return 'width: 100%; height: 100%; margin-left: 0; mask-image: none; -webkit-mask-image: none;'
  const width = sides ? scale * 100 : 100
  const masks = sides ? `${FADE_SIDES}, ${FADE_BOTTOM}` : FADE_BOTTOM
  return `
    width: ${width}%;
    height: ${scale * 100}%;
    margin-left: ${(100 - width) / 2}%;
    -webkit-mask-image: ${masks};
    mask-image: ${masks};
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  `
}

const Image = styled.img<{
  $position: string
  $mobilePosition: string
  $scale: number
  $mobileScale: number
  $opacity: number
  $filter: string
}>`
  display: block;
  ${(p) => zoomStyles(p.$scale, true)}
  object-fit: cover;
  object-position: ${(p) => p.$position};
  opacity: ${(p) => p.$opacity};
  filter: saturate(0.92) contrast(0.98) ${(p) => p.$filter};

  @media (max-width: 768px) {
    ${(p) => zoomStyles(p.$mobileScale, false)}
    object-position: ${(p) => p.$mobilePosition};
  }

  /* Only images that arrive after first paint fade in; cached ones show instantly. */
  &[data-pending] {
    opacity: 0;
  }
  &[data-fade] {
    transition: opacity 0.25s ease-out;
  }
`

const WASH_STOPS: ReadonlyArray<[alpha: number, at: string]> = [
  [0.35, '0%'],
  [0.55, '45%'],
  [0.92, '82%'],
]

/** Strength 1 is the original wash; higher values push every stop closer to opaque. */
function washGradient(strength: number): string {
  const stops = WASH_STOPS.map(([alpha, at]) => {
    const a = Math.min(1, 1 - (1 - alpha) / strength)
    return `rgba(230, 227, 220, ${a.toFixed(3)}) ${at}`
  })
  return `linear-gradient(180deg, ${stops.join(', ')}, var(--bg) 100%)`
}

const Wash = styled.div<{ $strength: number }>`
  position: absolute;
  inset: 0;
  background: ${(p) => washGradient(p.$strength)};
`

interface BackgroundLayerProps {
  background: ResolvedBackground | null
}

/** Top-of-page hero only — scrolls away with the page (not fixed). */
export function BackgroundLayer({ background }: BackgroundLayerProps) {
  if (!background) return null
  // Keyed by name so switching backgrounds (debug picker) restarts the fade-in.
  return <HeroImage key={background.name} background={background} />
}

function HeroImage({ background }: { background: ResolvedBackground }) {
  const [state, setState] = useState<'unknown' | 'pending' | 'loaded'>('unknown')
  const { look } = background
  const position = look.position ?? DEFAULT_POSITION

  return (
    <Hero aria-hidden="true">
      <picture>
        <source srcSet={background.avif} type="image/avif" />
        <Image
          ref={(img) => {
            if (img && state === 'unknown') setState(img.complete ? 'loaded' : 'pending')
          }}
          src={background.webp}
          alt=""
          decoding="async"
          fetchPriority="high"
          onLoad={() => setState('loaded')}
          data-pending={state === 'pending' ? '' : undefined}
          data-fade={state !== 'unknown' ? '' : undefined}
          $position={position}
          $mobilePosition={look.mobilePosition ?? position}
          $scale={look.scale ?? 1}
          $mobileScale={look.mobileScale ?? 1}
          $opacity={look.opacity ?? DEFAULT_OPACITY}
          $filter={look.filter ?? ''}
        />
      </picture>
      <Wash $strength={look.wash ?? 1} />
    </Hero>
  )
}
