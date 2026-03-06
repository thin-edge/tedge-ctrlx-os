#!/bin/bash
set -euo pipefail
# Baut das Snap für amd64 und arm64

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

BUILD_DATE="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
BUILD_NUMBER="build.$(date -u +%Y%m%d.%H%M)"
BUILD_HOST="$(hostname)"
BUILD_USER="$(whoami)"
VERSION=$(grep "^version:" snap/snapcraft.yaml | awk '{print $2}' | tr -d '"')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "======================================"
echo "Building thin-edge.io CTRLX App"
echo "Version: ${VERSION}  Commit: ${GIT_COMMIT}"
echo "======================================"

# Optional full clean
if [[ "${1:-}" == "clean" ]]; then
    echo "Full clean: Entferne alle Build-Artefakte..."
    snapcraft clean --destructive-mode || true
else
    echo "Inkrementeller Build (kein clean). Für vollständigen Clean: ./scripts/build-snap.sh clean"
fi

# Build-Info schreiben
cat > "configs/build-info.txt" << EOF
Version: ${VERSION}+${BUILD_NUMBER}
Build Date: ${BUILD_DATE}
Build Host: ${BUILD_HOST}
Build User: ${BUILD_USER}
Base: core22
Architecture: amd64
Git Commit: ${GIT_COMMIT}
EOF
echo "[i] Build-Info aktualisiert."

# ─── amd64 ───────────────────────────────────────────
echo ""
echo "=============================================="
echo "Step 6: Build Snap for amd64"
echo "=============================================="

AMD64_BUILD_LOG="build-snap-amd64-$(date +%Y%m%d-%H%M%S).log"
echo "[i] Building amd64 snap (logging to $AMD64_BUILD_LOG)..."

if snapcraft --destructive-mode --enable-manifest --target-arch=amd64 2>&1 | tee "$AMD64_BUILD_LOG"; then
    AMD64_SNAP=$(ls -1 thin-edge-io_*_amd64.snap 2>/dev/null | head -1 || true)
    if [ -z "$AMD64_SNAP" ]; then
        echo -e "${RED}[✗] Snap-Build meldet Erfolg, aber keine .snap-Datei gefunden!${NC}"; exit 1
    fi
    echo -e "${GREEN}[✓] amd64 snap built: $AMD64_SNAP ($(du -h "$AMD64_SNAP" | cut -f1))${NC}"
else
    echo -e "${RED}[✗] amd64 build failed! Siehe: $AMD64_BUILD_LOG${NC}"
    exit 1
fi

# Snap-Installation testen
echo "[i] Testing snap install --dangerous $AMD64_SNAP ..."
SNAP_INSTALL_LOG="snap-install-$(date +%Y%m%d-%H%M%S).log"
if sudo snap install --dangerous "$AMD64_SNAP" 2>&1 | tee "$SNAP_INSTALL_LOG"; then
    echo -e "${GREEN}[✓] Snap installation test successful!${NC}"
else
    echo -e "${RED}[✗] Snap installation test failed! Siehe: $SNAP_INSTALL_LOG${NC}"
    exit 1
fi

# ─── arm64 ───────────────────────────────────────────
echo ""
echo "=============================================="
echo "Step 7: Build Snap for arm64"
echo "=============================================="

# Build-Info für arm64 aktualisieren
sed -i "s/^Architecture: .*/Architecture: arm64/" configs/build-info.txt

echo "[i] Starting arm64 build (for ctrlX CORE hardware)..."
if snapcraft --destructive-mode --enable-manifest --target-arch=arm64 2>&1; then
    ARM64_SNAP=$(ls -1 thin-edge-io_*_arm64.snap 2>/dev/null | head -1 || true)
    if [ -n "$ARM64_SNAP" ]; then
        echo -e "${GREEN}[✓] arm64 snap built: $ARM64_SNAP ($(du -h "$ARM64_SNAP" | cut -f1))${NC}"
    fi
else
    echo -e "${RED}[✗] arm64 build failed!${NC}"
fi
