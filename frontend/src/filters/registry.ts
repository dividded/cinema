import { FilterDefinition } from './types';

export const MOVIE_FILTERS: FilterDefinition[] = [
  {
    id: 'pre-2020',
    label: 'Movies older than 2020',
    predicate: (movie) => Boolean(movie.year && movie.year < 2020),
  },
];
