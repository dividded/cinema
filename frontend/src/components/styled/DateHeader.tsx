import styled from '@emotion/styled'

interface DateHeaderProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

export const DateHeader = styled.h3<DateHeaderProps>`
  color: ${props => {
    if (props.isWeekend === true) return 'var(--weekend)';
    if (props.isMorningOnly === true) return 'var(--morning)';
    return 'var(--ink)';
  }};
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  font-style: normal;
  letter-spacing: 0.02em;
  margin: 0 0 0.35rem;
  padding: 0 0 0.5rem;
  border-bottom: 1px solid ${props => {
    if (props.isWeekend === true) return 'var(--weekend-line)';
    if (props.isMorningOnly === true) return 'var(--morning-line)';
    return 'rgba(20, 20, 20, 0.14)';
  }};
`
