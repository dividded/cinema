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
  min-height: ${props => (props.$compact === true ? '40vh' : '100vh')};
  background: ${props => (props.$compact === true ? 'transparent' : 'var(--bg)')};
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
