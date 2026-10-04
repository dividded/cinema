import { z } from 'zod';

export interface Env {
  MOVIES_KV: KVNamespace;
  MOVIES_KV_KEY: string;
  /** Backend endpoint that scrapes the cinematheque and returns per-day results. */
  SCRAPE_URL: string;
  /** How many days ahead to fetch on each refresh. */
  FETCH_DAYS: string;
}

const ScreeningSchema = z.looseObject({ dateTime: z.string(), venue: z.string() });
type Screening = z.infer<typeof ScreeningSchema>;

/** Movies keep every field the scraper sends; these are the ones the worker reads. */
const MovieSchema = z.looseObject({
  title: z.string(),
  screenings: z.array(ScreeningSchema),
  altName: z.string().optional(),
  year: z.number().optional(),
  siteUrl: z.string().optional(),
});
type Movie = z.infer<typeof MovieSchema>;

const DayResultSchema = z.object({
  date: z.string(),
  ok: z.boolean(),
  movies: z.array(MovieSchema),
  error: z.string().optional(),
});
type DayResult = z.infer<typeof DayResultSchema>;

const ScrapeResponseSchema = z.object({ days: z.array(DayResultSchema) });

/**
 * Last successfully fetched movies per date, stored as one KV value per month and kept
 * permanently (past days are history, never deleted). Failed fetches never overwrite an entry.
 */
const DayStoreSchema = z.record(z.string(), z.object({ movies: z.array(MovieSchema), fetchedAt: z.string() }));
type DayStore = z.infer<typeof DayStoreSchema>;

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

const RefreshMetaSchema = z.object({
  updatedAt: z.string(),
  movieCount: z.number(),
  screeningCount: z.number(),
  firstScreeningDate: z.string().nullable(),
  lastScreeningDate: z.string().nullable(),
  knownDates: z.number(),
  failedDates: z.array(z.string()),
  missingDates: z.array(z.string()),
  /** Month keys written by this refresh; earlier months stay in KV as history. */
  monthsWritten: z.array(z.string()),
});
type RefreshMeta = z.infer<typeof RefreshMetaSchema>;

/** Reads and validates a JSON value from KV; null when it is missing or not the expected shape. */
async function readJson<T>(kv: KVNamespace, key: string, schema: z.ZodType<T>): Promise<T | null> {
  const text = await kv.get(key);
  if (text === null) return null;
  const parsed = schema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    console.error(`KV value ${key} has an unexpected shape`, parsed.error.message);
    return null;
  }
  return parsed.data;
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
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
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

function summarize(
  updatedAt: string,
  schedule: Schedule,
  results: DayResult[],
  store: DayStore,
  months: string[],
): RefreshMeta {
  const dates = schedule.movies.flatMap(m => m.screenings.map(screeningDate)).sort();
  const failedDates = results.filter(d => !d.ok).map(d => d.date);

  return {
    updatedAt,
    movieCount: schedule.movies.length,
    screeningCount: dates.length,
    firstScreeningDate: dates[0] ?? null,
    lastScreeningDate: dates[dates.length - 1] ?? null,
    knownDates: schedule.dates.length,
    failedDates,
    missingDates: failedDates.filter(date => !(date in store)),
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
  const loaded = await Promise.all(months.map(month => readJson(env.MOVIES_KV, k.month(month), DayStoreSchema)));

  let legacy: DayStore | null = null;
  if (loaded.some(store => store === null)) {
    legacy = await readJson(env.MOVIES_KV, k.legacyDays, DayStoreSchema);
    if (legacy) stores[MIGRATED] = true;
    legacy ??= daysFromMovies((await readJson(env.MOVIES_KV, k.movies, z.array(MovieSchema))) ?? [], now);
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
    throw new Error(`Scrape endpoint returned ${String(response.status)}`);
  }

  const payload = ScrapeResponseSchema.safeParse(await response.json());
  if (!payload.success) {
    throw new Error(`Scrape endpoint returned an unexpected payload: ${payload.error.message}`);
  }
  const results = payload.data.days;
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
    const monthStore = (stores[monthOf(day.date)] ??= {});
    if (day.ok) monthStore[day.date] = { movies: day.movies, fetchedAt: now };
  }

  const store: DayStore = Object.fromEntries(Object.values(stores).flatMap(monthStore => Object.entries(monthStore)));
  const upcoming = Object.entries(store)
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b));
  const schedule: Schedule = {
    updatedAt: now,
    dates: upcoming.map(([date]) => date),
    movies: mergeMovies(upcoming.flatMap(([, day]) => day.movies)),
  };
  const meta = summarize(now, schedule, results, store, Object.keys(stores).sort());

  await Promise.all([
    ...Object.entries(stores).map(([month, monthStore]) => env.MOVIES_KV.put(k.month(month), JSON.stringify(monthStore))),
    env.MOVIES_KV.put(k.schedule, JSON.stringify(schedule)),
    env.MOVIES_KV.put(k.movies, JSON.stringify(schedule.movies)),
    env.MOVIES_KV.put(k.meta, JSON.stringify(meta)),
  ]);
  if (stores[MIGRATED] === true) await env.MOVIES_KV.delete(k.legacyDays);
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
  } while (cursor !== undefined);
  return months.filter(month => /^\d{4}-\d{2}$/.test(month)).sort();
}

