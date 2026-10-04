import { describe, expect, it } from 'vitest';
import { computeFilterResult } from '../filters/computeFilterResult';
import type { ListHit } from '../lists/match';
import type { Movie } from '../types/movie';
import { groupMoviesByDate } from '../utils/movies';

const movie = (title: string, year: number): Movie => ({
  title,
  year,
  screenings: [{ dateTime: '2026-10-15 20:00', venue: 'Cinematheque TLV' }],
});

const hit: ListHit = { list: 'tspdt-1000', rank: 3, film: { rank: 3, title: '2001', year: 1968, director: 'Stanley Kubrick' } };
const byDate = groupMoviesByDate([movie('2001', 1968), movie('Orphan', 2025), movie('Crash', 1996)]);
const visible = (enabled: string[], searchQuery = '') =>
  [...computeFilterResult(byDate, { searchQuery, enabledFilterIds: new Set(enabled) }, { listHits: { '2001': [hit] } }).visibleMovieKeys];

describe('schedule filters', () => {
  it('Canon keeps only movies on a list', () => {
    expect(visible(['canon'])).toEqual(['2026-10-15|2001']);
  });

  it('combines filters and search', () => {
    expect(visible(['pre-2020']).sort()).toEqual(['2026-10-15|2001', '2026-10-15|Crash']);
    expect(visible(['pre-2020', 'canon'], 'crash')).toEqual([]);
  });
});
