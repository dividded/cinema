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
  position: relative;
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
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
  padding: 1rem;
  border: 1px solid ${props => {
    const baseColor = props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#3d1a1a' : '#333';
    return props.isOldMovie 
      ? `${baseColor} ${props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#3d1a1a' : '#3d2e0d'}`
      : baseColor;
  }};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

export const MovieTitleText = styled.h2<{ isOldMovie: boolean }>`
  font-size: 1.5rem;
  line-height: 1.3;
  color: ${props => props.isOldMovie ? '#ffd700' : '#fff'};
  margin: 0;
  flex: 1;
`

export const OriginalTitle = styled.span`
  display: block;
  font-size: 1.2rem;
  color: #999;
  margin-top: 0.3rem;
`

export const MovieYear = styled.span<{ isOldMovie: boolean }>`
  font-size: 1.2rem;
  color: ${props => props.isOldMovie ? '#000' : '#fff'};
  flex-shrink: 0;
  padding: 0.3rem 0.8rem;
  background: ${props => props.isOldMovie ? '#ffd700' : '#444'};
  border-radius: 6px;
  font-weight: 500;
`

export const MovieTitleContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`