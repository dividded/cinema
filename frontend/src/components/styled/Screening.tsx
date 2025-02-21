import styled from '@emotion/styled'

export const ScreeningsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`

export const ScreeningItem = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  direction: ltr;
`

export const DateTime = styled.span`
  color: #646cff;
`

export const Venue = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`

export const MultiDateIndicator = styled.span`
  background-color: rgba(255, 255, 255, 0.1);
  color: #646cff;
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(100, 108, 255, 0.3);
  direction: ltr;
  white-space: nowrap;
  order: -1;
` 