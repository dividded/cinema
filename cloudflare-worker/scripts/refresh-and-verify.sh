#!/usr/bin/env bash
# Triggers a refresh on a deployed worker and verifies it serves fresh data.
# Usage: scripts/refresh-and-verify.sh https://cinema-api.example.workers.dev
set -euo pipefail

base="${1:?usage: $0 <worker-base-url>}"
base="${base%/}"
min_days_ahead="${MIN_DAYS_AHEAD:-14}"
max_age_seconds="${MAX_AGE_SECONDS:-3600}"
body="$(mktemp)"

echo "Triggering refresh on $base ..."
status="$(curl -sS -o "$body" -w '%{http_code}' -X POST --max-time 360 "$base/api/refresh")"
cat "$body"; echo
case "$status" in
  200) echo "Refresh succeeded." ;;
  429) echo "Refreshed recently; verifying existing data." ;;
  *)   echo "::error::Refresh failed with HTTP $status"; exit 1 ;;
esac

health="$(curl -fsS "$base/api/health")"
echo "Health: $health"

updated_at="$(jq -r '.updatedAt' <<<"$health")"
last_date="$(jq -r '.lastScreeningDate' <<<"$health")"
movie_count="$(jq -r '.movieCount' <<<"$health")"
age=$(( $(date -u +%s) - $(date -u -d "$updated_at" +%s) ))
min_last_date="$(date -u -d "+${min_days_ahead} days" +%F)"

[[ "$movie_count" -gt 0 ]] || { echo "::error::No movies stored"; exit 1; }
(( age <= max_age_seconds )) || { echo "::error::Data is ${age}s old (max ${max_age_seconds}s)"; exit 1; }
[[ ! "$last_date" < "$min_last_date" ]] || { echo "::error::Last screening $last_date is before $min_last_date"; exit 1; }

echo "OK: $movie_count movies, updated ${age}s ago, screenings through $last_date."
