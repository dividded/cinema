import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BatchedFetcher } from '../../services/BatchedFetcher';

const scheduleHtml = fs.readFileSync(
  path.join(__dirname, '../../__fixtures__/cinema_co_il_schedule.html'),
  'utf-8'
);

const htmlResponse = (body: string, status = 200) => Promise.resolve(new Response(body, { status }));

const requestUrl = (input: string | URL | Request): URL =>
  new URL(input instanceof Request ? input.url : input);

describe('BatchedFetcher.fetchDays', () => {
  const fetcher = new BatchedFetcher({ batchSize: 5, minBatchDelayMs: 0, maxBatchDelayMs: 0, retryRounds: 1, retryDelayMs: 0 });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports each day separately so failed days can keep previous data', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input) => {
      const date = requestUrl(input).searchParams.get('date');
      if (date === '2025-01-26') return htmlResponse('Server error', 500);
      if (date === '2025-01-27') return htmlResponse('<html><body>Maintenance</body></html>');
      if (date === '2025-01-28') {
        return htmlResponse('<html><body><span class="main-date">שלישי 28.01.25</span></body></html>');
      }
      return htmlResponse(scheduleHtml);
    });

    const days = await fetcher.fetchDays(['2025-01-25', '2025-01-26', '2025-01-27', '2025-01-28']);
    const byDate = Object.fromEntries(days.map(day => [day.date, day]));

    expect(byDate['2025-01-25']?.ok).toBe(true);
    expect(byDate['2025-01-25']?.movies.length).toBeGreaterThan(0);

    expect(byDate['2025-01-26']).toMatchObject({ ok: false, movies: [] });
    expect(byDate['2025-01-26']?.error).toContain('500');

    // A page that isn't a schedule page is a failure, not an empty day.
    expect(byDate['2025-01-27']).toMatchObject({ ok: false, movies: [] });

    // A real schedule page with no screenings is a valid empty day (e.g. a holiday).
    expect(byDate['2025-01-28']).toMatchObject({ ok: true, movies: [] });
  });
});
