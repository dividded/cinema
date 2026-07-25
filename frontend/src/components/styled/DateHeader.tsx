import styled from '@emotion/styled'

interface DateHeaderProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

export const DateHeader = styled.h3<DateHeaderProps>`
  color: ${props => {
    if (props.isWeekend) return 'var(--weekend)';
    if (props.isMorningOnly) return 'var(--morning)';
    return 'var(--ink)';
  }};
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 600;
  font-style: normal;
  letter-spacing: 0.01em;
  margin: 0 0 0.35rem;
  padding: 0 0 0.5rem;
  border-bottom: 1px solid ${props => {
    if (props.isWeekend) return 'var(--weekend-line)';
    if (props.isMorningOnly) return 'var(--morning-line)';
    return 'rgba(20, 20, 20, 0.14)';
  }};
`
