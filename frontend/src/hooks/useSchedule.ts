import { useEffect, useState } from 'react';
import { legacyMoviesUrl, resolveApiOrigin, scheduleUrl } from '../config/api';
import { Movie } from '../types/movie';
import { getTodayInIsrael } from '../utils/dateTime';

/** Every movie plus the dates the API actually has data for (unfetched dates are absent). */
export interface Schedule {
  updatedAt: string | null;
  dates: string[];
  movies: Movie[];
}

const API_ORIGIN = resolveApiOrigin(import.meta.env.VITE_API_URL, import.meta.env.MODE);
const STORAGE_KEY = 'cinema:schedule:v1';

const isSchedule = (value: unknown): value is Schedule =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as Schedule).dates) &&
  Array.isArray((value as Schedule).movies);

function readCachedSchedule(): { text: string; schedule: Schedule } | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    const schedule: unknown = JSON.parse(text);
    return isSchedule(schedule) ? { text, schedule } : null;
  } catch {
    return null;
  }
}

function writeCachedSchedule(text: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // Storage full or unavailable (private mode); the app still works without it.
  }
}

/** Older APIs only serve the movie list; assume every day up to the last screening was fetched. */
function scheduleFromMovies(movies: Movie[]): Schedule {
  const screeningDates = movies.flatMap((m) => m.screenings.map((s) => s.dateTime.slice(0, 10)));
  const lastDate = screeningDates.sort().at(-1);
  const dates: string[] = [];
  if (lastDate) {
    const [year, month, day] = getTodayInIsrael().split('-').map(Number);
    for (let i = 0; ; i++) {
      const date = new Date(Date.UTC(year, month - 1, day + i)).toISOString().slice(0, 10);
      if (date > lastDate) break;
      dates.push(date);
    }
  }
  return { updatedAt: null, dates, movies };
}

async function fetchScheduleText(): Promise<string> {
  // Matches the <link rel="preload"> in index.html, so this reuses that in-flight request.
  const response = await fetch(scheduleUrl(API_ORIGIN));
  if (response.ok) return response.text();

  const legacy = await fetch(legacyMoviesUrl(API_ORIGIN));
  if (!legacy.ok) throw new Error(`HTTP error! status: ${legacy.status}`);
  return JSON.stringify(scheduleFromMovies(await legacy.json()));
}

/**
 * Renders the last known schedule instantly from localStorage, then revalidates it
 * in the background and re-renders only if the data actually changed.
 */
export function useSchedule(): { schedule: Schedule | null; error: boolean } {
  const [state, setState] = useState(() => {
    const cached = readCachedSchedule();
    return { schedule: cached?.schedule ?? null, text: cached?.text ?? null, error: false };
  });

  useEffect(() => {
    let cancelled = false;

    fetchScheduleText()
      .then((text) => {
        const schedule: unknown = JSON.parse(text);
        if (cancelled || !isSchedule(schedule)) return;
        writeCachedSchedule(text);
        setState((current) => (current.text === text ? current : { schedule, text, error: false }));
      })
      .catch((err) => {
        console.error('Error fetching movies:', err);
        if (!cancelled) setState((current) => (current.schedule ? current : { ...current, error: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { schedule: state.schedule, error: state.error };
}
