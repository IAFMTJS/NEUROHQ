#!/usr/bin/env bash
# Usage: gh-call-cron.sh /api/cron/daily
# Called from GitHub Actions with CRON_SECRET, PRODUCTION_URL, optional VERCEL_AUTOMATION_BYPASS_SECRET.
set -euo pipefail
CRON_PATH="${1:?First arg must be cron path e.g. /api/cron/daily}"
CRON_SECRET="${CRON_SECRET#"${CRON_SECRET%%[![:space:]]*}"}"
CRON_SECRET="${CRON_SECRET%"${CRON_SECRET##*[![:space:]]}"}"
PRODUCTION_URL="${PRODUCTION_URL#"${PRODUCTION_URL%%[![:space:]]*}"}"
PRODUCTION_URL="${PRODUCTION_URL%"${PRODUCTION_URL##*[![:space:]]}"}"
CRON_URL="${PRODUCTION_URL%/}${CRON_PATH}"
echo "Calling: $CRON_URL"
CURL_HEADERS=(-H "Authorization: Bearer $CRON_SECRET")
if [ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]; then
  CURL_HEADERS+=(-H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET")
fi
resp=$(curl -s -w "\n%{http_code}" -X GET "${CURL_HEADERS[@]}" "$CRON_URL")
code=$(echo "$resp" | tail -n1)
body=$(echo "$resp" | sed '$d')
echo "Response ($code): $body"
if [ "$code" -lt 200 ] || [ "$code" -ge 300 ]; then
  if [ "$code" = "302" ]; then
    echo "302 Redirect — see DEPLOY.md / cron-hourly.yml for Deployment Protection."
  elif [ "$code" = "401" ]; then
    echo "401 — CRON_SECRET must match Vercel."
  elif [ "$code" = "404" ]; then
    echo "404 — check PRODUCTION_URL and deployed route ${CRON_PATH}."
  fi
  exit 1
fi
