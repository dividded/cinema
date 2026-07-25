import styled from '@emotion/styled'

export const ScreeningsList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.15rem;
  flex: 0 0 auto;
  direction: ltr;
  unicode-bidi: isolate;
`

export const ScreeningsSeparator = styled.div`
  display: none;
`

export const ScreeningItem = styled.div`
  display: inline-flex;
  gap: 0.28rem;
  align-items: center;
  font-size: 0.8rem;
  direction: ltr;
  unicode-bidi: isolate;
  white-space: nowrap;
  color: var(--ink-soft);
`

export const DateTime = styled.span`
  color: var(--ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
`

export const Venue = styled.span`
  color: var(--muted);
  font-size: 0.74rem;
`

export const MultiDateIndicator = styled.span`
  color: var(--muted);
  font-size: 0.68rem;
  direction: ltr;
  unicode-bidi: isolate;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: lowercase;
`
