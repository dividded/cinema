import { memo, useRef } from 'react';
import { FilterResult, movieCardKey } from '../filters/types';
import { useApplyScheduleVisibility } from '../hooks/useApplyScheduleVisibility';
import { ListHitsByTitle } from '../hooks/useListHits';
import { MovieIndex } from '../hooks/useMovieIndex';
import { formatHebrewDate } from '../utils/dateTime';
import { DayGroup, isDateWeekend, isMorningOnlyMovie } from '../utils/movies';
import { MovieCard } from './MovieCard';
import { NoMoviesCard } from './NoMoviesCard';
import { DateHeader } from './styled/DateHeader';
import { DateSection, MovieList } from './styled/Layout';

interface DateSectionBlockProps {
  date: string;
  meta: FilterResult['dateMeta'][string] | undefined;
  movies: DayGroup['movies'] | undefined;
  isWeekend: boolean;
  movieDatesCount: MovieIndex['movieDatesCount'];
  listHits: ListHitsByTitle;
}

const dateSectionPropsAreEqual = (
  prev: DateSectionBlockProps,
  next: DateSectionBlockProps,
): boolean =>
  prev.date === next.date &&
  prev.isWeekend === next.isWeekend &&
  prev.movies === next.movies &&
  prev.movieDatesCount === next.movieDatesCount &&
  prev.listHits === next.listHits &&
  prev.meta?.hasAnyMovies === next.meta?.hasAnyMovies &&
  prev.meta?.hasVisibleMovies === next.meta?.hasVisibleMovies &&
  prev.meta?.isMorningOnly === next.meta?.isMorningOnly;

const DateSectionBlock = memo(function DateSectionBlock({
  date,
  meta,
  movies,
  isWeekend,
  movieDatesCount,
  listHits,
}: DateSectionBlockProps) {
  const hasAnyMovies = meta?.hasAnyMovies ?? Boolean(movies?.length);
  const hasVisibleMovies = meta?.hasVisibleMovies ?? hasAnyMovies;
  const isMorningOnly =
    hasVisibleMovies && !isWeekend && (meta?.isMorningOnly ?? false);

  return (
    <DateSection data-date-section={date}>
      <DateHeader isWeekend={isWeekend} isMorningOnly={isMorningOnly}>
        {formatHebrewDate(date)}
      </DateHeader>
      {hasAnyMovies ? (
        (movies ?? []).map((movie) => (
          <MovieCard
            key={movieCardKey(date, movie.title)}
            movieKey={movieCardKey(date, movie.title)}
            movie={movie}
            isWeekend={isWeekend}
            isMorningOnly={!isWeekend && isMorningOnlyMovie(movie)}
            movieDatesCount={movieDatesCount}
            listHits={listHits[movie.title]}
          />
        ))
      ) : (
        <NoMoviesCard isWeekend={isWeekend} />
      )}
    </DateSection>
  );
}, dateSectionPropsAreEqual);

interface MovieScheduleProps {
  index: MovieIndex;
  filterResult: FilterResult;
  listHits: ListHitsByTitle;
}

export { DateSectionBlock };

export const MovieSchedule = memo(function MovieSchedule({
  index,
  filterResult,
  listHits,
}: MovieScheduleProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { moviesByDate, movieDatesCount, visibleDates } = index;

  useApplyScheduleVisibility(listRef, filterResult);

  return (
    <MovieList ref={listRef}>
      {visibleDates.map((date) => (
        <DateSectionBlock
          key={date}
          date={date}
          meta={filterResult.dateMeta[date]}
          movies={moviesByDate[date]?.movies}
          isWeekend={isDateWeekend(date)}
          movieDatesCount={movieDatesCount}
          listHits={listHits}
        />
      ))}
    </MovieList>
  );
});
