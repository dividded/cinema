import { describe, expect, it } from 'vitest';
import type { ListFilm } from '../lists/catalog';
import { buildListIndex, matchMovie, movieMatchesFilm, movieTitleKeys, titleKey } from '../lists/match';

const film = (rank: number, title: string, year: number | null, extra: Partial<ListFilm> = {}): ListFilm => ({
  rank,
  title,
  year,
  director: 'Someone',
  ...extra,
});

const index = buildListIndex([
  {
    id: 'ss-directors-2012',
    films: [
      film(4, '8½', 1963),
      film(10, 'Bicycle Thieves', 1948, { aka: ['Ladri di biciclette', 'The Bicycle Thieves'], he: 'גנבי האופניים' }),
      film(1, 'Tokyo Story', 1953),
    ],
  },
  {
    id: 'ss-critics-2012',
    films: [film(1, 'Vertigo', 1958), film(4, 'The Rules of the Game', 1939, { aka: ['La Règle du jeu'] }), film(3, 'Tokyo Story', 1953)],
  },
  {
    id: 'tspdt-1000',
    films: [
      film(2, 'Vertigo', 1958),
      film(4, 'Tokyo Story', 1953),
      film(300, 'Z', 1969),
      film(500, 'Crash', 1996),
      film(900, 'Unknown Year', null),
    ],
  },
]);

describe('titleKey', () => {
  it('ignores case, accents, punctuation and a leading article', () => {
    expect(titleKey('La Règle du jeu')).toBe(titleKey('regle du jeu'));
    expect(titleKey("L'Avventura")).toBe(titleKey('L’avventura'));
    expect(titleKey('The Bicycle Thieves')).toBe(titleKey('Bicycle Thieves'));
    expect(titleKey('Tokyo Story!')).toBe('tokyo story');
  });

  it('keeps titles that are only an article', () => {
    expect(titleKey('A')).toBe('a');
  });

  it('normalizes ampersands and fractions', () => {
    expect(titleKey('Pierrot & Me')).toBe(titleKey('pierrot and me'));
    expect(titleKey('8½')).toBe(titleKey('8 1/2'));
  });

  it('strips Hebrew niqqud', () => {
    expect(titleKey('גַּנְבֵי הָאוֹפַנַּיִים')).toBe(titleKey('גנבי האופניים'));
  });
});

describe('movieTitleKeys', () => {
  it('tries each part of an event title on its own', () => {
    const keys = movieTitleKeys({ title: 'איך לקרוא קולנוע | שלושת הצבעים: כחול', year: 1993 });
    expect(keys).toContain(titleKey('שלושת הצבעים: כחול'));
    expect(keys).toContain(titleKey('איך לקרוא קולנוע'));
  });
});

describe('matchMovie', () => {
  it('matches the English title with the same year, in badge priority order', () => {
    const hits = matchMovie(index, { title: 'טוקיו סטורי', altName: 'Tokyo Story', year: 1953 });
    expect(hits.map((h) => [h.list, h.rank])).toEqual([
      ['ss-directors-2012', 1],
      ['ss-critics-2012', 3],
      ['tspdt-1000', 4],
    ]);
  });

  it('accepts a year off by one, but not more', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo', year: 1959 })).toHaveLength(2);
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo', year: 1960 })).toEqual([]);
  });

  it('never matches a movie without a year', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo' })).toEqual([]);
  });

  it('never matches a list film without a year', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Unknown Year', year: 2000 })).toEqual([]);
  });

  it('tells remakes apart by year', () => {
    expect(matchMovie(index, { title: 'קראש', altName: 'Crash', year: 2004 })).toEqual([]);
    expect(matchMovie(index, { title: 'קראש', altName: 'Crash', year: 1996 })).toHaveLength(1);
  });

  it('matches alternate and original titles, and the Hebrew title', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Ladri di biciclette', year: 1948 })).toHaveLength(1);
    expect(matchMovie(index, { title: 'x', altName: 'Rules of the Game', year: 1939 })).toHaveLength(1);
    expect(matchMovie(index, { title: 'גנבי האופניים | הקרנה+הרצאה', year: 1948 })).toHaveLength(1);
  });

  it('matches single-letter titles exactly', () => {
    expect(matchMovie(index, { title: 'זד Z', altName: 'Z', year: 1969 })).toHaveLength(1);
    expect(matchMovie(index, { title: 'x', altName: 'Zelig', year: 1969 })).toEqual([]);
  });

  it('does not match partial titles', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Tokyo Story 2', year: 1953 })).toEqual([]);
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo Returns', year: 1958 })).toEqual([]);
  });
});

describe('movieMatchesFilm', () => {
  it('uses the same rules as the index', () => {
    const bicycle = film(10, 'Bicycle Thieves', 1948, { aka: ['Ladri di biciclette'] });
    expect(movieMatchesFilm({ title: 'x', altName: 'The Bicycle Thieves', year: 1949 }, bicycle)).toBe(true);
    expect(movieMatchesFilm({ title: 'x', altName: 'Bicycle Thieves', year: 1950 }, bicycle)).toBe(false);
    expect(movieMatchesFilm({ title: 'x', altName: 'Bicycle Thieves' }, bicycle)).toBe(false);
  });
});
