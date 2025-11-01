import styled from '@emotion/styled'

export const ScreeningsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
    flex: none;
  }
`

export const ScreeningsSeparator = styled.div`
  width: 1px;
  height: 2rem;
  background: rgba(0, 0, 0, 0.3);
  margin: 0 0.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
`

export const ScreeningItem = styled.div`
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.3);
  direction: ltr;
  white-space: nowrap;
`

export const DateTime = styled.span`
  color: #a855f7;
  font-weight: 600;
`

export const Venue = styled.span`
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
`

export const MultiDateIndicator = styled.span`
  background-color: rgba(0, 0, 0, 0.3);
  color: #a855f7;
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(168, 85, 247, 0.4);
  direction: ltr;
  white-space: nowrap;
  order: -1;
  font-weight: 500;
` 