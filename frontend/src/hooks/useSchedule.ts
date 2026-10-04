import { useEffect, useState } from 'react';
import { scheduleUrl } from '../config/api';
import { API_ORIGIN } from '../config/origin';
import { Schedule, ScheduleSchema } from '../types/movie';

const STORAGE_KEY = 'cinema:schedule:v1';

/** Parses schedule JSON, or null if it isn't a valid schedule. */
function parseSchedule(text: string): Schedule | null {
  try {
    const parsed = ScheduleSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function readCachedSchedule(): { text: string; schedule: Schedule } | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text === null) return null;
    const schedule = parseSchedule(text);
    return schedule ? { text, schedule } : null;
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

async function fetchScheduleText(): Promise<string> {
  // Matches the <link rel="preload"> in index.html, so this reuses that in-flight request.
  const response = await fetch(scheduleUrl(API_ORIGIN));
  if (!response.ok) throw new Error(`Schedule request failed with status ${response.status}`);
  return response.text();
}

interface ScheduleState {
  schedule: Schedule | null;
  text: string | null;
  error: boolean;
}

/**
 * Renders the last known schedule instantly from localStorage, then revalidates it
 * in the background and re-renders only if the data actually changed.
 */
export function useSchedule(): { schedule: Schedule | null; error: boolean } {
  const [state, setState] = useState((): ScheduleState => {
    const cached = readCachedSchedule();
    return { schedule: cached?.schedule ?? null, text: cached?.text ?? null, error: false };
  });

  useEffect(() => {
    let cancelled = false;

    fetchScheduleText()
      .then((text) => {
        const schedule = parseSchedule(text);
        if (cancelled) return;
        if (!schedule) throw new Error('The schedule has an unexpected shape');
        writeCachedSchedule(text);
        setState((current) => (current.text === text ? current : { schedule, text, error: false }));
      })
      .catch((err: unknown) => {
        console.error('Error fetching movies:', err);
        if (!cancelled) setState((current) => (current.schedule ? current : { ...current, error: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { schedule: state.schedule, error: state.error };
}
