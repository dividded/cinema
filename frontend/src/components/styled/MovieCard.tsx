import styled from '@emotion/styled'
import { Theme } from '@emotion/react'

interface MovieCardProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
  isOldMovie?: boolean;
}

interface MovieTitleTextProps {
  isOldMovie?: boolean;
}

interface MovieYearProps {
  isOldMovie?: boolean;
}

export const MovieImagePreview = styled.div`
  position: absolute;
  top: 50%;
  right: -420px;
  transform: translateY(-50%);
  display: none;
  width: 400px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
  
  img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
  }
`

export const MovieCard = styled.div<MovieCardProps>`
  position: relative;
  cursor: pointer;
  background: ${props => {
    const baseColor = props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#1f1515' : '#1a1a1a';
    return props.isOldMovie 
      ? `linear-gradient(to right, ${baseColor}, ${baseColor} 97%, #1f1a0d)`
      : baseColor;
  }};
  border-radius: 6px;
  padding: 0.75rem;
  transition: transform 0.2s;
  border: 1px solid ${props => {
    const baseColor = props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#3d1a1a' : '#333';
    return props.isOldMovie 
      ? `${baseColor} ${props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#3d1a1a' : '#3d2e0d'}`
      : baseColor;
  }};
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateX(-4px);
    border-color: ${props => {
      const baseColor = props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#ff6b6b' : '#646cff';
      return props.isOldMovie 
        ? `${baseColor} #ffd700`
        : baseColor;
    }};
    
    .movie-preview {
      display: block;
    }
  }
`

export const MovieTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`

export const MovieTitleText = styled.span<MovieTitleTextProps>`
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  flex-direction: row-reverse;
  gap: 1rem;
  align-items: baseline;
  color: ${props => props.isOldMovie ? '#ffd700' : 'inherit'};
`

export const OriginalTitle = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9em;
  font-weight: 300;
  
  &::after {
    content: '/';
    margin-left: 1rem;
    opacity: 0.3;
  }
`

export const MovieYear = styled.span<MovieYearProps>`
  color: ${props => props.isOldMovie ? '#ffd700' : 'rgba(255, 255, 255, 0.75)'};
  font-size: 0.85rem;
  font-weight: 300;
  flex-shrink: 0;
  direction: ltr;
  
  &::before {
    content: '|';
    margin: 0 0.75rem;
    opacity: 0.4;
    color: #646cff;
  }
` 