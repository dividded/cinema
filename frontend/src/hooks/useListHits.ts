import { useMemo } from 'react';
import { ListHit, MatchableMovie, matchMovie } from '../lists/match';
import { useListIndex } from './useListIndex';

export type ListHitsByTitle = Readonly<Record<string, readonly ListHit[]>>;

const NONE: ListHitsByTitle = {};

/** The list badges for each movie title (empty until the lists have loaded). */
export function useListHits(movies: readonly MatchableMovie[]): ListHitsByTitle {
  const index = useListIndex();
  return useMemo(() => {
    if (!index) return NONE;
    const hits: Record<string, ListHit[]> = {};
    for (const movie of movies) {
      if (movie.title in hits) continue;
      const found = matchMovie(index, movie);
      if (found.length) hits[movie.title] = found;
    }
    return hits;
  }, [index, movies]);
}
