// Shared by the app and vite.config.ts (which preloads the schedule in index.html), so the
// URL helpers must not use import.meta.env; API_ORIGIN is only read by the app.

const PRODUCTION_API_ORIGIN = 'https://cinema-api.cinematheque.workers.dev';
const DEVELOPMENT_API_ORIGIN = 'http://localhost:8787'; // `yarn dev` in cloudflare-worker/

/** VITE_API_URL may be an origin or (as it used to be) a full endpoint URL. */
export function resolveApiOrigin(apiUrl: string | undefined, mode: string): string {
  if (apiUrl !== undefined && apiUrl !== '') return new URL(apiUrl).origin;
  return mode === 'development' ? DEVELOPMENT_API_ORIGIN : PRODUCTION_API_ORIGIN;
}

export const scheduleUrl = (origin: string): string => `${origin}/api/schedule`;
export const historyUrl = (origin: string): string => `${origin}/api/history`;
export const historyMonthUrl = (origin: string, month: string): string => `${origin}/api/history/${month}`;
export const screenedUrl = (origin: string): string => `${origin}/api/screened`;
