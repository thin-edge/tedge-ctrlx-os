#!/bin/bash
# Mosquitto wrapper based on official mosquitto snap
# Uses minimal config to avoid user switching issues

set -e

# Log build information at service start
if [ -f "$SNAP/meta/build-info.txt" ]; then
    BUILD_VERSION=$(head -n 1 "$SNAP/meta/build-info.txt")
    echo "=== Mosquitto Broker Wrapper ==="
    echo "Build: $BUILD_VERSION"
    echo "================================="
fi

# Determine which common dir to use (same logic as official snap)
case "$SNAP_USER_COMMON" in
    */root/snap/thin-edge-io/common*) COMMON=$SNAP_COMMON ;;
    *)                                 COMMON=$SNAP_USER_COMMON ;;
esac

CONFIG_FILE="$SNAP/etc/mosquitto/default_config.conf"
CUSTOM_CONFIG="$COMMON/mosquitto.conf"

# Copy custom config if it doesn't exist (for future customization)
if [ ! -e "$COMMON/mosquitto_example.conf" ]; then
    mkdir -p "$COMMON"
    cp "$SNAP/etc/mosquitto/mosquitto.conf" "$COMMON/mosquitto_example.conf" 2>/dev/null || true
fi

# Use custom config if exists, otherwise default
if [ -e "$CUSTOM_CONFIG" ]; then
    echo "Found custom config in $CUSTOM_CONFIG"
    CONFIG_FILE=$CUSTOM_CONFIG
else
    echo "Using default config from $CONFIG_FILE"
fi

# Launch mosquitto
exec "$SNAP/usr/sbin/mosquitto" -c "$CONFIG_FILE" "$@" 2>&1 | tee -a "$SNAP_DATA/mosquitto.log"
