import styled from '@emotion/styled'

export const Container = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  color: var(--ink);
  font-size: 1rem;
  isolation: isolate;
`

export const Header = styled.header`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  margin: 0 auto 1.75rem;
  /* Sit a bit lower in the existing hero fade — no extra veil/glow */
  padding: 2.75rem 1.25rem 1.15rem;
  max-width: 820px;
  text-align: left;
  border-bottom: 1px solid var(--line);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 2.1rem 1rem 1rem;
    margin-bottom: 1.4rem;
    gap: 0.65rem;
  }
`

export const Title = styled.h1`
  margin: 0;
  flex: 0 1 auto;
  min-width: 0;
  font-family: 'Caveat', 'Segoe Print', cursive;
  font-style: normal;
  font-weight: 600;
  font-size: clamp(2.6rem, 7.5vw, 3.8rem);
  line-height: 0.95;
  letter-spacing: 0.01em;
  color: #c4a24a;
  opacity: 1;
  transform: rotate(-1.2deg);
  transform-origin: left center;

  @media (max-width: 768px) {
    font-size: clamp(2.3rem, 10vw, 3rem);
    align-self: flex-start;
  }
`

export const TitleLetter = styled.span<{ $rotate: number; $y: number; $scale?: number }>`
  display: inline-block;
  transform:
    rotate(${props => props.$rotate}deg)
    translateY(${props => props.$y}px)
    scale(${props => props.$scale ?? 1});
  transform-origin: center bottom;
`

export const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.85rem 1.25rem;
  flex: 1 1 14rem;
  min-width: 12rem;
  max-width: 26rem;
  margin: 0;

  @media (max-width: 768px) {
    max-width: none;
    width: 100%;
    justify-content: space-between;
  }
`

export const MovieList = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  padding: 0 1.25rem 3.5rem;
  max-width: 820px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0 1rem 2.75rem;
    gap: 1.85rem;
  }
`

export const DateSection = styled.div`
  margin: 0;
  display: flex;
  flex-direction: column;
`
