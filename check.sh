#!/bin/bash
set -euo pipefail

echo "=== Format ==="
pnpm exec biome format --write .

echo ""
echo "=== Lint ==="
pnpm exec biome check .

echo ""
echo "=== Typecheck ==="
pnpm build

echo ""
echo "=== Tests ==="
pnpm test

echo ""
echo "All checks passed."
