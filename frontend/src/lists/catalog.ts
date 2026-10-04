import { z } from 'zod';
import { LIST_IDS, type ListId } from './ids';

export type { ListId };

export const ListIdSchema = z.enum(LIST_IDS);

/** A film on one of the lists (see scripts/lists/build-lists.py, which writes src/data/lists/). */
export const ListFilmSchema = z.object({
  rank: z.number(),
  /** English title where known, else the list's own. */
  title: z.string(),
  year: z.number().nullable(),
  director: z.string(),
  imdb: z.string().optional(),
  /** Hebrew title (from Wikidata). */
  he: z.string().optional(),
  /** Original-language title, when it differs from `title`. */
  original: z.string().optional(),
  /** Other titles (the list's own, the original, alternates and aliases), for matching only. */
  aka: z.array(z.string()).optional(),
  votes: z.number().optional(),
  country: z.string().optional(),
});
export type ListFilm = z.infer<typeof ListFilmSchema>;

const parseFilms = (data: unknown): ListFilm[] => z.array(ListFilmSchema).parse(data);

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
  /** The list's nominal length; a tie straddling it is listed separately. */
  size: number;
  load: () => Promise<ListFilm[]>;
}

export const LIST_INFO: Record<ListId, ListInfo> = {
  'ss-directors-2012': {
    id: 'ss-directors-2012',
    badge: 'S&S Directors',
    shortName: 'S&S 2012 Directors',
    title: 'Sight & Sound 2012 · Directors’ Top 250',
    description: 'Every ten years Sight & Sound asks filmmakers to name the greatest films ever made. This is their 2012 list.',
    source: { label: 'BFI Sight & Sound poll 2012', url: 'https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time' },
    tone: 'gold',
    size: 250,
    load: () => import('../data/lists/ss-directors-2012.json').then((m) => parseFilms(m.default)),
  },
  'ss-critics-2012': {
    id: 'ss-critics-2012',
    badge: 'S&S Critics',
    shortName: 'S&S 2012 Critics',
    title: 'Sight & Sound 2012 · Critics’ Top 250',
    description: 'The 2012 critics’ poll, the year Vertigo took the top spot from Citizen Kane.',
    source: { label: 'BFI Sight & Sound poll 2012', url: 'https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time' },
    tone: 'gold',
    size: 250,
    load: () => import('../data/lists/ss-critics-2012.json').then((m) => parseFilms(m.default)),
  },
  'tspdt-1000': {
    id: 'tspdt-1000',
    badge: 'TSPDT',
    shortName: 'TSPDT 1000',
    title: 'They Shoot Pictures, Don’t They? · 1,000 Greatest Films',
    description: 'The thousand greatest films, combined from critics’ lists and polls from around the world. 2026 edition.',
    source: { label: 'theyshootpictures.com', url: 'https://www.theyshootpictures.com/gf1000_all1000films_table.php' },
    tone: 'plain',
    size: 1000,
    load: () => import('../data/lists/tspdt-1000.json').then((m) => parseFilms(m.default)),
  },
};

/** In badge priority order. */
export const LISTS: readonly ListInfo[] = LIST_IDS.map((id) => LIST_INFO[id]);

export const listById = (id: ListId): ListInfo => LIST_INFO[id];

export const imdbUrl = (id: string): string => `https://www.imdb.com/title/${id}/`;

/** Anchor of a film on its list page, so a badge can scroll to and open it. */
export const filmAnchor = (rank: number, imdb?: string): string =>
  imdb !== undefined && imdb !== '' ? `film-${imdb}` : `rank-${rank}`;

/**
 * Where a ranked list crosses its nominal size: ranks come from vote counts, so the last tie
 * can straddle the cut-off (99 films share #224 in the directors' poll). Returns the index
 * where that tie starts, or null when the list fits.
 */
export function cutoffTie(films: readonly ListFilm[], size: number): { start: number; rank: number } | null {
  if (films.length <= size) return null;
  const last = films[size - 1];
  if (!last) return null;
  const start = films.findIndex((film) => film.rank === last.rank);
  return { start, rank: last.rank };
}
