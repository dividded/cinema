import styled from '@emotion/styled'

interface NoMoviesCardProps {
  isWeekend?: boolean;
}

export const NoMoviesCard = styled.div<NoMoviesCardProps>`
  position: relative;
  background: ${props => props.isWeekend ? '#2a1f3a' : '#1a1a1f'};
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  border: 1px solid ${props => props.isWeekend ? '#4a2f5a' : '#2a2a2e'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 0.75rem;
  opacity: 0.8;
  font-style: italic;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
  min-height: 2.5rem;
`;

