import { useMemo } from 'react';
import { Movie } from '../types/movie';
import { getTodayInIsrael } from '../utils/dateTime';
import {
  MoviesByDate,
  getMovieDatesCount,
  groupMoviesByDate,
} from '../utils/movies';

export interface MovieIndex {
  moviesByDate: MoviesByDate;
  movieDatesCount: Record<string, number>;
  visibleDates: string[];
}

// A day without movies is shown only as a short gap between days with screenings (e.g. a
// holiday closure). Longer or trailing empty stretches are almost always days the cinema
// hasn't published yet, and listing them as "no movies" is just noise.
const MAX_CLOSURE_DAYS = 1;

function datesToShow(dates: string[], moviesByDate: MoviesByDate): string[] {
  const shown: string[] = [];
  let emptyRun: string[] = [];

  for (const date of dates) {
    if (!moviesByDate[date]?.movies.length) {
      emptyRun.push(date);
      continue;
    }
    if (emptyRun.length <= MAX_CLOSURE_DAYS) shown.push(...emptyRun);
    emptyRun = [];
    shown.push(date);
  }
  return shown;
}

export const isDateWeekend = (date: string): boolean => {
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  return dayOfWeek === 5 || dayOfWeek === 6;
};

/**
 * @param fetchedDates Dates the API has data for. Only these can be shown, so a day that
 * was never fetched doesn't appear as "no movies".
 */
export const useMovieIndex = (movies: Movie[], fetchedDates: string[]): MovieIndex =>
  useMemo(() => {
    const todayInIsrael = getTodayInIsrael();
    const moviesByDate = groupMoviesByDate(movies);
    const upcomingDates = fetchedDates.filter((date) => date >= todayInIsrael);

    return {
      moviesByDate,
      movieDatesCount: getMovieDatesCount(movies),
      visibleDates: datesToShow(upcomingDates, moviesByDate),
    };
  }, [movies, fetchedDates]);
