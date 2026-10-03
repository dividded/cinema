This project is for fetching movie screening data and displaying it will filtering capabilities.
The project aggregates data from multiple sites and also merges film data from top movie lists. 

## Data refresh

The frontend reads the schedule from the Cloudflare Worker (`cloudflare-worker/`), which serves it from KV.
A cron trigger in `cloudflare-worker/wrangler.toml` asks the backend (`/api/movies/cinematheque/days`) to scrape
the next `FETCH_DAYS` (45) days and merges the per-day results into what it already has:

- A day that failed to fetch (error, timeout, or the site's rate-limit page) keeps its previous data.
- A scrape that found no movies at all is rejected, so a broken scrape never wipes the site.
- Days are stored as one KV value per month and kept permanently (past days stay as history, about 60 KB
  per month, far below KV's 25 MiB value limit; KV values without an expiry never expire). The served
  schedule only contains today onwards, and the UI only lists days that were actually fetched.

The backend is a stateless scraper; the worker is the only writer to KV.

- `GET /api/schedule` returns `{ updatedAt, dates, movies }` (what the frontend uses).
- `GET /api/health` shows when the data was last refreshed, and which days failed.
- `POST /api/refresh` triggers a refresh on demand (rate-limited to once per 5 minutes).

The worker deploys from GitHub Actions (`.github/workflows/check-worker.yml`): every push is type-checked and
validated, and pushes to `main` run `yarn deploy` (deploy, then refresh and verify the data). This needs the
`CLOUDFLARE_API_TOKEN` (the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID` repository secrets;
without them the deploy job is skipped.

## Frontend loading

The page is built so everything needed for the first screen downloads in parallel with the JS bundle:

- `index.html` preloads the schedule, the two critical fonts (self-hosted; the title font is subset to its
  letters) and the background image, which an inline script picks before any JS runs.
- Backgrounds ship as AVIF with a WebP fallback (add new ones with `yarn optimize-background <image>`).
- The last schedule is kept in `localStorage` and rendered immediately, then revalidated with an ETag.
- A service worker (`public/sw.js`) serves the app from cache on repeat visits and updates it in the background,
  so a new deploy shows up on the visit after the first one following it.

For local development run the worker (`cd cloudflare-worker && yarn dev`, port 8787) and the frontend
(`cd frontend && yarn dev`); set `VITE_API_URL` to point the frontend at another API.
