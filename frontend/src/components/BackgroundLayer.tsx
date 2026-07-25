import styled from '@emotion/styled'

const Hero = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: min(58vh, 460px);
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
  imageUrl: string | null;
}

/** Top-of-page hero only — scrolls away with the page (not fixed). */
export function BackgroundLayer({ imageUrl }: BackgroundLayerProps) {
  if (!imageUrl) return null

  return (
    <Hero aria-hidden="true">
      <Image src={imageUrl} alt="" decoding="async" fetchPriority="low" />
      <Wash />
    </Hero>
  )
}
