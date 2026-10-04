import { describe, expect, it } from 'vitest';
import type { Movie } from '../types/movie';
import { filmKey, getMovieDatesCount, groupMoviesByDate } from '../utils/movies';

const movie = (title: string, dateTimes: string[], extra: Partial<Movie> = {}): Movie => ({
  title,
  screenings: dateTimes.map((dateTime) => ({ dateTime, venue: 'Cinematheque TLV' })),
  ...extra,
});

describe('getMovieDatesCount', () => {
  it('counts one film listed under different event titles together', () => {
    // As in the schedule: the same film in a regular slot and in an "after" event.
    const movies = [
      movie('הנסיכה מונונוקי | סינמטוקיו', ['2026-10-15 20:00'], { altName: 'Princess Mononoke', year: 1997 }),
      movie('אפטר בסינמטק | הנסיכה מונונוקי', ['2026-10-16 22:00'], { altName: 'Princess Mononoke', year: 1997 }),
    ];
    const counts = getMovieDatesCount(movies);
    expect(movies.map((m) => counts.get(filmKey(m)))).toEqual([2, 2]);
  });

  it('keeps different films with the same English title apart by year', () => {
    const movies = [
      movie('קראש', ['2026-10-15 20:00'], { altName: 'Crash', year: 1996 }),
      movie('התרסקות', ['2026-10-16 20:00'], { altName: 'Crash', year: 2004 }),
    ];
    const counts = getMovieDatesCount(movies);
    expect(movies.map((m) => counts.get(filmKey(m)))).toEqual([1, 1]);
  });

  it('counts several screenings on one day as one date', () => {
    const counts = getMovieDatesCount([movie('x', ['2026-10-15 16:00', '2026-10-15 20:00'], { altName: 'X', year: 2000 })]);
    expect([...counts.values()]).toEqual([1]);
  });

  it('falls back to the full title when there is no English title', () => {
    const movies = [
      movie('איך לקרוא קולנוע | העיתון', ['2026-10-15 20:00']),
      movie('איך לקרוא קולנוע | בקו האש', ['2026-10-16 20:00']),
    ];
    expect(new Set(movies.map(filmKey)).size).toBe(2);
  });
});

describe('groupMoviesByDate', () => {
  it('sorts each day by the earliest screening and marks weekends', () => {
    const grouped = groupMoviesByDate([
      movie('late', ['2026-10-09 21:00']),
      movie('early', ['2026-10-09 11:00']),
    ]);
    expect(grouped['2026-10-09']?.movies.map((m) => m.title)).toEqual(['early', 'late']);
    expect(grouped['2026-10-09']?.isWeekend).toBe(true); // a Friday
  });
});
