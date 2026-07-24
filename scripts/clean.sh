#!/bin/bash
set -euo pipefail
# Removes build artifacts and cleans the project

echo "[clean.sh] Removing build artifacts ..."
rm -rf parts/ prime/ stage/
rm -f -- *.snap
echo "[clean.sh] Done."
