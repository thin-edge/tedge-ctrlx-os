#!/bin/bash
# Display build information for thin-edge.io snap

BUILD_INFO_FILE="$SNAP/meta/build-info.txt"

if [ -f "$BUILD_INFO_FILE" ]; then
    cat "$BUILD_INFO_FILE"
else
    echo "Build information file not found."
    echo "Snap: $SNAP_NAME"
    echo "Revision: $SNAP_REVISION"
fi
