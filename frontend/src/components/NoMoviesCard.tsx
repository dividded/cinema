import { NoMoviesCard as StyledNoMoviesCard } from './styled/NoMoviesCard';

export function NoMoviesCard({ isWeekend }: { isWeekend: boolean }) {
  return <StyledNoMoviesCard isWeekend={isWeekend}>No movies found for this date</StyledNoMoviesCard>;
}
