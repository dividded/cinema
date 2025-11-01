import styled from '@emotion/styled'

export const SearchContainer = styled.div`
  margin: 0;
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
    border-color: #a855f7;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
    background-color: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

export const FilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
  user-select: none;
  margin-top: -0.75rem;
  margin-bottom: 0;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    color: #a855f7;
    background-color: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.3);
  }

  input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 4px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    appearance: none;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
    flex-shrink: 0;

    &:checked {
      background: #a855f7;
      border-color: #a855f7;

      &::after {
        content: '✓';
        position: absolute;
        color: #000;
        font-size: 0.85rem;
        font-weight: bold;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }

    &:hover {
      border-color: #a855f7;
    }
  }
` 