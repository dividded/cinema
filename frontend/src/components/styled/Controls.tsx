import styled from '@emotion/styled'

export const SearchContainer = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 5.5rem;
  max-width: 9.5rem;

  @media (max-width: 768px) {
    flex: 0 0 auto;
    max-width: 9rem;
  }
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
  font-size: 0.92rem;
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
  border-radius: 3px;
  /* The padding is cancelled by the margin, so the text sits where it always did and
     switching on only fills in the chip around it. */
  padding: 0.15rem 0.4rem 0.2rem;
  margin: 0 -0.4rem;
  cursor: pointer;
  flex: 0 0 auto;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: ${props => (props.$active === true ? 700 : 600)};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => (props.$active === true ? 'var(--bg-elevated)' : 'var(--ink)')};
  background: ${props => (props.$active === true ? 'var(--ink)' : 'transparent')};
  text-shadow: ${props => (props.$active === true ? 'none' : 'inherit')};
  box-shadow: inset 0 -1px 0 ${props => (props.$active === true ? 'var(--ink)' : 'rgba(26, 25, 22, 0.35)')};
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  opacity: ${props => (props.$active === true ? 1 : 0.78)};

  /* Only for a real pointer: a tap would leave the hover look on until the next tap elsewhere,
     so a filter just switched off looked different from the others. */
  @media (hover: hover) {
    &:hover {
      opacity: 1;
      box-shadow: inset 0 -1px 0 var(--ink);
    }
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 1px solid var(--ink);
    outline-offset: 3px;
  }
`
