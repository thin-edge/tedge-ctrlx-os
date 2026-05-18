#!/bin/sh
# Collect diagnostic information and upload the resulting archive to Cumulocity.
#
# Usage: diag-upload.sh
#
# The script:
#   1. Runs "tedge diag collect" to gather all diagnostic data into a .tar.gz
#   2. Uploads the archive to Cumulocity as an event binary
#      (Event type: tedge_DiagReport, visible in C8y under Events)
#
# Designed to be invoked via a custom operation workflow (diag_upload.toml).

set -eu

# Resolve snap paths from environment (set by snapd) or fall back to defaults.
SNAP="${SNAP:-/snap/ctrlx-cumulocity-thin-edge-io/current}"
SNAP_DATA="${SNAP_DATA:-/var/snap/ctrlx-cumulocity-thin-edge-io/current}"

TEDGE_BIN="$SNAP/bin/tedge"
TEDGE_CFG_DIR="$SNAP_DATA/tedge"
TMP_DIR="${TMPDIR:-/tmp}"

echo "[diag-upload] Collecting diagnostic information ..."

# Run diag collect; output the tarball path on stdout
TARBALL=$("$TEDGE_BIN" --config-dir "$TEDGE_CFG_DIR" diag collect \
    --output-dir "$TMP_DIR" 2>&1 | tee /dev/stderr | grep -o "${TMP_DIR}/tedge-diag-[^[:space:]]*\.tar\.gz" || true)

if [ -z "$TARBALL" ]; then
    # Fallback: find the most recently created tarball
    TARBALL=$(find "$TMP_DIR" -maxdepth 1 -name "tedge-diag-*.tar.gz" \
        -newer /tmp -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
fi

if [ -z "$TARBALL" ] || [ ! -f "$TARBALL" ]; then
    echo "[diag-upload] ERROR: Could not find diagnostic tarball in $TMP_DIR" >&2
    exit 1
fi

echo "[diag-upload] Tarball: $TARBALL"

TIMESTAMP=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)

echo "[diag-upload] Uploading to Cumulocity ..."
"$TEDGE_BIN" --config-dir "$TEDGE_CFG_DIR" upload c8y \
    --file "$TARBALL" \
    --type "tedge_DiagReport" \
    --text "Diagnostic report collected on $TIMESTAMP" \
    --mime-type "application/gzip"

echo "[diag-upload] Upload complete."
rm -f "$TARBALL"
