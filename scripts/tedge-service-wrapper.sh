#!/bin/bash
# Generic wrapper for tedge services to use snap-specific directories

export TEDGE_CONFIG_DIR="$SNAP_DATA/tedge"

# Ensure our dummy systemd-notify is found before the system binary
# (the system binary is blocked by AppArmor in strict snap confinement)
export PATH="$SNAP/scripts:$SNAP/usr/local/bin:$SNAP/usr/bin:$SNAP/bin:$PATH"

# Log build information at service start
if [ -f "$SNAP/meta/build-info.txt" ]; then
    BUILD_VERSION=$(head -n 1 "$SNAP/meta/build-info.txt")
    echo "=== thin-edge.io Service Wrapper ==="
    echo "Build: $BUILD_VERSION"
    echo "Service: $1"
    echo "===================================="
fi

# Ensure lock directory survives snap updates:
LOCK_TARGET="$SNAP_COMMON/tedge/run/lock"
LOCK_LINK="$SNAP_DATA/tedge/run/lock"

chmod 777 "$LOCK_TARGET"

# Remove any existing lock directory or symlink
if [ -d "$LOCK_LINK" ] && [ ! -L "$LOCK_LINK" ]; then
  rmdir "$LOCK_LINK" 2>/dev/null || rm -rf "$LOCK_LINK"
else
  rm -f "$LOCK_LINK"
fi

# Create symlink and verify success
ln -sf "$LOCK_TARGET" "$LOCK_LINK"
if [ ! -L "$LOCK_LINK" ]; then
  echo "[ERROR] Could not create lock symlink: $LOCK_LINK -> $LOCK_TARGET" >&2
  exit 1
fi

# Execute the tedge service with the correct binary name
# The binary name is passed as the first argument
BINARY_NAME="$1"
shift

# Wait for mosquitto to be ready on port 1883 (max 30s)
# This prevents repeated "Connection refused" log spam on startup.
_MQTT_WAIT=0
while ! nc -z 127.0.0.1 1883 2>/dev/null; do
    if [ $_MQTT_WAIT -ge 30 ]; then
        echo "[WARN] mosquitto not ready after 30s, continuing anyway" >&2
        break
    fi
    sleep 1
    _MQTT_WAIT=$((_MQTT_WAIT + 1))
done

# Load per-service log level from $SNAP_DATA/log-levels/<service>
# This is written by the web UI and read here at service start.
LOG_LEVEL_FILE="$SNAP_DATA/log-levels/$BINARY_NAME"
if [ -f "$LOG_LEVEL_FILE" ]; then
    RUST_LOG=$(cat "$LOG_LEVEL_FILE")
    export RUST_LOG
fi

# Pipe stdout+stderr to the service-specific log file (append) and
# keep a copy going to the snapd journal (stdout of this wrapper).
LOG_FILE="$SNAP_COMMON/tedge/log/${BINARY_NAME}.log"
exec "$SNAP/bin/$BINARY_NAME" --config-dir "$TEDGE_CONFIG_DIR" "$@" 2>&1 | tee -a "$LOG_FILE"
