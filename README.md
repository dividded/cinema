This project is for fetching movie screening data and displaying it will filtering capabilities.
The project aggregates data from multiple sites and also merges film data from top movie lists. 

## Data refresh

The frontend reads movies from the Cloudflare Worker (`cloudflare-worker/`), which serves them from KV.
A cron trigger in `cloudflare-worker/wrangler.toml` calls the backend's refresh endpoint twice a day and
stores the result; an empty or failed scrape never overwrites existing data.

- `GET /api/health` shows when the data was last refreshed and the screening date range.
- `POST /api/refresh` triggers a refresh on demand (rate-limited to once per 5 minutes).

Deployment uses Cloudflare Workers Builds, so no Cloudflare keys live in GitHub. In the Cloudflare dashboard,
open the `cinema-api` worker → **Settings → Builds → Connect** this repo, with root directory `cloudflare-worker`
and deploy command `yarn deploy` (deploys, then refreshes and verifies the data). GitHub Actions
(`.github/workflows/check-worker.yml`) type-checks and validates the worker on every push.
