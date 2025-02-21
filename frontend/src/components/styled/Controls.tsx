import styled from '@emotion/styled'

export const SearchContainer = styled.div`
  margin: 0 auto 2rem;
  max-width: 600px;
  width: 100%;
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: center;

  &::after {
    content: '🔍';
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    pointer-events: none;
  }
`

export const SearchInput = styled.input`
  flex: 1;
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

export const FilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
  user-select: none;

  &:hover {
    color: #646cff;
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    border-radius: 3px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    appearance: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:checked {
      background: #646cff;
      border-color: #646cff;

      &::after {
        content: '✓';
        position: absolute;
        color: #000;
        font-size: 0.7rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

    &:hover {
      border-color: #646cff;
    }
  }
` 