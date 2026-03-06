#!/bin/bash
# Build script for thin-edge.io CTRLX App (amd64)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Building thin-edge.io CTRLX App (amd64)"
echo "======================================"

# Generate build number (YYYYMMDD.HHMM)
BUILD_NUMBER="build.$(date -u +%Y%m%d.%H%M)"
BUILD_DATE="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
BUILD_HOST="$(hostname)"
BUILD_USER="$(whoami)"
BUILD_ARCH="amd64"

echo "Build Number: $BUILD_NUMBER"
echo "Build Date: $BUILD_DATE"

# Read version from snapcraft.yaml
VERSION=$(grep "^version:" snap/snapcraft.yaml | awk '{print $2}' | tr -d '"')

# Optional: Full Clean nur bei Bedarf
if [[ "$1" == "clean" ]]; then
    echo "Full clean: Entferne alle Build-Artefakte..."
    snapcraft clean --destructive-mode || true
else
    echo "Schneller inkrementeller Build (kein clean)."
    echo "Tipp: Für einen vollständigen Clean: ./build-snap-amd64.sh clean"
fi

# Create build-info.txt
BUILD_INFO_FILE="configs/build-info.txt"
cat > "$BUILD_INFO_FILE" << EOF
Version: ${VERSION}+${BUILD_NUMBER}
Build Date: ${BUILD_DATE}
Build Host: ${BUILD_HOST}
Build User: ${BUILD_USER}
Base: core22
Architecture: ${BUILD_ARCH}
Git Commit: b1193e94f753
EOF

# Kein automatisches Clean mehr vor jedem Build
echo "Build-Info aktualisiert. Kein automatisches Clean."

echo "Building snap package..."
echo "Note: Building directly on host (destructive mode to save RAM)..."
echo "WARNING: This will install build dependencies on the host system"

# Build with destructive mode for amd64
snapcraft --destructive-mode --enable-manifest --target-arch=amd64

# Check if build succeeded
if [ -f "thin-edge-io_${VERSION}_amd64.snap" ]; then
    echo "======================================"
    echo -e "${GREEN}Build completed successfully!${NC}"
    echo "======================================"
    ls -lh thin-edge-io_*.snap
    echo ""
    echo "To install on ctrlX COREvirtual:"
    echo "1. Download the .snap file"
    echo "2. Open ctrlX CORE web interface"
    echo "3. Go to Settings -> Apps"
    echo "4. Switch to Service Mode"
    echo "5. Install from file"
else
    echo "======================================"
    echo -e "${RED}Build failed!${NC}"
    echo "======================================"
    exit 1
fi
