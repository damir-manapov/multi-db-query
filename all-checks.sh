#!/bin/bash
set -euo pipefail

echo "========== check.sh =========="
bash check.sh

echo ""
echo "========== health.sh =========="
bash health.sh

echo ""
echo "All checks and health checks passed."
