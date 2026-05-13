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
mkdir -p "$SNAP_DATA_PATH/tedge/device-certs"
mkdir -p "$SNAP_DATA_PATH/tedge/sm-plugins"
mkdir -p "$SNAP_DATA_PATH/tedge/log-plugins"
mkdir -p "$SNAP_DATA_PATH/tedge/mappers"
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

# Register tedge-flows-plugin as sm-plugin
ln -sf "$SNAP/bin/tedge-flows-plugin" "$SNAP_DATA_PATH/tedge/sm-plugins/flow"

# Copy default flows from $SNAP/tedge-flows into $SNAP_DATA/tedge/mappers/c8y/flows/
# Each flow directory is only copied if it does not already exist (preserve user edits).
FLOWS_SRC="${SNAP:-$SNAP_DATA_PATH/..}/tedge-flows/mappers/c8y/flows"
FLOWS_DST="$SNAP_DATA_PATH/tedge/mappers/c8y/flows"
if [ -d "$FLOWS_SRC" ]; then
    mkdir -p "$FLOWS_DST"
    for flow_dir in "$FLOWS_SRC"/*/; do
        flow_name="$(basename "$flow_dir")"
        dst="$FLOWS_DST/$flow_name"
        if [ ! -d "$dst" ]; then
            echo "Installing default flow: $flow_name" >&2
            cp -r "$flow_dir" "$dst"
        else
            echo "Flow already exists, skipping: $flow_name" >&2
        fi
    done
    # Copy loose .toml files (e.g. test.toml, check.js.toml)
    for toml_file in "$FLOWS_SRC"/*.toml; do
        [ -f "$toml_file" ] || continue
        dst_toml="$FLOWS_DST/$(basename "$toml_file")"
        if [ ! -f "$dst_toml" ]; then
            echo "Installing flow config: $(basename "$toml_file")" >&2
            cp "$toml_file" "$dst_toml"
        fi
    done
else
    echo "WARNING: Default flows not found at $FLOWS_SRC" >&2
fi

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

# Configure tedge to find config-plugins inside the snap
# Default path /usr/share/tedge/config-plugins does not exist in snap confinement.
TEDGE_BIN="$SNAP/bin/tedge"
TEDGE_CFG_DIR="$SNAP_DATA/tedge"
# Use a writable SNAP_DATA directory for config-plugins so only the 'file' symlink
# is present — tedge-agent tests every binary in the directory with 'list'.
CONFIG_PLUGINS_PATH="$SNAP_DATA/tedge/config-plugins"
LOG_PLUGINS_PATH="$SNAP/usr/share/tedge/log-plugins"
DIAG_PLUGINS_PATH="$SNAP/usr/share/tedge/diag-plugins"

# Create config-plugins dir with only the 'file' entry
mkdir -p "$CONFIG_PLUGINS_PATH"
ln -sf "$SNAP/bin/tedge-file-config-plugin" "$CONFIG_PLUGINS_PATH/file"

"$TEDGE_BIN" --config-dir "$TEDGE_CFG_DIR" config set configuration.plugin_paths "$CONFIG_PLUGINS_PATH" \
    && echo "configuration.plugin_paths set to $CONFIG_PLUGINS_PATH" \
    || echo "WARNING: could not set configuration.plugin_paths (ignored)"
"$TEDGE_BIN" --config-dir "$TEDGE_CFG_DIR" config set log.plugin_paths "$LOG_PLUGINS_PATH" \
    && echo "log.plugin_paths set to $LOG_PLUGINS_PATH" \
    || echo "WARNING: could not set log.plugin_paths (ignored)"
"$TEDGE_BIN" --config-dir "$TEDGE_CFG_DIR" config set diag.plugin_paths "$DIAG_PLUGINS_PATH" \
    && echo "diag.plugin_paths set to $DIAG_PLUGINS_PATH" \
    || echo "WARNING: could not set diag.plugin_paths (ignored)"

# Register c8y-remote-access-plugin operation (c8y_RemoteAccessConnect)
# This creates /etc/tedge/operations/c8y/c8y_RemoteAccessConnect so that
# tedge-agent recognises remote access operations from Cumulocity.
echo "Registering c8y-remote-access-plugin ..."
"$SNAP/bin/c8y-remote-access-plugin" --init && echo "c8y-remote-access-plugin registered" || echo "WARNING: c8y-remote-access-plugin --init failed (ignored)"

# Register c8y-firmware-plugin (c8y_Firmware operation for child devices)
echo "Registering c8y-firmware-plugin ..."
"$SNAP/bin/c8y-firmware-plugin" --init && echo "c8y-firmware-plugin registered" || echo "WARNING: c8y-firmware-plugin --init failed (ignored)"
