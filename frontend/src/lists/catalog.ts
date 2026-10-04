import type { ListId } from './ids';

export type { ListId };

/** A film on one of the lists (see scripts/lists/build-lists.py, which writes src/data/lists/). */
export interface ListFilm {
  rank: number;
  /** English title where known, else the list's own. */
  title: string;
  year: number | null;
  director: string;
  imdb?: string;
  /** Hebrew title (from Wikidata). */
  he?: string;
  /** Original-language title, when it differs from `title`. */
  original?: string;
  /** Other titles (the list's own, the original, alternates and aliases), for matching only. */
  aka?: string[];
  votes?: number;
  country?: string;
}


export interface ListInfo {
  id: ListId;
  /** Shown on the badge, before the rank. */
  badge: string;
  /** Short name for links between lists. */
  shortName: string;
  title: string;
  description: string;
  source: { label: string; url: string };
  /** Badge style; the Sight & Sound lists are the more festive ones. */
  tone: 'gold' | 'plain';
  load: () => Promise<ListFilm[]>;
}

// In badge priority order.
export const LISTS: readonly ListInfo[] = [
  {
    id: 'ss-directors-2012',
    badge: 'S&S Directors',
    shortName: 'S&S 2012 Directors',
    title: 'Sight & Sound 2012 · Directors’ Top 250',
    description: 'Every ten years Sight & Sound asks filmmakers to name the greatest films ever made. This is their 2012 list.',
    source: { label: 'BFI Sight & Sound poll 2012', url: 'https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time' },
    tone: 'gold',
    load: () => import('../data/lists/ss-directors-2012.json').then((m) => m.default as ListFilm[]),
  },
  {
    id: 'ss-critics-2012',
    badge: 'S&S Critics',
    shortName: 'S&S 2012 Critics',
    title: 'Sight & Sound 2012 · Critics’ Top 250',
    description: 'The 2012 critics’ poll, the year Vertigo took the top spot from Citizen Kane.',
    source: { label: 'BFI Sight & Sound poll 2012', url: 'https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time' },
    tone: 'gold',
    load: () => import('../data/lists/ss-critics-2012.json').then((m) => m.default as ListFilm[]),
  },
  {
    id: 'tspdt-1000',
    badge: 'TSPDT',
    shortName: 'TSPDT 1000',
    title: 'They Shoot Pictures, Don’t They? · 1,000 Greatest Films',
    description: 'The thousand greatest films, combined from critics’ lists and polls from around the world. 2026 edition.',
    source: { label: 'theyshootpictures.com', url: 'https://www.theyshootpictures.com/gf1000_all1000films_table.php' },
    tone: 'plain',
    load: () => import('../data/lists/tspdt-1000.json').then((m) => m.default as ListFilm[]),
  },
];

export const listById = (id: string): ListInfo | undefined => LISTS.find((list) => list.id === id);

export const listPath = (id: ListId): string => `/lists/${id}`;

export const imdbUrl = (id: string): string => `https://www.imdb.com/title/${id}/`;

/** Anchor of a film on its list page, so a badge can scroll to and open it. */
export const filmAnchor = (rank: number, imdb?: string): string => (imdb ? `film-${imdb}` : `rank-${rank}`);

/**
 * Where a ranked list crosses its nominal size: ranks come from vote counts, so the last tie
 * can straddle the cut-off (99 films share #224 in the directors' poll). Returns the index
 * where that tie starts, or null when the list fits.
 */
export function cutoffTie(films: readonly ListFilm[], size = 250): { start: number; rank: number } | null {
  if (films.length <= size) return null;
  const rank = films[size - 1].rank;
  const start = films.findIndex((film) => film.rank === rank);
  return { start, rank };
}
