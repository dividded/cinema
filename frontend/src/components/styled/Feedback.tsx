import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const spinnerAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const LoadingContainer = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${props => (props.$compact ? '40vh' : '100vh')};
  background: ${props => (props.$compact ? 'transparent' : 'var(--bg)')};
`

const LoadingSpinner = styled.div`
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--line-strong);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.7s linear infinite;
`

export const LoadingMessage = ({ compact }: { compact?: boolean }) => (
  <LoadingContainer $compact={compact}>
    <LoadingSpinner />
  </LoadingContainer>
)

export const ErrorMessage = styled.div`
  text-align: center;
  padding: 4rem 1.5rem;
  color: var(--morning);
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 1.35rem;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
`
