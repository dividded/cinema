import styled from '@emotion/styled'

interface MovieCardProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
  isOldMovie?: boolean;
}

function rowAccent(props: MovieCardProps): string {
  if (props.isOldMovie) return 'var(--classic-line)'
  if (props.isWeekend) return 'var(--weekend)'
  if (props.isMorningOnly) return 'var(--morning)'
  return 'transparent'
}

export const MovieCard = styled.div<MovieCardProps>`
  position: relative;
  cursor: default;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0.8rem 0.1rem 0.8rem 0.65rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  border-left: 2px solid ${rowAccent};

  &::after {
    content: '';
    position: absolute;
    left: 0.65rem;
    right: 22%;
    bottom: 0;
    height: 1px;
    background: rgba(20, 20, 20, 0.1);
    pointer-events: none;
  }

  .desktop-layout {
    @media (max-width: 768px) {
      display: none !important;
    }
  }

  .mobile-layout {
    display: none !important;

    @media (max-width: 768px) {
      display: flex !important;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.45rem;
    padding: 0.8rem 0.05rem 0.8rem 0.6rem;

    &::after {
      right: 10%;
    }
  }

  &:hover {
    background: rgba(20, 20, 20, 0.015);
  }

  &:last-child::after {
    display: none;
  }
`

export const MovieTitleText = styled('h2', {
  shouldForwardProp: (prop) => prop !== 'isOldMovie',
})<{ isOldMovie: boolean }>`
  font-size: 1.02rem;
  line-height: 1.35;
  color: ${props => (props.isOldMovie ? 'var(--classic-ink)' : 'var(--ink)')};
  margin: 0;
  width: 100%;
  font-weight: ${props => (props.isOldMovie ? 700 : 600)};
  letter-spacing: -0.01em;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-align: start;
  unicode-bidi: isolate;
  overflow-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }
`

export const OriginalTitle = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isOldMovie',
})<{ isOldMovie?: boolean }>`
  display: block;
  font-size: 0.8rem;
  color: ${props => (props.isOldMovie ? '#6e5a14' : 'var(--muted)')};
  margin-top: 0.15rem;
  font-weight: 400;
  text-align: start;
  unicode-bidi: isolate;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const MovieYear = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isOldMovie' && prop !== 'isUnknown',
})<{ isOldMovie: boolean; isUnknown?: boolean }>`
  flex: 0 0 2.85rem;
  width: 2.85rem;
  margin-left: 0.35rem;
  text-align: right;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.92rem;
  line-height: 1.2;
  color: ${props => {
    if (props.isUnknown) return 'var(--muted)'
    if (props.isOldMovie) return 'var(--classic)'
    return 'var(--ink-soft)'
  }};
  font-weight: ${props => (props.isOldMovie && !props.isUnknown ? 700 : 600)};
  letter-spacing: 0.01em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  opacity: ${props => (props.isUnknown ? 0.65 : 1)};
`

export const MovieDuration = styled.span`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

export const MovieTitleContainer = styled.div`
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-align: start;

  &.mobile-layout {
    @media (max-width: 768px) {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem 0.6rem;
      overflow: visible;
      flex: none;
    }
  }
`

export const MovieTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  width: 100%;

  &.mobile-layout {
    @media (max-width: 768px) {
      width: 100%;
    }
  }
`

export const MovieMetadata = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex: 0 0 auto;
  direction: ltr;
  unicode-bidi: isolate;
`

export const MetaSpacer = styled.span`
  display: block;
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
`

export const LinkButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 0;
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s ease;
  padding: 0;
  flex-shrink: 0;
  opacity: 0.4;

  &:hover {
    opacity: 1;
    background: transparent;
  }

  svg {
    width: 0.72rem;
    height: 0.72rem;
    color: var(--ink);
  }
`
