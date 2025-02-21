import styled from '@emotion/styled'

interface DateHeaderProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

export const DateHeader = styled.h3<DateHeaderProps>`
  color: ${props => {
    if (props.isWeekend) return '#ff7b00';
    if (props.isMorningOnly) return '#ff6b6b';
    return '#646cff';
  }};
  font-size: 1.4rem;
  margin: 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${props => {
    if (props.isWeekend) return '#ff7b00';
    if (props.isMorningOnly) return '#ff6b6b';
    return '#646cff';
  }};
` 