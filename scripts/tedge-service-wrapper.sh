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

# Ensure all necessary directories exist
mkdir -p "$TEDGE_CONFIG_DIR"
mkdir -p "$SNAP_DATA/tedge/run"


# Lock-Verzeichnis Snap-Update-sicher machen:
LOCK_TARGET="$SNAP_COMMON/tedge/run/lock"
LOCK_LINK="$SNAP_DATA/tedge/run/lock"

mkdir -p "$LOCK_TARGET"
chmod 777 "$LOCK_TARGET"
mkdir -p "$SNAP_DATA/tedge/run"

# Entferne ggf. altes Lock-Verzeichnis oder Symlink
if [ -d "$LOCK_LINK" ] && [ ! -L "$LOCK_LINK" ]; then
  rmdir "$LOCK_LINK" 2>/dev/null || rm -rf "$LOCK_LINK"
else
  rm -f "$LOCK_LINK"
fi

# Lege Symlink an und prüfe Erfolg
ln -sf "$LOCK_TARGET" "$LOCK_LINK"
if [ ! -L "$LOCK_LINK" ]; then
  echo "[ERROR] Lock-Symlink konnte nicht angelegt werden: $LOCK_LINK -> $LOCK_TARGET" >&2
  exit 1
fi

mkdir -p "$SNAP_COMMON/tedge/log"

# Execute the tedge service with the correct binary name
# The binary name is passed as the first argument
BINARY_NAME="$1"
shift

# Pipe stdout+stderr to the service-specific log file (append) and
# keep a copy going to the snapd journal (stdout of this wrapper).
LOG_FILE="$SNAP_COMMON/tedge/log/${BINARY_NAME}.log"
exec "$SNAP/bin/$BINARY_NAME" --config-dir "$TEDGE_CONFIG_DIR" "$@" 2>&1 | tee -a "$LOG_FILE"
