import styled from '@emotion/styled'
import { useEffect, useRef, useState } from 'react'
import { allBackgroundNames } from '../hooks/useRotatingBackground'
import { setSearch } from '../router'
import { DEBUG_BACKGROUND_VARIANTS, resolveBackground } from '../utils/backgroundLooks'

// Only loaded with ?debugbg. A compact bar pinned to the bottom so the hero stays visible
// while flipping through backgrounds, on phones as well as desktops.

const Bar = styled.div`
  position: fixed;
  left: 50%;
  bottom: max(0.5rem, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 50;
  width: min(calc(100vw - 1rem), 760px);
  background: rgba(26, 25, 22, 0.88);
  color: #f3f1eb;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  font-size: 0.8rem;
  overflow: hidden;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.4rem 0.35rem 0.75rem;
`

const Label = styled.span`
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.6;
  font-size: 0.7rem;
`

const Current = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

const IconButton = styled.button`
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.6rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const Strip = styled.div`
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding: 0.1rem 0.6rem 0.6rem;
  scrollbar-width: thin;
`

const Divider = styled.span`
  flex: 0 0 auto;
  align-self: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.55;
`

const Thumb = styled.button<{ $active: boolean }>`
  appearance: none;
  flex: 0 0 auto;
  width: 6.4rem;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  scroll-snap-align: center;
  text-align: left;
  opacity: ${(p) => (p.$active ? 1 : 0.78)};

  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 6px;
    outline: 2px solid ${(p) => (p.$active ? '#d4af37' : 'transparent')};
    outline-offset: 1px;
    background: #333;
  }

  span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.68rem;
    font-weight: ${(p) => (p.$active ? 700 : 500)};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const Pill = styled.button`
  position: fixed;
  right: 0.75rem;
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  z-index: 50;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  background: rgba(26, 25, 22, 0.85);
  color: #f3f1eb;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  max-width: calc(100vw - 1.5rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export default function BackgroundDebugPanel({ current }: { current: string | null }) {
  const names = allBackgroundNames()
  const variantStart = names.findIndex((name) => name in DEBUG_BACKGROUND_VARIANTS)
  const [open, setOpen] = useState(true)
  const stripRef = useRef<HTMLDivElement>(null)
  const index = current ? names.indexOf(current) : -1

  const pick = (name: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('debugbg', name)
    setSearch(params)
  }
  const step = (delta: number) => pick(names[(Math.max(index, 0) + delta + names.length) % names.length])

  useEffect(() => {
    if (!open) return
    stripRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [current, open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) {
    return (
      <Pill type="button" onClick={() => setOpen(true)} aria-label="Open background picker">
        BG · {current ?? 'none'}
      </Pill>
    )
  }

  return (
    <Bar role="region" aria-label="Background picker">
      <Row>
        <Label>BG</Label>
        <Current>
          {current ?? 'none'}
          {index >= 0 && <span style={{ opacity: 0.55, fontWeight: 400 }}> · {index + 1}/{names.length}</span>}
        </Current>
        <IconButton type="button" onClick={() => step(-1)} aria-label="Previous background">‹</IconButton>
        <IconButton type="button" onClick={() => step(1)} aria-label="Next background">›</IconButton>
        <IconButton type="button" onClick={() => setOpen(false)} aria-label="Hide background picker">▾</IconButton>
      </Row>
      <Strip ref={stripRef}>
        {names.map((name, i) => {
          const { webp, look } = resolveBackground(import.meta.env.BASE_URL, name)
          return [
            i === variantStart && <Divider key="variants">variants</Divider>,
            <Thumb key={name} type="button" $active={name === current} aria-pressed={name === current} onClick={() => pick(name)} title={name}>
              <img
                src={webp}
                alt=""
                loading="lazy"
                style={{
                  objectPosition: look.mobilePosition ?? look.position,
                  transform: look.flip ? 'scaleX(-1)' : undefined,
                  filter: look.filter,
                }}
              />
              <span>{name}</span>
            </Thumb>,
          ]
        })}
      </Strip>
    </Bar>
  )
}
