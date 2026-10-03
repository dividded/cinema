#!/usr/bin/env bash
# Triggers a refresh on a deployed worker and verifies it serves fresh data.
# Usage: scripts/refresh-and-verify.sh https://cinema-api.example.workers.dev
set -euo pipefail

base="${1:-${WORKER_URL:-}}"
[[ -n "$base" ]] || { echo "usage: $0 <worker-base-url> (or set WORKER_URL)"; exit 2; }
base="${base%/}"
body="$(mktemp)"

echo "Triggering refresh on $base ..."
status="$(curl -sS -o "$body" -w '%{http_code}' -X POST --max-time 360 "$base/api/refresh")"
cat "$body"; echo
case "$status" in
  200) echo "Refresh succeeded." ;;
  429) echo "Refreshed recently; verifying existing data." ;;
  *)   echo "Refresh failed with HTTP $status"; exit 1 ;;
esac

curl -fsS "$base/api/health" | node -e '
  const meta = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const minDaysAhead = Number(process.env.MIN_DAYS_AHEAD ?? 14);
  const maxAgeSeconds = Number(process.env.MAX_AGE_SECONDS ?? 3600);
  const ageSeconds = Math.round((Date.now() - Date.parse(meta.updatedAt)) / 1000);
  const minLastDate = new Date(Date.now() + minDaysAhead * 864e5).toISOString().slice(0, 10);

  console.log("Health:", JSON.stringify(meta));
  const fail = msg => { console.error(msg); process.exit(1); };
  if (!(meta.movieCount > 0)) fail("No movies stored");
  if (!(ageSeconds <= maxAgeSeconds)) fail(`Data is ${ageSeconds}s old (max ${maxAgeSeconds}s)`);
  if (!(meta.lastScreeningDate >= minLastDate)) fail(`Last screening ${meta.lastScreeningDate} is before ${minLastDate}`);
  console.log(`OK: ${meta.movieCount} movies, updated ${ageSeconds}s ago, screenings through ${meta.lastScreeningDate}.`);
'
