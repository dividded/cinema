This project is for fetching movie screening data and displaying it will filtering capabilities.
The project aggregates data from multiple sites and also merges film data from top movie lists. 

## Data refresh

The frontend reads movies from the Cloudflare Worker (`cloudflare-worker/`), which serves them from KV.
A cron trigger in `cloudflare-worker/wrangler.toml` calls the backend's refresh endpoint twice a day and
stores the result; an empty or failed scrape never overwrites existing data.

- `GET /api/health` shows when the data was last refreshed and the screening date range.
- `POST /api/refresh` triggers a refresh on demand (rate-limited to once per 5 minutes).

Pushes to `main` that touch the worker deploy it via `.github/workflows/deploy-worker.yml`, then refresh and
verify the data. The workflow needs the `CLOUDFLARE_API_TOKEN` (with *Workers Scripts: Edit* and
*Workers KV Storage: Edit*) and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
