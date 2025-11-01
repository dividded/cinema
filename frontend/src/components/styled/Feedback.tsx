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

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #a855f7;
  border-radius: 50%;
  animation: ${spinnerAnimation} 0.8s linear infinite;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export const LoadingMessage = () => (
  <LoadingContainer>
    <LoadingSpinner />
  </LoadingContainer>
)

export const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ff6b6b;
  font-size: 1.2rem;
` 