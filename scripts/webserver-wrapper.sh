#!/bin/bash
set -e

echo "=============================================="
echo "thin-edge.io Configuration Webserver"
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

# Set logging level - can be overridden with: snap set thin-edge-io rust-log=<level>
export RUST_LOG="debug"
echo "Logging level: $RUST_LOG (erzwungen)"

# Set logging level - default debug
export RUST_LOG="${RUST_LOG:-debug}"
echo "Logging level: $RUST_LOG"
# Start the webserver
echo "Starting tedge-web-config..."
exec "$SNAP/bin/tedge-web-config" 2>&1 | tee -a "$SNAP_COMMON/tedge/log/tedge-web-config.log"
