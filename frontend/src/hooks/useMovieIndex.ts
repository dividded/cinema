import { useMemo } from 'react';
import { Movie } from '../types/movie';
import {
  MoviesByDate,
  getAllDatesInRange,
  getMovieDatesCount,
  groupMoviesByDate,
} from '../utils/movies';

export interface MovieIndex {
  moviesByDate: MoviesByDate;
  movieDatesCount: Record<string, number>;
  visibleDates: string[];
}

const getTodayInIsrael = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

export const isDateWeekend = (date: string): boolean => {
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  return dayOfWeek === 5 || dayOfWeek === 6;
};

export const useMovieIndex = (movies: Movie[]): MovieIndex =>
  useMemo(() => {
    const moviesByDate = groupMoviesByDate(movies);
    const todayInIsrael = getTodayInIsrael();

    return {
      moviesByDate,
      movieDatesCount: getMovieDatesCount(movies),
      visibleDates: getAllDatesInRange().filter((date) => date >= todayInIsrael),
    };
  }, [movies]);