/** The past days (before today) of one stored month, merged into one movie per title. */
function historyMonth(month: string, store: DayStore, today: string): HistoryMonth {
  const past = Object.entries(store)
    .filter(([date, day]) => date < today && day.movies.length > 0)
    .sort(([a], [b]) => b.localeCompare(a));
  return { month, dates: past.map(([date]) => date), movies: mergeMovies(past.flatMap(([, day]) => day.movies)) };
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
    months.map(async month => loaded[month] ?? (await readJson(env.MOVIES_KV, k.month(month), DayStoreSchema)) ?? {}),
  );
  const today = todayInIsrael();
  const now = new Date().toISOString();

  const history: HistoryIndex = { updatedAt: now, months: [] };
  const byTitle = new Map<string, ScreenedIndex['movies'][number]>();
  for (const [i, month] of months.entries()) {
    const monthStore = stores[i] ?? {};
    const past = historyMonth(month, monthStore, today);
    if (past.dates.length > 0) {
      history.months.push({ month, days: past.dates.length, movies: past.movies.length });
    }
    const days = Object.entries(monthStore).sort(([a], [b]) => a.localeCompare(b));
    for (const [, day] of days) {
      for (const movie of day.movies) {
        let entry = byTitle.get(movie.title);
        if (!entry) {
          entry = {
            title: movie.title,
            ...(movie.altName != null && { altName: movie.altName }),
            ...(movie.year != null && { year: movie.year }),
            ...(movie.siteUrl != null && { siteUrl: movie.siteUrl }),
            screenings: [],
          };
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
  const store = await readJson(env.MOVIES_KV, keys(env).month(month), DayStoreSchema);
  if (!store) return jsonResponse({ error: 'No data for this month' }, 404);
  return cachedJsonResponse(request, JSON.stringify(historyMonth(month, store, todayInIsrael())));
}

async function handleSchedule(request: Request, env: Env): Promise<Response> {
  const k = keys(env);
  const scheduleJson = await env.MOVIES_KV.get(k.schedule);
  if (scheduleJson !== null) return cachedJsonResponse(request, scheduleJson);

  // Before the first refresh with per-day data, derive the dates from the movie list.
  const movies = await readJson(env.MOVIES_KV, k.movies, z.array(MovieSchema));
  if (!movies) return jsonResponse({ error: 'No movie data available yet' }, 503);

  const today = todayInIsrael();
  const dates = [...new Set(movies.flatMap(m => m.screenings.map(screeningDate)))]
    .filter(date => date >= today)
    .sort();
  const schedule: Schedule = { updatedAt: null, dates, movies };
  return cachedJsonResponse(request, JSON.stringify(schedule));
}

async function handleManualRefresh(env: Env): Promise<Response> {
  const previous = await readJson(env.MOVIES_KV, keys(env).meta, RefreshMetaSchema);
  const sinceLast = previous ? Date.now() - Date.parse(previous.updatedAt) : Infinity;
  if (sinceLast < MANUAL_REFRESH_COOLDOWN_MS) {
    return jsonResponse({ error: 'Refreshed recently, try again later', ...previous }, 429);
  }

  try {
    return jsonResponse(await refreshMovies(env));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 502);
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
      return moviesJson !== null
        ? cachedJsonResponse(request, moviesJson)
        : jsonResponse({ error: 'No movie data available yet' }, 503);
    }

    if (request.method === 'GET' && pathname === '/api/health') {
      const meta = await env.MOVIES_KV.get(keys(env).meta);
      return meta !== null
        ? new Response(meta, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
        : jsonResponse({ error: 'Not refreshed by the worker yet' }, 503);
    }

    if (request.method === 'GET' && pathname === '/api/history') {
      return handleHistoryIndex(request, env, 'history');
    }

    const monthMatch = /^\/api\/history\/(\d{4}-\d{2})$/.exec(pathname);
    const month = monthMatch?.[1];
    if (request.method === 'GET' && month !== undefined) {
      return handleHistoryMonth(request, env, month);
    }

    if (request.method === 'GET' && pathname === '/api/screened') {
      return handleHistoryIndex(request, env, 'screened');
    }

    if (request.method === 'POST' && pathname === '/api/refresh') {
      return handleManualRefresh(env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },

  scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    // Throwing marks the cron run as failed in the Cloudflare dashboard.
    ctx.waitUntil(
      refreshMovies(env).then(meta => {
        console.log(`Cron ${controller.cron}: refreshed`, JSON.stringify(meta));
      }),
    );
  },
};
