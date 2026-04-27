#!/bin/bash
# Setup script that runs BEFORE any tedge service starts
# This ensures all necessary directories exist

set -eo pipefail
echo "SNAP: $SNAP"
echo "SNAP_DATA: $SNAP_DATA"
echo "SNAP_COMMON: $SNAP_COMMON"
echo "SNAP_REVISION: $SNAP_REVISION"



# Derive paths from environment variables set by snapd.
# Snapd always sets SNAP_DATA and SNAP_COMMON correctly — regardless of the snap name.
# This script therefore works with both "thin-edge-io" and
# "ctrlx-cumulocity-thin-edge-io" without any changes.
SNAP_DATA_PATH="${SNAP_DATA}"
SNAP_COMMON_PATH="${SNAP_COMMON}"

# Log build information if available
if [ -f "$SNAP/meta/build-info.txt" ]; then
    BUILD_VERSION=$(head -n 1 "$SNAP/meta/build-info.txt")
    echo "Build: $BUILD_VERSION"
fi


# Create all necessary base directories

mkdir -p "$SNAP_DATA_PATH/tedge"
mkdir -p "$SNAP_DATA_PATH/tedge/run"
mkdir -p "$SNAP_DATA_PATH/tedge/device"
mkdir -p "$SNAP_DATA_PATH/tedge/sm-plugins"
mkdir -p "$SNAP_DATA_PATH/tedge/log-plugins"
mkdir -p "$SNAP_DATA_PATH/tedge/log-plugins-disabled"
mkdir -p "$SNAP_DATA_PATH/tedge/.agent"
mkdir -p "$SNAP_DATA_PATH/log-levels"
mkdir -p "$SNAP_COMMON_PATH/tedge"
mkdir -p "$SNAP_COMMON_PATH/tedge/run"
mkdir -p "$SNAP_COMMON_PATH/tedge/log"
mkdir -p "$SNAP_COMMON_PATH/tedge/device"
mkdir -p "$SNAP_COMMON_PATH/mosquitto"
mkdir -p "$SNAP_DATA_PATH/package-run/thin-edge-io"
mkdir -p "$SNAP_DATA_PATH/mosquitto"
mkdir -p "$SNAP_DATA_PATH/mosquitto/persistence"
mkdir -p "$SNAP_DATA_PATH/tedge/tmp"
mkdir -p "$SNAP_DATA_PATH/tedge/plugins"
mkdir -p "$SNAP_COMMON_PATH/tedge/cache"

# Certificate store (ctrlX Certificate Manager integration)
# Structure: /own/certs (certificate), /own/private (private key, 700)
mkdir -p "$SNAP_COMMON_PATH/package-certificates/thin-edge-io/tedge/own/certs"
mkdir -p "$SNAP_COMMON_PATH/package-certificates/thin-edge-io/tedge/own/private"
mkdir -p "$SNAP_COMMON_PATH/package-certificates/thin-edge-io/tedge/ca"
mkdir -p "$SNAP_COMMON_PATH/package-certificates/thin-edge-io/tedge/trusted/certs"
chmod 700 "$SNAP_COMMON_PATH/package-certificates/thin-edge-io/tedge/own/private"
chmod 777 "$SNAP_DATA_PATH/package-run"
chmod 777 "$SNAP_DATA_PATH/package-run/thin-edge-io"
chmod 777 "$SNAP_DATA_PATH/tedge/tmp"
chmod 777 "$SNAP_COMMON_PATH/tedge/log"

# Create lock directory in all relevant snap revisions (current, SNAP_DATA, common)
for LOCKDIR in "$SNAP_DATA_PATH/tedge/run/lock" "$SNAP_DATA/tedge/run/lock" "$SNAP_COMMON_PATH/tedge/run/lock"; do
    echo "Creating lock directory: $LOCKDIR"
    mkdir -p "$LOCKDIR"
    chmod 777 "$LOCKDIR"
done



# Verify setup
echo "=== Verification ==="

echo "Lock directory in SNAP_COMMON_PATH:"
ls -ld "$SNAP_COMMON_PATH/tedge/run/lock"

echo "Lock directory in SNAP_DATA_PATH:"
ls -ld "$SNAP_DATA_PATH/tedge/run/lock"

echo "Target verification:"

# No longer checking for a symlink — use a direct lock directory instead
if [ -d "$SNAP_DATA_PATH/tedge/run/lock" ] && [ -w "$SNAP_DATA_PATH/tedge/run/lock" ]; then
    echo "  ✓ Lock directory exists and is writable"
else
    echo "  ✗ Lock directory missing or not writable!"
    exit 1
fi

echo "=== Setup completed successfully ==="

# ── tedge system.toml: owned by root ────────────────────────────────────────────
# ctrlX snapd supports neither system-usernames nor does AppArmor allow
# useradd in the snap context. tedge tries to chown directories to the
# "tedge" user when connecting/writing the bridge config — which fails.
# Solution: create system.toml with user="root"/group="root" before tedge
# runs for the first time. This causes tedge to chown all directories to
# root:root, which always succeeds in the snap context.
SYSTEM_TOML="$SNAP_DATA_PATH/tedge/system.toml"
if [ ! -f "$SYSTEM_TOML" ]; then
    cat > "$SYSTEM_TOML" << 'EOF'
# ctrlX AUTOMATION: use root instead of tedge user
# The tedge system user cannot be created in strict snap confinement.
# Setting user/group to root ensures chown operations always succeed.
user = "root"
group = "root"
EOF
    echo "system.toml created with user=root/group=root"
else
    echo "system.toml already exists, not overwriting"
fi
