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
# tedge writes its bridge configs AND listener settings to
# $SNAP_DATA/tedge/mosquitto-conf/ (c8y-bridge.conf, tedge-mosquitto.conf, etc.)
# We build a minimal runtime config that includes that directory so mosquitto
# actually loads the bridge connections.
RUNTIME_CONF="$SNAP_DATA/mosquitto-runtime.conf"
BRIDGE_CONF_DIR="$SNAP_DATA/tedge/mosquitto-conf"

# Always start from scratch so stale include_dir entries don't remain
{
    # Base settings: filter out any existing include_dir lines to prevent duplicates
    # (e.g. old $SNAP_COMMON/mosquitto.conf may already contain one)
    grep -v "^include_dir" "$CONFIG_FILE"
    echo ""
    echo "# Settings and bridge configs written by tedge"
    if [ -d "$BRIDGE_CONF_DIR" ]; then
        echo "include_dir $BRIDGE_CONF_DIR"
        echo "Found bridge config dir: $BRIDGE_CONF_DIR" >&2
    else
        echo "No bridge config dir yet: $BRIDGE_CONF_DIR" >&2
    fi
} > "$RUNTIME_CONF"

exec "$SNAP/usr/sbin/mosquitto" -c "$RUNTIME_CONF" "$@" 2>&1 | tee -a "$SNAP_COMMON/tedge/log/mosquitto.log"
