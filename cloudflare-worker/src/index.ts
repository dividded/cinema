export interface Env {
  MOVIES_KV: KVNamespace;
  MOVIES_KV_KEY: string;
  /** Backend endpoint that scrapes the cinematheque and returns per-day results. */
  SCRAPE_URL: string;
  /** How many days ahead to fetch on each refresh. */
  FETCH_DAYS: string;
}

interface Screening {
  dateTime: string;
  venue: string;
}

interface Movie {
  title: string;
  screenings: Screening[];
  [field: string]: unknown;
}

interface DayResult {
  date: string;
  ok: boolean;
  movies: Movie[];
  error?: string;
}

/**
 * Last successfully fetched movies per date, stored as one KV value per month and kept
 * permanently (past days are history, never deleted). Failed fetches never overwrite an entry.
 */
type DayStore = Record<string, { movies: Movie[]; fetchedAt: string }>;

/** What the frontend loads: every movie plus the dates we actually have data for. */
interface Schedule {
  updatedAt: string | null;
  dates: string[];
  movies: Movie[];
}

/** One month of past days, for the history page (same shape as the schedule). */
interface HistoryMonth {
  month: string;
  dates: string[];
  movies: Movie[];
}

/** Months that have past days, newest first. */
interface HistoryIndex {
  updatedAt: string;
  months: { month: string; days: number; movies: number }[];
}

/** Every movie ever stored (past and upcoming) with its screening times, for the list pages. */
interface ScreenedIndex {
  updatedAt: string;
  movies: { title: string; altName?: string; year?: number; siteUrl?: string; screenings: string[] }[];
}

interface RefreshMeta {
  updatedAt: string;
  movieCount: number;
  screeningCount: number;
  firstScreeningDate: string | null;
  lastScreeningDate: string | null;
  knownDates: number;
  failedDates: string[];
  missingDates: string[];
  /** Month keys written by this refresh; earlier months stay in KV as history. */
  monthsWritten: string[];
}

const REFRESH_TIMEOUT_MS = 5 * 60 * 1000;
// Manual refreshes trigger dozens of upstream requests, so don't let them be spammed.
const MANUAL_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
// Browsers reuse data for a minute, then serve it stale while revalidating with the ETag.
const DATA_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=86400';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
  'Access-Control-Expose-Headers': 'ETag',
};

const keys = (env: Env) => ({
  movies: env.MOVIES_KV_KEY,
  month: (month: string) => `${env.MOVIES_KV_KEY}:month:${month}`,
  schedule: `${env.MOVIES_KV_KEY}:schedule`,
  meta: `${env.MOVIES_KV_KEY}:meta`,
  monthPrefix: `${env.MOVIES_KV_KEY}:month:`,
  history: `${env.MOVIES_KV_KEY}:history`,
  screened: `${env.MOVIES_KV_KEY}:screened`,
  /** Single all-days store used before per-month storage; migrated on the next refresh. */
  legacyDays: `${env.MOVIES_KV_KEY}:days`,
});

function jsonResponse(body: unknown, status = 200, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': cacheControl },
  });
}

