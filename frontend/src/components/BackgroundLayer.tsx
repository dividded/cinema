import styled from '@emotion/styled'
import { useState } from 'react'
import { ResolvedBackground } from '../hooks/useRotatingBackground'

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

const Image = styled.img<{ $position: string; $mobilePosition: string; $scale: number; $mobileScale: number }>`
  display: block;
  ${(p) => zoomStyles(p.$scale, true)}
  object-fit: cover;
  object-position: ${(p) => p.$position};
  opacity: 0.7;
  filter: saturate(0.92) contrast(0.98);

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

const Wash = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(230, 227, 220, 0.35) 0%,
    rgba(230, 227, 220, 0.55) 45%,
    rgba(230, 227, 220, 0.92) 82%,
    var(--bg) 100%
  );
`

/** Top-of-page hero only — scrolls away with the page (not fixed). */
export function BackgroundLayer({ background }: { background: ResolvedBackground | null }) {
  if (!background) return null
  // Keyed by name so switching backgrounds (debug picker) restarts the fade-in.
  return <HeroImage key={background.name} background={background} />
}

function HeroImage({ background }: { background: ResolvedBackground }) {
  const [state, setState] = useState<'unknown' | 'pending' | 'loaded'>('unknown')
  const { look } = background
  const position = look.position ?? 'center top'

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
          onLoad={() => {
            setState('loaded')
          }}
          data-pending={state === 'pending' ? '' : undefined}
          data-fade={state !== 'unknown' ? '' : undefined}
          $position={position}
          $mobilePosition={look.mobilePosition ?? position}
          $scale={look.scale ?? 1}
          $mobileScale={look.mobileScale ?? 1}
        />
      </picture>
      <Wash />
    </Hero>
  )
}
