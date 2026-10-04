import { FilterDefinition } from './types';

export const MOVIE_FILTERS: FilterDefinition[] = [
  {
    id: 'pre-2020',
    label: 'Pre-2020',
    predicate: (movie) => movie.year !== undefined && movie.year < 2020,
  },
  {
    // On any of the film lists (Sight & Sound 2012, TSPDT 1000).
    id: 'canon',
    label: 'Canon',
    predicate: (movie, { listHits }) => (listHits[movie.title]?.length ?? 0) > 0,
  },
];
