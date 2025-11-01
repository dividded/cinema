import React from 'react';
import { NoMoviesCard as StyledNoMoviesCard } from './styled/NoMoviesCard';

interface NoMoviesCardProps {
  date: string;
  isWeekend: boolean;
}

export const NoMoviesCard: React.FC<NoMoviesCardProps> = ({ date, isWeekend }) => {
  return (
    <StyledNoMoviesCard isWeekend={isWeekend}>
      No movies found for this date
    </StyledNoMoviesCard>
  );
};

