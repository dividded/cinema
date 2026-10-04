import { useEffect, useState } from 'react';
import { historyMonthUrl, historyUrl, resolveApiOrigin, screenedUrl } from '../config/api';
import { Movie } from '../types/movie';

const API_ORIGIN = resolveApiOrigin(import.meta.env.VITE_API_URL, import.meta.env.MODE);

export interface HistoryMonthSummary {
  month: string;
  days: number;
  movies: number;
}

/** One month of past days, newest day first (same movie shape as the schedule). */
export interface HistoryMonth {
  month: string;
  dates: string[];
  movies: Movie[];
}

/** Every movie the cinematheque has screened (or will) since we started keeping days. */
export interface ScreenedMovie {
  title: string;
  altName?: string;
  year?: number;
  siteUrl?: string;
  /** "YYYY-MM-DD HH:MM", oldest first. */
  screenings: string[];
}

const requests = new Map<string, Promise<unknown>>();

/** Fetches JSON once per page load (and lets the browser revalidate it with the ETag). */
function fetchOnce<T>(url: string): Promise<T> {
  let request = requests.get(url) as Promise<T> | undefined;
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.json() as Promise<T>;
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request;
}

export const fetchHistoryIndex = () =>
  fetchOnce<{ months: HistoryMonthSummary[] }>(historyUrl(API_ORIGIN)).then((index) => index.months);

export const fetchHistoryMonth = (month: string) => fetchOnce<HistoryMonth>(historyMonthUrl(API_ORIGIN, month));

export const fetchScreened = () =>
  fetchOnce<{ movies: ScreenedMovie[] }>(screenedUrl(API_ORIGIN)).then((index) => index.movies);

type Loadable<T> = { data: T | null; error: boolean };

/** Loads something once when `enabled` turns true; data stays null until it arrives. */
export function useLoaded<T>(load: () => Promise<T>, enabled = true): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ data: null, error: false });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, error: false }))
      .catch((err) => {
        console.error(err);
        if (!cancelled) setState({ data: null, error: true });
      });
    return () => {
      cancelled = true;
    };
    // `load` is one of the stable fetchers above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return state;
}
