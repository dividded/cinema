// Shared by the app and vite.config.ts (which preloads the schedule in index.html),
// so this file must not use import.meta.env.

const PRODUCTION_API_ORIGIN = 'https://cinema-api.cinematheque.workers.dev';
const DEVELOPMENT_API_ORIGIN = 'http://localhost:8787'; // `yarn dev` in cloudflare-worker/

/** VITE_API_URL may be an origin or (as it used to be) a full endpoint URL. */
export function resolveApiOrigin(apiUrl: string | undefined, mode: string): string {
  if (apiUrl) return new URL(apiUrl).origin;
  return mode === 'development' ? DEVELOPMENT_API_ORIGIN : PRODUCTION_API_ORIGIN;
}

export const scheduleUrl = (origin: string) => `${origin}/api/schedule`;
export const legacyMoviesUrl = (origin: string) => `${origin}/api/movies/cinematheque`;
