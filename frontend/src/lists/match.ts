import type { ListFilm, ListId } from './catalog';

// Matching is deliberately strict, since a wrong badge is worse than a missing one: a movie
// matches a list film only when one of its titles equals one of the film's titles after
// normalization (case, accents, punctuation, a leading article) AND the years are within one
// of each other (release years differ between sources by festival vs. release dates).
// Movies without a year never match.

const LEADING_ARTICLE = /^(the|a|an|le|la|les|l|il|lo|gli|i|el|los|las|der|die|das|un|une|o|os)\s+/;
const MIN_KEY_LENGTH = 1;

/** Normalizes a title for comparison: "L'Avventura" and "l’avventura" give the same key. */
export function titleKey(title: string): string {
  const key = title
    .replace(/½/g, ' 1/2 ')
    .normalize('NFKD')
    .replace(/\u2044/g, '/') // fraction slash
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[\u0591-\u05c7]/g, '') // Hebrew niqqud and cantillation
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}/]+/gu, ' ')
    .trim();
  return key.replace(LEADING_ARTICLE, '').trim() || key;
}

/** The fields of a schedule movie that matching looks at. */
export interface MatchableMovie {
  title: string;
  altName?: string;
  originalTitle?: string;
  year?: number;
}

/**
 * Titles to try for a cinematheque movie. Its Hebrew title often carries an event name
 * ("איך לקרוא קולנוע | שלושת הצבעים: כחול"), so each " | " part is tried on its own.
 */
export function movieTitleKeys(movie: MatchableMovie): string[] {
  const titles = [movie.altName, movie.originalTitle, ...movie.title.split(/\s+\|\s+/), movie.title];
  return [...new Set(titles.filter((t): t is string => Boolean(t)).map(titleKey))].filter(
    (key) => key.length >= MIN_KEY_LENGTH,
  );
}

export interface ListHit {
  list: ListId;
  rank: number;
  film: ListFilm;
}

interface IndexedFilm {
  list: ListId;
  film: ListFilm;
}

export interface ListIndex {
  byKey: Map<string, IndexedFilm[]>;
  order: readonly ListId[];
}

export function filmTitles(film: ListFilm): string[] {
  return [film.title, film.he, ...(film.aka ?? [])].filter((t): t is string => Boolean(t));
}

/** Builds a title-key lookup over the given lists (in badge priority order). */
export function buildListIndex(lists: readonly { id: ListId; films: readonly ListFilm[] }[]): ListIndex {
  const byKey = new Map<string, IndexedFilm[]>();
  for (const { id, films } of lists) {
    for (const film of films) {
      if (film.year == null) continue;
      for (const key of new Set(filmTitles(film).map(titleKey))) {
        if (key.length < MIN_KEY_LENGTH) continue;
        const entries = byKey.get(key) ?? [];
        entries.push({ list: id, film });
        byKey.set(key, entries);
      }
    }
  }
  return { byKey, order: lists.map((l) => l.id) };
}

const yearsMatch = (a: number, b: number) => Math.abs(a - b) <= 1;

/** The lists a movie is on, at most one hit per list, in badge priority order. */
export function matchMovie(index: ListIndex, movie: MatchableMovie): ListHit[] {
  if (movie.year == null) return [];
  const best = new Map<ListId, ListFilm>();
  for (const key of movieTitleKeys(movie)) {
    for (const { list, film } of index.byKey.get(key) ?? []) {
      if (!yearsMatch(film.year!, movie.year)) continue;
      const current = best.get(list);
      // Prefer the exact year, then the better rank.
      const score = (f: ListFilm) => (f.year === movie.year ? 0 : 10_000) + f.rank;
      if (!current || score(film) < score(current)) best.set(list, film);
    }
  }
  return index.order.filter((id) => best.has(id)).map((id) => ({ list: id, rank: best.get(id)!.rank, film: best.get(id)! }));
}

/** The reverse direction, for list pages: does a screened movie match this list film? */
export function movieMatchesFilm(movie: MatchableMovie, film: ListFilm): boolean {
  if (movie.year == null || film.year == null || !yearsMatch(movie.year, film.year)) return false;
  const filmKeys = new Set(filmTitles(film).map(titleKey));
  return movieTitleKeys(movie).some((key) => filmKeys.has(key));
}
