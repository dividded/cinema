export interface Env {
  MOVIES_KV: KVNamespace;
  MOVIES_KV_KEY: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const isMoviesRoute =
      url.pathname === '/' ||
      url.pathname === '/api/movies/cinematheque';

    if (request.method !== 'GET' || !isMoviesRoute) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    const moviesJson = await env.MOVIES_KV.get(env.MOVIES_KV_KEY);
    if (!moviesJson) {
      return jsonResponse({ error: 'No movie data available yet' }, 503);
    }

    return new Response(moviesJson, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  },
};
