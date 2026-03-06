#!/bin/bash
# Wrapper for tedge CLI to use snap-specific config directory

export TEDGE_CONFIG_DIR="$SNAP_DATA/tedge"

# Ensure config directory exists
mkdir -p "$TEDGE_CONFIG_DIR"

# Execute tedge with all passed arguments
exec "$SNAP/bin/tedge" "$@"
