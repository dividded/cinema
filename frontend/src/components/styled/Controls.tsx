import styled from '@emotion/styled'

export const SearchContainer = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 5.5rem;
  max-width: 9.5rem;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.2rem 0 0.25rem;
  border: none;
  border-bottom: 1px solid rgba(26, 25, 22, 0.22);
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-bottom-color: rgba(26, 25, 22, 0.45);
  }

  &::placeholder {
    color: var(--muted);
    opacity: 0.85;
    font-weight: 400;
    letter-spacing: 0.03em;
  }
`

export const FilterRow = styled.div`
  display: contents;
`

export const FilterToggle = styled.button<{ $active?: boolean }>`
  appearance: none;
  border: none;
  background: transparent;
  padding: 0.15rem 0 0.2rem;
  margin: 0;
  cursor: pointer;
  flex: 0 0 auto;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: ${props => (props.$active ? 700 : 600)};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
  border-bottom: 1px solid ${props => (
    props.$active ? 'var(--ink)' : 'rgba(26, 25, 22, 0.35)'
  )};
  transition: color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  opacity: ${props => (props.$active ? 1 : 0.78)};

  &:hover {
    opacity: 1;
    border-bottom-color: var(--ink);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 3px;
  }
`
