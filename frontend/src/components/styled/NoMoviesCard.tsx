import styled from '@emotion/styled'

interface NoMoviesCardProps {
  isWeekend?: boolean;
}

export const NoMoviesCard = styled.div<NoMoviesCardProps>`
  position: relative;
  background: transparent;
  border-radius: 0;
  padding: 0.95rem 0.15rem 0.95rem 0.7rem;
  border: none;
  border-left: 2px solid ${props => (
    props.isWeekend === true ? 'var(--weekend)' : 'transparent'
  )};
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: none;
  margin: 0;
  font-style: italic;
  color: ${props => (props.isWeekend === true ? 'var(--weekend)' : 'var(--muted)')};
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-size: 1.05rem;
  text-align: left;
  min-height: 2.25rem;

  &::after {
    content: '';
    position: absolute;
    left: 0.7rem;
    right: 18%;
    bottom: 0;
    height: 1px;
    background: rgba(20, 20, 20, 0.12);
    pointer-events: none;
  }
`
