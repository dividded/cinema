export interface Env {
  MOVIES_KV: KVNamespace;
  MOVIES_KV_KEY: string;
  /** Backend endpoint that scrapes the cinematheque and returns fresh movies. */
  REFRESH_URL: string;
}

interface Screening {
  dateTime: string;
}

interface Movie {
  title: string;
  screenings: Screening[];
}

interface RefreshMeta {
  updatedAt: string;
  movieCount: number;
  screeningCount: number;
  firstScreeningDate: string | null;
  lastScreeningDate: string | null;
}

const REFRESH_TIMEOUT_MS = 5 * 60 * 1000;
// Manual refreshes trigger ~30 upstream requests, so don't let them be spammed.
const MANUAL_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body: unknown, status = 200, cacheControl = 'public, max-age=300'): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  });
}

const metaKey = (env: Env) => `${env.MOVIES_KV_KEY}:meta`;

async function readMeta(env: Env): Promise<RefreshMeta | null> {
  return env.MOVIES_KV.get<RefreshMeta>(metaKey(env), 'json');
}

function isMovieList(value: unknown): value is Movie[] {
  return (
    Array.isArray(value) &&
    value.every(m => typeof m?.title === 'string' && Array.isArray(m?.screenings))
  );
}

function summarize(movies: Movie[]): RefreshMeta {
  const dates = movies
    .flatMap(m => m.screenings.map(s => s.dateTime.slice(0, 10)))
    .sort();

  return {
    updatedAt: new Date().toISOString(),
    movieCount: movies.length,
    screeningCount: dates.length,
    firstScreeningDate: dates[0] ?? null,
    lastScreeningDate: dates[dates.length - 1] ?? null,
  };
}

/**
 * Asks the backend to scrape fresh movies and stores them in KV.
 * An empty or malformed result is rejected so a failed scrape never wipes the site.
 */
async function refreshMovies(env: Env): Promise<RefreshMeta> {
  const response = await fetch(env.REFRESH_URL, {
    signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Refresh endpoint returned ${response.status}`);
  }

  const movies: unknown = await response.json();
  if (!isMovieList(movies) || movies.length === 0) {
    throw new Error('Refresh endpoint returned no movies; keeping existing data');
  }

  const meta = summarize(movies);
  await env.MOVIES_KV.put(env.MOVIES_KV_KEY, JSON.stringify(movies));
  await env.MOVIES_KV.put(metaKey(env), JSON.stringify(meta));
  return meta;
}

async function handleManualRefresh(env: Env): Promise<Response> {
  const previous = await readMeta(env);
  const sinceLast = previous ? Date.now() - Date.parse(previous.updatedAt) : Infinity;
  if (sinceLast < MANUAL_REFRESH_COOLDOWN_MS) {
    return jsonResponse({ error: 'Refreshed recently, try again later', ...previous }, 429, 'no-store');
  }

  try {
    return jsonResponse(await refreshMovies(env), 200, 'no-store');
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 502, 'no-store');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);

    if (request.method === 'GET' && (pathname === '/' || pathname === '/api/movies/cinematheque')) {
      const moviesJson = await env.MOVIES_KV.get(env.MOVIES_KV_KEY);
      return moviesJson
        ? jsonResponse(moviesJson)
        : jsonResponse({ error: 'No movie data available yet' }, 503);
    }

    if (request.method === 'GET' && pathname === '/api/health') {
      const meta = await readMeta(env);
      return meta
        ? jsonResponse(meta, 200, 'no-store')
        : jsonResponse({ error: 'Not refreshed by the worker yet' }, 503, 'no-store');
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
