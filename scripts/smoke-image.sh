#!/bin/sh
# DATABASE_URL=<an empty database> sh scripts/smoke-image.sh [image]
#
# Runs the built image the way the chart does, as user 1001 on a read-only root filesystem
# with a /tmp: the migrate job twice, then the web server with a dev APP_URL and no signing
# key, then a few requests. Needs Docker and a Postgres the container can reach (host
# networking). Applies nothing to any cluster. Pattern: 1422labs/llmgw scripts/smoke-image.sh.
set -eu

IMAGE="${1:-seobasics-app:review}"
: "${DATABASE_URL:?DATABASE_URL is required (an empty database)}"
PORT="${SMOKE_PORT:-3998}"
NAME="seobasics-smoke-$$"
BASE="http://127.0.0.1:$PORT"

run() {
  docker run --rm --network host --read-only --tmpfs /tmp --user 1001 --cap-drop ALL \
    -e DATABASE_URL="$DATABASE_URL" "$@"
}

echo "== migrate job"
run "$IMAGE" node dist/migrate.mjs
echo "== migrate job, again (nothing pending)"
run "$IMAGE" node dist/migrate.mjs | grep -q "No pending migrations"

echo "== web server (dev host, no signing key)"
docker run -d --name "$NAME" --network host --read-only --tmpfs /tmp --user 1001 --cap-drop ALL \
  -e DATABASE_URL="$DATABASE_URL" -e PORT="$PORT" -e HOSTNAME=127.0.0.1 \
  -e APP_URL="https://dev.seobasics.app" -e CHECKOUT_URL="https://checkout.example.com/smoke" \
  "$IMAGE" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

for attempt in $(seq 1 60); do
  if curl -fsS "$BASE/healthz" >/dev/null 2>&1; then break; fi
  if [ "$attempt" = 60 ]; then docker logs "$NAME"; echo "FAILED: the server did not start" >&2; exit 1; fi
  sleep 0.5
done

fail() { docker logs "$NAME"; echo "FAILED: $1" >&2; exit 1; }
check() {
  # check <description> <expected status> <curl args...>
  description="$1"; expected="$2"; shift 2
  status="$(curl -s -o /dev/null -w '%{http_code}' "$@")"
  [ "$status" = "$expected" ] || fail "$description: HTTP $status, expected $expected"
  echo "ok: $description ($status)"
}
contains() {
  # contains <description> <path> <fixed string>
  curl -fsS "$BASE$2" | grep -F -- "$3" >/dev/null || fail "$1: $2 lacks $3"
  echo "ok: $1"
}

check "healthz" 200 "$BASE/healthz"
contains "_dev/version reports the build's commit" /_dev/version '"sha"'
for path in / /docs/mcp /changelog /support /licensing /privacy; do check "page $path" 200 "$BASE$path"; done
contains "dev is never indexed (meta robots)" / '<meta name="robots" content="noindex, nofollow"/>'
contains "dev is never indexed (robots.txt)" /robots.txt "Disallow: /"
contains "canonical follows the runtime APP_URL" /docs/mcp '<link rel="canonical" href="https://dev.seobasics.app/docs/mcp"/>'
contains "sitemap follows the runtime APP_URL" /sitemap.xml "<loc>https://dev.seobasics.app/privacy</loc>"
contains "purchase link is read at runtime" / 'href="https://checkout.example.com/smoke"'
check "license API without a signing key" 503 -X POST -H 'content-type: application/json' \
  -d '{"license_key":"x","device_id":"0123456789abcdef","app_version":"1.0"}' "$BASE/api/v1/activations"

if docker exec "$NAME" sh -c 'test -e /app/.env' 2>/dev/null; then fail "the image contains an .env file"; fi
echo "ok: no .env in the image"
echo "OK: image smoke test passed"
