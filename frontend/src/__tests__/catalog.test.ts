import { describe, expect, it } from 'vitest';
import { cutoffTie, ListFilmSchema, type ListFilm } from '../lists/catalog';

const ranked = (ranks: number[]): ListFilm[] => ranks.map((rank) => ({ rank, title: `#${rank}`, year: 2000, director: 'x' }));

describe('cutoffTie', () => {
  it('is null when the list fits', () => {
    expect(cutoffTie(ranked([1, 2, 3]), 3)).toBeNull();
    expect(cutoffTie(ranked([1, 2, 3, 4]), 4)).toBeNull();
  });

  it('finds the tie that straddles the cut-off', () => {
    // Five films share #3, so a top 4 would have to pick two of them.
    expect(cutoffTie(ranked([1, 2, 3, 3, 3, 3, 3]), 4)).toEqual({ start: 2, rank: 3 });
  });

  it('matches the real directors poll: 223 ranked films, then 99 tied at #224', async () => {
    const films = ListFilmSchema.array().parse((await import('../data/lists/ss-directors-2012.json')).default);
    const tie = cutoffTie(films, 250);
    expect(tie).toEqual({ start: 223, rank: 224 });
    expect(films.length - (tie?.start ?? 0)).toBe(99);
  });

  it('never splits a list that is exactly its nominal size', async () => {
    const films = ListFilmSchema.array().parse((await import('../data/lists/tspdt-1000.json')).default);
    expect(films).toHaveLength(1000);
    expect(cutoffTie(films, 1000)).toBeNull();
  });
});
