import { Movie } from '../types/movie';
import { isBeforeEvening, timeOf } from '../utils/dateTime';
import { MoviesByDate } from '../utils/movies';
import { MOVIE_FILTERS } from './registry';
import {
  DateFilterMeta,
  FilterContext,
  FilterResult,
  MovieFilterState,
  movieCardKey,
} from './types';

export const movieMatchesFilters = (
  movie: Movie,
  state: MovieFilterState,
  context: FilterContext,
): boolean => {
  const query = state.searchQuery.trim().toLowerCase();
  if (query) {
    const matchesSearch =
      movie.title.toLowerCase().includes(query) ||
      (movie.altName?.toLowerCase().includes(query) ?? false);
    if (!matchesSearch) return false;
  }

  for (const filter of MOVIE_FILTERS) {
    if (state.enabledFilterIds.has(filter.id) && !filter.predicate(movie, context)) {
      return false;
    }
  }

  return true;
};

export const computeFilterResult = (
  moviesByDate: MoviesByDate,
  state: MovieFilterState,
  context: FilterContext,
): FilterResult => {
  const visibleMovieKeys = new Set<string>();
  const dateMeta: Record<string, DateFilterMeta> = {};

  for (const [date, group] of Object.entries(moviesByDate)) {
    if (!group) continue;
    let hasVisibleMovies = false;
    let isMorningOnly = true;

    for (const movie of group.movies) {
      if (!movieMatchesFilters(movie, state, context)) continue;

      hasVisibleMovies = true;
      visibleMovieKeys.add(movieCardKey(date, movie.title));

      for (const screening of movie.screenings) {
        if (!isBeforeEvening(timeOf(screening.dateTime))) isMorningOnly = false;
      }
    }

    dateMeta[date] = {
      hasVisibleMovies,
      hasAnyMovies: group.movies.length > 0,
      isMorningOnly: hasVisibleMovies ? isMorningOnly : group.isMorningOnly,
    };
  }

  return { visibleMovieKeys, dateMeta };
};
