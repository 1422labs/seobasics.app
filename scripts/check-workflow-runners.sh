#!/bin/sh
# Owner policy: every GitHub Actions job runs on the 1422 Labs self-hosted
# runner scale set, exactly `runs-on: arc-1422labs`. GitHub-hosted runners
# (ubuntu-*, macos-*, windows-*) and Mac/Xcode CI are forbidden; Mac gates are
# verified manually on a real Mac (see docs/architecture.md).
#
# Checks, for every workflow file:
#   1. every `runs-on:` line is exactly `runs-on: arc-1422labs`;
#   2. the number of `runs-on:` lines equals the number of jobs, so no job
#      silently falls back to another runner or uses a matrix/expression label;
#   3. no forbidden runner labels or Xcode tooling appear anywhere.
set -eu

dir="${1:-.github/workflows}"
status=0

for file in "$dir"/*.yml "$dir"/*.yaml; do
  [ -e "$file" ] || continue

  bad=$(grep -nE '^[[:space:]]*runs-on:' "$file" | grep -vE '^[0-9]+:[[:space:]]*runs-on:[[:space:]]*arc-1422labs[[:space:]]*$' || true)
  if [ -n "$bad" ]; then
    echo "$file: runs-on must be exactly 'arc-1422labs':" >&2
    echo "$bad" >&2
    status=1
  fi

  # Jobs are the keys indented exactly two spaces below a top-level `jobs:`.
  jobs=$(awk '/^jobs:[[:space:]]*$/ {in_jobs=1; next} /^[^[:space:]#]/ {in_jobs=0} in_jobs && /^  [A-Za-z0-9_-]+:[[:space:]]*$/ {n++} END {print n+0}' "$file")
  runs=$(grep -cE '^[[:space:]]*runs-on:' "$file" || true)
  if [ "$jobs" != "$runs" ]; then
    echo "$file: $jobs job(s) but $runs runs-on line(s); every job needs its own 'runs-on: arc-1422labs'" >&2
    status=1
  fi

  forbidden=$(grep -nE '(ubuntu-latest|ubuntu-[0-9]|macos-|windows-|self-hosted|xcodebuild|xcrun|notarytool|maxim-lobanov/setup-xcode)' "$file" || true)
  if [ -n "$forbidden" ]; then
    echo "$file: forbidden runner label or Mac tooling:" >&2
    echo "$forbidden" >&2
    status=1
  fi
done

[ "$status" -eq 0 ] && echo "runner policy: ok"
exit "$status"
