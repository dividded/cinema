import styled from '@emotion/styled'

interface DateHeaderProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

export const DateHeader = styled.h3<DateHeaderProps>`
  color: ${props => {
    if (props.isWeekend) return '#c084fc';
    if (props.isMorningOnly) return '#ff8a8a';
    return '#a855f7';
  }};
  font-size: 1.4rem;
  margin: 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => {
    if (props.isWeekend) return '#c084fc';
    if (props.isMorningOnly) return '#ff8a8a';
    return '#a855f7';
  }};
  font-weight: 600;
  text-shadow: ${props => {
    if (props.isWeekend) return '0 0 10px rgba(192, 132, 252, 0.4)';
    if (props.isMorningOnly) return '0 0 10px rgba(255, 138, 138, 0.4)';
    return 'none';
  }};
` 