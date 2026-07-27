#!/usr/bin/env bash
# Regenerate package-lock.json inside the same Linux image CI and the Docker
# builds use (node:22-slim, amd64). Installing deps on macOS (arm64) drops
# linux-only optional deps (e.g. the @emnapi/* wasm runtimes pulled by
# @tailwindcss/oxide-wasm32-wasi) from the lock, which then breaks `npm ci` on
# the GitHub runner and in `docker build`.
#
# Run this after ANY dependency change instead of committing the lock that
# `npm install` produced on your Mac:
#   npm run relock   (or: bash scripts/relock.sh)
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm --platform linux/amd64 -v "$PWD":/host node:22-slim bash -lc '
  set -e
  mkdir -p /build && cp /host/package.json /host/package-lock.json /build/
  cd /build
  npm install --package-lock-only --ignore-scripts
  cp /build/package-lock.json /host/package-lock.json
'
echo "✓ package-lock.json regenerated under linux/amd64 — commit it."
