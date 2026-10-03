import styled from '@emotion/styled'
import { useState } from 'react'

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

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  opacity: 0.7;
  filter: saturate(0.92) contrast(0.98);

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
  background:
    linear-gradient(
      180deg,
      rgba(230, 227, 220, 0.35) 0%,
      rgba(230, 227, 220, 0.55) 45%,
      rgba(230, 227, 220, 0.92) 82%,
      var(--bg) 100%
    );
`

interface BackgroundLayerProps {
  image: { avif: string; webp: string } | null;
}

/** Top-of-page hero only — scrolls away with the page (not fixed). */
export function BackgroundLayer({ image }: BackgroundLayerProps) {
  const [state, setState] = useState<'unknown' | 'pending' | 'loaded'>('unknown')

  if (!image) return null

  return (
    <Hero aria-hidden="true">
      <picture>
        <source srcSet={image.avif} type="image/avif" />
        <Image
          ref={(img) => {
            if (img && state === 'unknown') setState(img.complete ? 'loaded' : 'pending')
          }}
          src={image.webp}
          alt=""
          decoding="async"
          fetchPriority="high"
          onLoad={() => setState('loaded')}
          data-pending={state === 'pending' ? '' : undefined}
          data-fade={state !== 'unknown' ? '' : undefined}
        />
      </picture>
      <Wash />
    </Hero>
  )
}
