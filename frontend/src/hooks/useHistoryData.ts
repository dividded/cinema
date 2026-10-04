import { useEffect, useState } from 'react';
import { z } from 'zod';
import { historyMonthUrl, historyUrl, screenedUrl } from '../config/api';
import { API_ORIGIN } from '../config/origin';
import {
  HistoryIndexSchema,
  HistoryMonth,
  HistoryMonthSchema,
  HistoryMonthSummary,
  ScreenedIndexSchema,
  ScreenedMovie,
} from '../types/movie';

const requests = new Map<string, Promise<unknown>>();

/** Fetches and validates JSON once per page load (the browser revalidates it with the ETag). */
function fetchOnce<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      const data: unknown = await response.json();
      return data;
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request.then((data) => schema.parse(data));
}

export const fetchHistoryIndex = (): Promise<HistoryMonthSummary[]> =>
  fetchOnce(historyUrl(API_ORIGIN), HistoryIndexSchema).then((index) => index.months);

export const fetchHistoryMonth = (month: string): Promise<HistoryMonth> =>
  fetchOnce(historyMonthUrl(API_ORIGIN, month), HistoryMonthSchema);

export const fetchScreened = (): Promise<ScreenedMovie[]> =>
  fetchOnce(screenedUrl(API_ORIGIN), ScreenedIndexSchema).then((index) => index.movies);

interface Loadable<T> {
  data: T | null;
  error: boolean;
}

/** Loads something once on mount; data stays null until it arrives. */
export function useLoaded<T>(load: () => Promise<T>): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ data: null, error: false });
  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setState({ data, error: false });
      },
      (err: unknown) => {
        console.error(err);
        if (!cancelled) setState({ data: null, error: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load]);
  return state;
}
