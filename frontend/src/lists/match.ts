import type { ListFilm, ListId } from './catalog';

// A wrong badge is worse than a missing one, so matching never guesses at spelling. Instead,
// titles are compared as keys that ignore everything formatting-related (case, accents,
// spaces, punctuation, apostrophes, a leading article, number words): "Schindler's List" and
// "schindlers list", "Spider-Man" and "Spiderman", "Godfather Part II" and "Godfather: Part 2"
// all give the same key.
//
// With a year on both sides (the usual case), a movie matches a list film when the keys are
// equal and the years are within one of each other (sources differ by festival vs. release
// year). Then a subtitle or suffix on one side is also allowed ("Taxi Driver – 4K restoration"
// matches "Taxi Driver"), but never on both sides at once, so "Three Colours: White" can't
// match "Three Colours: Red".
//
// Without a year on either side, only the whole English, original or Hebrew title can match,
// with the same key, and only when the list has a single film by that title.

const LEADING_ARTICLE = /^(the|a|an|le|la|les|il|lo|gli|i|el|los|las|der|die|das|un|une|o|os)\s+/;
const ELIDED_ARTICLE = /^(l|d)['’`´]\s*/; // L'Avventura, l’Atalante
const NUMBERS: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10', eleven: '11', twelve: '12', ii: '2', iii: '3', iv: '4', vi: '6', vii: '7', viii: '8', ix: '9',
};
/** Where a subtitle or an added suffix starts: "Title: Sub", "Title - 4K", "Title (Restored)". */
const SUBTITLE = /\s*(?::|\s[-–—]\s|\(|\[).*$/;
const MIN_MAIN_TITLE_KEY = 4;

/** Normalizes a title for comparison; formatting differences give the same key. */
export function titleKey(title: string): string {
  const words = title
    .replace(/½/g, ' 1/2 ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[֑-ׇ]/g, '') // Hebrew niqqud and cantillation
    .replace(/⁄/g, '/') // fraction slash
    .toLowerCase()
    .trim()
    .replace(ELIDED_ARTICLE, '')
    .replace(/['’`´׳״"“”]/g, '') // apostrophes and quotes join words: schindler's -> schindlers
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}/]+/gu, ' ')
    .trim();
  const stripped = words.replace(LEADING_ARTICLE, '') || words;
  return stripped
    .split(' ')
    .map((word) => NUMBERS[word] ?? word)
    .join('');
}

/** The title without a subtitle or suffix, or null if it has none (or what's left is too short). */
function mainTitleKey(title: string): string | null {
  const main = title.replace(SUBTITLE, '').trim();
  if (main === title.trim()) return null;
  const key = titleKey(main);
  return key.length >= MIN_MAIN_TITLE_KEY ? key : null;
}

/** The fields of a schedule movie that matching looks at. */
export interface MatchableMovie {
  title: string;
  altName?: string;
  originalTitle?: string;
  year?: number;
}

interface TitleKeys {
  /** Full titles. */
  full: string[];
  /** The same titles without their subtitle or suffix. */
  main: string[];
}

function keysOf(titles: readonly (string | undefined)[]): TitleKeys {
  const present = titles.filter((t): t is string => Boolean(t?.trim()));
  const full = [...new Set(present.map(titleKey))].filter(Boolean);
  const main = [...new Set(present.map(mainTitleKey))].filter((k): k is string => k !== null && !full.includes(k));
  return { full, main };
}

/**
 * Titles to try for a cinematheque movie. Its Hebrew title often carries an event name
 * ("איך לקרוא קולנוע | שלושת הצבעים: כחול"), so each " | " part is tried on its own.
 */
export function movieTitleKeys(movie: MatchableMovie): TitleKeys {
  return keysOf([movie.altName, movie.originalTitle, ...movie.title.split(/\s*\|\s*/), movie.title]);
}

/** The titles trusted without a year: the whole English, original or Hebrew title. */
function movieExactKeys(movie: MatchableMovie): string[] {
  return keysOf([movie.altName, movie.originalTitle, movie.title]).full;
}

export function filmTitles(film: ListFilm): string[] {
  return [film.title, film.he, ...(film.aka ?? [])].filter((t): t is string => Boolean(t));
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
  full: Map<string, IndexedFilm[]>;
  main: Map<string, IndexedFilm[]>;
  order: readonly ListId[];
}

function add(map: Map<string, IndexedFilm[]>, key: string, entry: IndexedFilm) {
  const entries = map.get(key) ?? [];
  if (!entries.some((e) => e.film === entry.film)) entries.push(entry);
  map.set(key, entries);
}

/** Builds title-key lookups over the given lists (in badge priority order). */
export function buildListIndex(lists: readonly { id: ListId; films: readonly ListFilm[] }[]): ListIndex {
  const index: ListIndex = { full: new Map(), main: new Map(), order: lists.map((l) => l.id) };
  for (const { id, films } of lists) {
    for (const film of films) {
      const keys = keysOf(filmTitles(film));
      for (const key of keys.full) add(index.full, key, { list: id, film });
      for (const key of keys.main) add(index.main, key, { list: id, film });
    }
  }
  return index;
}

const yearsMatch = (a: number, b: number) => Math.abs(a - b) <= 1;

/** Both years known: equal keys (a subtitle allowed on one side) and years within one. */
function datedCandidates(index: ListIndex, movie: MatchableMovie, year: number): IndexedFilm[] {
  const { full, main } = movieTitleKeys(movie);
  const found = [
    ...full.flatMap((key) => [...(index.full.get(key) ?? []), ...(index.main.get(key) ?? [])]),
    ...main.flatMap((key) => index.full.get(key) ?? []),
  ];
  return found.filter(({ film }) => film.year != null && yearsMatch(film.year, year));
}

/** A year missing on either side: the same whole title, and the only film by it in its list. */
function undatedCandidates(index: ListIndex, movie: MatchableMovie): IndexedFilm[] {
  return movieExactKeys(movie).flatMap((key) => {
    const entries = index.full.get(key) ?? [];
    return entries.filter(
      (entry) =>
        (movie.year == null || entry.film.year == null) &&
        entries.filter((e) => e.list === entry.list).length === 1,
    );
  });
}

/** The lists a movie is on, at most one hit per list, in badge priority order. */
export function matchMovie(index: ListIndex, movie: MatchableMovie): ListHit[] {
  const candidates = [
    ...(movie.year != null ? datedCandidates(index, movie, movie.year) : []),
    ...undatedCandidates(index, movie),
  ];

  const best = new Map<ListId, ListFilm>();
  // Prefer the exact year, then the better rank.
  const score = (f: ListFilm) => (movie.year != null && f.year === movie.year ? 0 : 10_000) + f.rank;
  for (const { list, film } of candidates) {
    const current = best.get(list);
    if (!current || score(film) < score(current)) best.set(list, film);
  }
  return index.order.flatMap((id) => {
    const film = best.get(id);
    return film ? [{ list: id, rank: film.rank, film }] : [];
  });
}
