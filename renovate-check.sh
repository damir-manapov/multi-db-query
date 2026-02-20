#!/bin/bash
set -euo pipefail

PRELOAD_SCRIPT=$(mktemp)
echo "require('net').setDefaultAutoSelectFamily(false);" > "$PRELOAD_SCRIPT"
trap "rm -f $PRELOAD_SCRIPT" EXIT
export NODE_OPTIONS="${NODE_OPTIONS:-} --require=$PRELOAD_SCRIPT --dns-result-order=ipv4first"

echo "=== Renovate dependency check ==="

OUTPUT=$(LOG_FORMAT=json LOG_LEVEL=debug npx -y renovate --platform=local --dry-run 2>&1 || true)

if echo "$OUTPUT" | grep -q '"result":"external-host-error"'; then
  echo "Warning: Renovate could not reach external hosts (network issue)"
  exit 2
fi

UPDATES=$(echo "$OUTPUT" | grep -o '"branchesInformation":\[.*\]' | head -1 || true)

if [ -z "$UPDATES" ]; then
  echo "No outdated dependencies found."
  exit 0
fi

BRANCH_COUNT=$(echo "$UPDATES" | grep -o '"branchName"' | wc -l)

if [ "$BRANCH_COUNT" -eq 0 ]; then
  echo "No outdated dependencies found."
  exit 0
fi

echo "Found $BRANCH_COUNT outdated dependencies:"
echo "$UPDATES" | python3 -c "
import sys, json
data = json.loads('{' + sys.stdin.read() + '}')
for branch in data.get('branchesInformation', []):
    prTitle = branch.get('prTitle', 'unknown')
    print(f'  - {prTitle}')
" 2>/dev/null || echo "$UPDATES"

exit 1
