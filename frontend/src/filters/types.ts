import { Movie } from '../types/movie';

export type MoviePredicate = (movie: Movie) => boolean;

export interface FilterDefinition {
  id: string;
  label: string;
  predicate: MoviePredicate;
}

export interface MovieFilterState {
  searchQuery: string;
  enabledFilterIds: ReadonlySet<string>;
}

export interface DateFilterMeta {
  hasVisibleMovies: boolean;
  hasAnyMovies: boolean;
  isMorningOnly: boolean;
}

export interface FilterResult {
  visibleMovieKeys: ReadonlySet<string>;
  dateMeta: Readonly<Record<string, DateFilterMeta>>;
}

export const movieCardKey = (date: string, title: string): string =>
  `${date}|${title}`;
