import styled from '@emotion/styled'

export const SearchContainer = styled.div`
  margin: 0 auto 2rem auto;
  max-width: 600px;
  width: 100%;
  position: relative;

  &::after {
    content: '🔍';
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
  backdrop-filter: blur(10px);

  &:focus {
    outline: none;
    border-color: #646cff;
    box-shadow: 0 0 0 4px rgba(100, 108, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
` 