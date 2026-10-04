import { describe, expect, it } from 'vitest';
import type { ListFilm } from '../lists/catalog';
import { buildListIndex, matchMovie, movieTitleKeys, titleKey } from '../lists/match';

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
    expect(titleKey('Tokyo Story!')).toBe('tokyostory');
  });

  it.each([
    ["Schindler's List", 'Schindlers List'],
    ['Schindler’s List', "schindler's list"],
    ['Spider-Man', 'Spiderman'],
    ['Night Fall', 'Nightfall'],
    ['M*A*S*H', 'MASH'],
    ['Dr. Strangelove', 'Dr Strangelove'],
    ['Seven Samurai', '7 Samurai'],
    ['The Godfather Part II', 'The Godfather: Part 2'],
    ["Pierrot le Fou", 'Pierrot  le   fou '],
    ['Ladri di biciclette', 'Ladri di Biciclette.'],
    ['“Wild Strawberries”', 'Wild Strawberries'],
    ['צ׳אפלין', "צ'אפלין"],
    ['L’Atalante', "L'Atalante"],
  ])('treats %j and %j as the same title', (a, b) => {
    expect(titleKey(a)).toBe(titleKey(b));
  });

  it('still tells different titles apart', () => {
    expect(titleKey('Three Colours: Red')).not.toBe(titleKey('Three Colours: White'));
    expect(titleKey('Tokyo Story')).not.toBe(titleKey('Tokyo Story 2'));
  });

  it('keeps titles that are only an article', () => {
    expect(titleKey('A')).toBe('a');
    expect(titleKey('The')).toBe('the');
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
    expect(keys.full).toContain(titleKey('שלושת הצבעים: כחול'));
    expect(keys.full).toContain(titleKey('איך לקרוא קולנוע'));
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

  it('matches a movie without a year only by its exact whole title', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo' }).map((h) => h.list)).toEqual(['ss-critics-2012', 'tspdt-1000']);
    expect(matchMovie(index, { title: 'ורטיגו', altName: 'Vertigo: 4K Restoration' })).toEqual([]);
    expect(matchMovie(index, { title: 'Vertigo | הקרנה+הרצאה' })).toEqual([]);
  });

  it('matches a list film without a year only by its exact whole title', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Unknown Year', year: 2000 })).toHaveLength(1);
    expect(matchMovie(index, { title: 'x', altName: 'Unknown Year: Part 2', year: 2000 })).toEqual([]);
  });

  it('skips an undated match when the list has two films by that title', () => {
    const remakes = buildListIndex([
      { id: 'tspdt-1000', films: [film(1, 'Scarface', 1932), film(2, 'Scarface', 1983)] },
    ]);
    expect(matchMovie(remakes, { title: 'x', altName: 'Scarface' })).toEqual([]);
    expect(matchMovie(remakes, { title: 'x', altName: 'Scarface', year: 1983 })[0].rank).toBe(2);
  });

  it('allows a subtitle or suffix on one side when the year matches', () => {
    expect(matchMovie(index, { title: 'x', altName: 'Tokyo Story - 4K Restoration', year: 1953 })).toHaveLength(3);
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo (Restored)', year: 1958 })).toHaveLength(2);
    expect(matchMovie(index, { title: 'x', altName: 'Vertigo (Restored)', year: 1970 })).toEqual([]);
  });

  it('never strips subtitles on both sides', () => {
    const colours = buildListIndex([{ id: 'tspdt-1000', films: [film(298, 'Three Colours: Red', 1994)] }]);
    expect(matchMovie(colours, { title: 'x', altName: 'Three Colours: White', year: 1994 })).toEqual([]);
  });

  it('matches a short title against a list title with a subtitle', () => {
    const sunrise = buildListIndex([{ id: 'ss-critics-2012', films: [film(5, 'Sunrise: A Song of Two Humans', 1927)] }]);
    expect(matchMovie(sunrise, { title: 'x', altName: 'Sunrise', year: 1927 })).toHaveLength(1);
  });

  it('matches through formatting differences', () => {
    const formatted = buildListIndex([
      { id: 'tspdt-1000', films: [film(1, "Schindler's List", 1993), film(2, 'The Godfather Part II', 1974)] },
    ]);
    expect(matchMovie(formatted, { title: 'x', altName: 'Schindlers List', year: 1993 })).toHaveLength(1);
    expect(matchMovie(formatted, { title: 'x', altName: 'Godfather: Part 2', year: 1974 })).toHaveLength(1);
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
