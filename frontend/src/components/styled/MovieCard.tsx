import styled from '@emotion/styled'

interface MovieCardProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
  isOldMovie?: boolean;
}

export const MovieCard = styled.div<MovieCardProps>`
  position: relative;
  cursor: default;
  background: ${props => {
    const baseColor = props.isWeekend ? '#3d2a4d' : props.isMorningOnly ? '#3d2525' : '#1f1f23';
    if (props.isOldMovie) {
      // Full gold for old movies on regular days - toned down brightness
      if (!props.isWeekend && !props.isMorningOnly) {
        return `linear-gradient(135deg, #3d3420 0%, #4d3d25 15%, #5d4a2a 30%, #5d4a2a 50%, #5d4a2a 70%, #4d3d25 85%, #3d3420 100%)`;
      }
      // Subtle gold gradient for old movies on special days
      return `linear-gradient(to left, ${baseColor} 0%, ${baseColor} 20%, rgba(212, 184, 84, 0.12) 40%, rgba(230, 200, 101, 0.15) 60%, rgba(230, 200, 101, 0.18) 80%, rgba(212, 184, 84, 0.15) 95%, #2a2415 100%)`;
    }
    return baseColor;
  }};
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  border: ${props => {
    if (props.isOldMovie) {
      // Extra strong gold border for regular day old movies
      if (!props.isWeekend && !props.isMorningOnly) {
        return '3px solid rgba(230, 200, 101, 0.8)';
      }
      return '2px solid rgba(230, 200, 101, 0.5)';
    }
    const baseColor = props.isWeekend ? '#6d4a9f' : props.isMorningOnly ? '#5d3535' : '#2a2a2e';
    return `1px solid ${baseColor}`;
  }};
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: ${props => {
    if (props.isOldMovie) {
      // Extra strong gold glow for regular day old movies
      if (!props.isWeekend && !props.isMorningOnly) {
        return '0 2px 12px rgba(230, 200, 101, 0.4), 0 0 20px rgba(212, 184, 84, 0.3), inset 0 0 20px rgba(230, 200, 101, 0.05)';
      }
      return '0 2px 8px rgba(230, 200, 101, 0.25), 0 0 12px rgba(212, 184, 84, 0.15)';
    }
    return props.isWeekend 
      ? '0 2px 8px rgba(168, 85, 247, 0.3)' 
      : props.isMorningOnly 
      ? '0 2px 8px rgba(255, 107, 107, 0.25)' 
      : '0 2px 4px rgba(0, 0, 0, 0.25)';
  }};
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  margin-bottom: 0.75rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => {
      if (props.isOldMovie) {
        // Extra strong hover glow for regular day old movies
        if (!props.isWeekend && !props.isMorningOnly) {
          return '0 4px 16px rgba(230, 200, 101, 0.5), 0 0 24px rgba(212, 184, 84, 0.4), inset 0 0 20px rgba(230, 200, 101, 0.08)';
        }
        return '0 4px 12px rgba(230, 200, 101, 0.35), 0 0 16px rgba(212, 184, 84, 0.25)';
      }
      return props.isWeekend 
        ? '0 4px 12px rgba(168, 85, 247, 0.4)' 
        : props.isMorningOnly 
        ? '0 4px 12px rgba(255, 107, 107, 0.35)' 
        : '0 4px 8px rgba(0, 0, 0, 0.35)';
    }};
    border-color: ${props => {
      if (props.isOldMovie) {
        // Extra bright border on hover for regular day old movies
        if (!props.isWeekend && !props.isMorningOnly) {
          return 'rgba(230, 200, 101, 1)';
        }
        return 'rgba(230, 200, 101, 0.7)';
      }
      const baseColor = props.isWeekend ? '#8d5fbf' : props.isMorningOnly ? '#7d4545' : '#3a3a3e';
      return baseColor;
    }};
  }
`

export const MovieTitleText = styled.h2<{ isOldMovie: boolean }>`
  font-size: 1.15rem;
  line-height: 1.4;
  color: ${props => props.isOldMovie ? '#e6c865' : '#fff'};
  margin: 0;
  flex: 1;
  font-weight: 600;
  min-width: 0;
`

export const OriginalTitle = styled.span<{ isOldMovie?: boolean }>`
  display: block;
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.2rem;
  font-weight: 400;
`

export const MovieYear = styled.span<{ isOldMovie: boolean }>`
  font-size: 1rem;
  color: ${props => props.isOldMovie ? '#1a1a1a' : '#e0e0e0'};
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  background: ${props => props.isOldMovie ? '#e6c865' : '#3a3a3e'};
  border-radius: 5px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid ${props => props.isOldMovie ? '#d4b854' : '#4a4a4e'};
`

export const MovieTitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  flex: 1;
  min-width: 0;
`

export const MovieMetadata = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-shrink: 0;
  width: 180px;
  min-width: 180px;
`

export const LinkButton = styled.button`
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 5px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    background: rgba(168, 85, 247, 0.25);
    border-color: rgba(168, 85, 247, 0.5);
    transform: scale(1.08);
  }

  svg {
    width: 0.95rem;
    height: 0.95rem;
    color: rgba(192, 132, 252, 0.95);
  }
`