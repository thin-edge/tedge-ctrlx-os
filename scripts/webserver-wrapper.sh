#!/bin/bash
set -eo pipefail
echo "=============================================="

# Read build information if available
if [ -f "$SNAP/meta/build-info.txt" ]; then
    BUILD_VERSION=$(cat "$SNAP/meta/build-info.txt")
    echo "Build: $BUILD_VERSION"
else
    echo "Build: Version information not available"
fi

echo "Port: 8888"
echo "Web Root: $SNAP/web/www"
echo "=============================================="

# Ensure web files exist
if [ ! -d "$SNAP/web/www" ]; then
    echo "ERROR: Web root directory not found: $SNAP/web/www" >&2
    exit 1
fi

if [ ! -f "$SNAP/web/www/index.html" ]; then
    echo "ERROR: index.html not found in web root" >&2
    exit 1
fi

# Load log level from $SNAP_DATA/log-levels/webserver (set via the UI)
# Falls back to "info" if not configured.
LOG_LEVEL_FILE="${SNAP_DATA}/log-levels/webserver"
if [ -f "$LOG_LEVEL_FILE" ]; then
    RUST_LOG=$(cat "$LOG_LEVEL_FILE")
else
    RUST_LOG="info"
fi
export RUST_LOG
echo "Logging level: $RUST_LOG"
# Start the webserver
echo "Starting tedge-web-config..."
exec "$SNAP/bin/tedge-web-config" 2>&1 | tee -a "$SNAP_COMMON/tedge/log/tedge-web-config.log"
