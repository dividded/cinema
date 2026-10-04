import type { ListHitsByTitle } from '../hooks/useListHits';
import { Movie } from '../types/movie';

/** What filters can look at besides the movie itself. */
export interface FilterContext {
  /** The lists each movie title is on (empty until the lists have loaded). */
  listHits: ListHitsByTitle;
}

export type MoviePredicate = (movie: Movie, context: FilterContext) => boolean;

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