/** Serves cacheable JSON with an ETag so repeat requests can be answered with a tiny 304. */
async function cachedJsonResponse(request: Request, json: string): Promise<Response> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(json));
  const etag = `"${[...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')}"`;
  const headers = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Cache-Control': DATA_CACHE_CONTROL,
    ETag: etag,
  };

  // Cloudflare's edge weakens the ETag (W/"...") when it compresses the response, so
  // browsers send the weak form back; compare ignoring the W/ prefix.
  const ifNoneMatch = request.headers.get('If-None-Match') ?? '';
  if (ifNoneMatch.split(',').some(tag => tag.trim().replace(/^W\//, '') === etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(json, { status: 200, headers });
}

const monthOf = (date: string) => date.slice(0, 7);

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function todayInIsrael(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const screeningDate = (screening: Screening) => screening.dateTime.slice(0, 10);

/** Combines movies with the same title into one entry holding all of their screenings. */
function mergeMovies(movies: Movie[]): Movie[] {
  const byTitle = new Map<string, Movie>();
  for (const movie of movies) {
    const existing = byTitle.get(movie.title);
    if (!existing) {
      byTitle.set(movie.title, { ...movie, screenings: [...movie.screenings] });
      continue;
    }
    for (const screening of movie.screenings) {
      const duplicate = existing.screenings.some(
        s => s.dateTime === screening.dateTime && s.venue === screening.venue,
      );
      if (!duplicate) existing.screenings.push(screening);
    }
  }
  return [...byTitle.values()];
}

/** Splits a merged movie list back into per-date entries (used once, to seed the day store). */
function daysFromMovies(movies: Movie[], fetchedAt: string): DayStore {
  const moviesByDate: Record<string, Movie[]> = {};
  for (const movie of movies) {
    for (const screening of movie.screenings) {
      (moviesByDate[screeningDate(screening)] ??= []).push({ ...movie, screenings: [screening] });
    }
  }
  return Object.fromEntries(
    Object.entries(moviesByDate).map(([date, dayMovies]) => [date, { movies: mergeMovies(dayMovies), fetchedAt }]),
  );
}

function isDayResultList(value: unknown): value is DayResult[] {
  return (
    Array.isArray(value) &&
    value.every(
      d =>
        typeof d?.date === 'string' &&
        typeof d?.ok === 'boolean' &&
        Array.isArray(d?.movies) &&
        d.movies.every((m: Movie) => typeof m?.title === 'string' && Array.isArray(m?.screenings)),
    )
  );
}

function summarize(schedule: Schedule, results: DayResult[], store: DayStore, months: string[]): RefreshMeta {
  const dates = schedule.movies.flatMap(m => m.screenings.map(screeningDate)).sort();
  const failedDates = results.filter(d => !d.ok).map(d => d.date);

  return {
    updatedAt: schedule.updatedAt!,
    movieCount: schedule.movies.length,
    screeningCount: dates.length,
    firstScreeningDate: dates[0] ?? null,
    lastScreeningDate: dates[dates.length - 1] ?? null,
    knownDates: schedule.dates.length,
    failedDates,
    missingDates: failedDates.filter(date => !store[date]),
    monthsWritten: months,
  };
}

const MIGRATED = Symbol('migrated');

/**
 * Loads the per-month day stores. Months that don't exist yet are seeded once from the
 * older single-key store (or, before that existed, from the merged movie list).
 */
async function loadMonthStores(
  env: Env,
  months: string[],
  now: string,
): Promise<Record<string, DayStore> & { [MIGRATED]?: boolean }> {
  const k = keys(env);
  const stores: Record<string, DayStore> & { [MIGRATED]?: boolean } = {};
  const loaded = await Promise.all(months.map(month => env.MOVIES_KV.get<DayStore>(k.month(month), 'json')));

  let legacy: DayStore | null = null;
  if (loaded.some(store => store === null)) {
    legacy = await env.MOVIES_KV.get<DayStore>(k.legacyDays, 'json');
    if (legacy) stores[MIGRATED] = true;
    legacy ??= daysFromMovies((await env.MOVIES_KV.get<Movie[]>(k.movies, 'json')) ?? [], now);
  }

  for (const [i, month] of months.entries()) {
    stores[month] =
      loaded[i] ??
      Object.fromEntries(Object.entries(legacy ?? {}).filter(([date]) => monthOf(date) === month));
  }
  return stores;
}

/**
 * Scrapes the upcoming days and merges them into the stored days. Days that failed keep
 * their previous data, past days are kept as history, and a scrape that found nothing at
 * all is rejected outright. The served schedule only contains today onwards.
 */
async function refreshMovies(env: Env): Promise<RefreshMeta> {
  const url = new URL(env.SCRAPE_URL);
  url.searchParams.set('days', env.FETCH_DAYS);

  const response = await fetch(url, { signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Scrape endpoint returned ${response.status}`);
  }

  const { days: results } = (await response.json()) as { days?: unknown };
  if (!isDayResultList(results)) {
    throw new Error('Scrape endpoint returned an unexpected payload');
  }
  if (!results.some(d => d.ok && d.movies.length > 0)) {
    throw new Error('Scrape returned no movies; keeping existing data');
  }

  const k = keys(env);
  const now = new Date().toISOString();
  const today = todayInIsrael();

  // Load every month this refresh can touch: the fetch window plus any returned dates.
  const months = new Set(results.map(day => monthOf(day.date)));
  for (let i = 0; i < Number(env.FETCH_DAYS); i++) months.add(monthOf(addDays(today, i)));

  const stores = await loadMonthStores(env, [...months], now);
  for (const day of results) {
    if (day.ok) stores[monthOf(day.date)][day.date] = { movies: day.movies, fetchedAt: now };
  }

  const store: DayStore = Object.assign({}, ...Object.values(stores));
  const dates = Object.keys(store).filter(date => date >= today).sort();
  const schedule: Schedule = {
    updatedAt: now,
    dates,
    movies: mergeMovies(dates.flatMap(date => store[date].movies)),
  };
  const meta = summarize(schedule, results, store, Object.keys(stores).sort());

  await Promise.all([
    ...Object.entries(stores).map(([month, monthStore]) => env.MOVIES_KV.put(k.month(month), JSON.stringify(monthStore))),
    env.MOVIES_KV.put(k.schedule, JSON.stringify(schedule)),
    env.MOVIES_KV.put(k.movies, JSON.stringify(schedule.movies)),
    env.MOVIES_KV.put(k.meta, JSON.stringify(meta)),
  ]);
  if (stores[MIGRATED]) await env.MOVIES_KV.delete(k.legacyDays);
  await rebuildHistoryIndexes(env, stores);
  return meta;
}

/** Every month key in KV (KV lists at most 1000 keys per call, about 80 years of months). */
async function listMonths(env: Env): Promise<string[]> {
  const prefix = keys(env).monthPrefix;
  const months: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MOVIES_KV.list({ prefix, cursor });
    months.push(...page.keys.map(key => key.name.slice(prefix.length)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return months.filter(month => /^\d{4}-\d{2}$/.test(month)).sort();
}

/** The past days (before today) of one stored month, merged into one movie per title. */
function historyMonth(month: string, store: DayStore, today: string): HistoryMonth {
  const dates = Object.keys(store)
    .filter(date => date < today && store[date].movies.length > 0)
    .sort()
    .reverse();
  return { month, dates, movies: mergeMovies(dates.flatMap(date => store[date].movies)) };
}

/**
 * Rebuilds the history month list and the all-time screenings index from every stored month.
 * Months already loaded by a refresh can be passed in to save reading them again.
 */
async function rebuildHistoryIndexes(
  env: Env,
  loaded: Record<string, DayStore> = {},
): Promise<{ history: HistoryIndex; screened: ScreenedIndex }> {
  const k = keys(env);
  const months = [...new Set([...(await listMonths(env)), ...Object.keys(loaded)])].sort();
  const stores = await Promise.all(
    months.map(async month => loaded[month] ?? (await env.MOVIES_KV.get<DayStore>(k.month(month), 'json')) ?? {}),
  );
  const today = todayInIsrael();
  const now = new Date().toISOString();

  const history: HistoryIndex = { updatedAt: now, months: [] };
  const byTitle = new Map<string, ScreenedIndex['movies'][number]>();
  for (const [i, month] of months.entries()) {
    const past = historyMonth(month, stores[i], today);
    if (past.dates.length > 0) {
      history.months.push({ month, days: past.dates.length, movies: past.movies.length });
    }
    for (const date of Object.keys(stores[i]).sort()) {
      for (const movie of stores[i][date].movies) {
        let entry = byTitle.get(movie.title);
        if (!entry) {
          entry = { title: movie.title, screenings: [] };
          for (const field of ['altName', 'year', 'siteUrl'] as const) {
            if (movie[field] != null) (entry as Record<string, unknown>)[field] = movie[field];
          }
          byTitle.set(movie.title, entry);
        }
        for (const screening of movie.screenings) {
          if (!entry.screenings.includes(screening.dateTime)) entry.screenings.push(screening.dateTime);
        }
      }
    }
  }
  history.months.reverse();
  const screened: ScreenedIndex = { updatedAt: now, movies: [...byTitle.values()] };
  for (const movie of screened.movies) movie.screenings.sort();

  await Promise.all([
    env.MOVIES_KV.put(k.history, JSON.stringify(history)),
    env.MOVIES_KV.put(k.screened, JSON.stringify(screened)),
  ]);
  return { history, screened };
}

/** Serves a stored index, building it first if no refresh has written it yet. */
async function handleHistoryIndex(request: Request, env: Env, which: 'history' | 'screened'): Promise<Response> {
  const stored = await env.MOVIES_KV.get(keys(env)[which]);
  const json = stored ?? JSON.stringify((await rebuildHistoryIndexes(env))[which]);
  return cachedJsonResponse(request, json);
}

async function handleHistoryMonth(request: Request, env: Env, month: string): Promise<Response> {
  const store = await env.MOVIES_KV.get<DayStore>(keys(env).month(month), 'json');
  if (!store) return jsonResponse({ error: 'No data for this month' }, 404);
  return cachedJsonResponse(request, JSON.stringify(historyMonth(month, store, todayInIsrael())));
}

async function handleSchedule(request: Request, env: Env): Promise<Response> {
  const k = keys(env);
  const scheduleJson = await env.MOVIES_KV.get(k.schedule);
  if (scheduleJson) return cachedJsonResponse(request, scheduleJson);

  // Before the first refresh with per-day data, derive the dates from the movie list.
  const movies = await env.MOVIES_KV.get<Movie[]>(k.movies, 'json');
  if (!movies) return jsonResponse({ error: 'No movie data available yet' }, 503);

  const today = todayInIsrael();
  const dates = [...new Set(movies.flatMap(m => m.screenings.map(screeningDate)))]
    .filter(date => date >= today)
    .sort();
  const schedule: Schedule = { updatedAt: null, dates, movies };
  return cachedJsonResponse(request, JSON.stringify(schedule));
}

async function handleManualRefresh(env: Env): Promise<Response> {
  const previous = await env.MOVIES_KV.get<RefreshMeta>(keys(env).meta, 'json');
  const sinceLast = previous ? Date.now() - Date.parse(previous.updatedAt) : Infinity;
  if (sinceLast < MANUAL_REFRESH_COOLDOWN_MS) {
    return jsonResponse({ error: 'Refreshed recently, try again later', ...previous }, 429);
  }

  try {
    return jsonResponse(await refreshMovies(env));
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);

    if (request.method === 'GET' && pathname === '/api/schedule') {
      return handleSchedule(request, env);
    }

    if (request.method === 'GET' && (pathname === '/' || pathname === '/api/movies/cinematheque')) {
      const moviesJson = await env.MOVIES_KV.get(keys(env).movies);
      return moviesJson
        ? cachedJsonResponse(request, moviesJson)
        : jsonResponse({ error: 'No movie data available yet' }, 503);
    }

    if (request.method === 'GET' && pathname === '/api/health') {
      const meta = await env.MOVIES_KV.get(keys(env).meta);
      return meta
        ? new Response(meta, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
        : jsonResponse({ error: 'Not refreshed by the worker yet' }, 503);
    }

    if (request.method === 'GET' && pathname === '/api/history') {
      return handleHistoryIndex(request, env, 'history');
    }

    const monthMatch = /^\/api\/history\/(\d{4}-\d{2})$/.exec(pathname);
    if (request.method === 'GET' && monthMatch) {
      return handleHistoryMonth(request, env, monthMatch[1]);
    }

    if (request.method === 'GET' && pathname === '/api/screened') {
      return handleHistoryIndex(request, env, 'screened');
    }

    if (request.method === 'POST' && pathname === '/api/refresh') {
      return handleManualRefresh(env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Throwing marks the cron run as failed in the Cloudflare dashboard.
    ctx.waitUntil(
      refreshMovies(env).then(meta => {
        console.log(`Cron ${controller.cron}: refreshed`, JSON.stringify(meta));
      }),
    );
  },
};
