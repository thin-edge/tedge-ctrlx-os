#!/bin/bash
# ============================================================
# build-artifacts.sh
#
# Assembles the ctrlX AUTOMATION validation artifacts folder
# according to the Bosch Rexroth App Development Guide:
# https://boschrexroth.github.io/ctrlx-automation-sdk/latest/appdevguide.html
#
# Output folder structure:
#   artifacts/thin-edge-io/<version>/
#     disclosure/       ← fossinfo.json, foss-offer.txt
#     build-info/       ← snapcraft.yaml, package-manifest.json,
#                          portlist/unixsocket/slotplug-description.json
#     documentation/    ← manual.*, release-notes.*, test-setup-description.*,
#                          architecture-overview.*
#     app-states/       ← standard-scenario1.json (Postman collection)
#     snaps/            ← *.snap files
#
# Usage:
#   ./scripts/build-artifacts.sh [version]
#   ./scripts/build-artifacts.sh 1.7.1
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Version from argument or snapcraft.yaml
VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
    VERSION=$(grep '^version:' "$REPO_ROOT/snap/snapcraft.yaml" | awk '{print $2}' | tr -d "'\"")
fi

APP_NAME="thin-edge-io"
OUT_DIR="$REPO_ROOT/artifacts/$APP_NAME/$VERSION"

echo "======================================================"
echo " Building ctrlX validation artifacts"
echo " App:     $APP_NAME"
echo " Version: $VERSION"
echo " Output:  $OUT_DIR"
echo "======================================================"

# ── Clean & create output folders ──────────────────────────
rm -rf "$OUT_DIR"
mkdir -p \
    "$OUT_DIR/disclosure" \
    "$OUT_DIR/build-info" \
    "$OUT_DIR/documentation" \
    "$OUT_DIR/app-states" \
    "$OUT_DIR/snaps"

# ── 1. Disclosure ──────────────────────────────────────────
echo ""
echo "[1/5] Disclosure..."

cp "$REPO_ROOT/package-assets/fossinfo.json"  "$OUT_DIR/disclosure/fossinfo.json"
cp "$REPO_ROOT/package-assets/foss-offer.txt" "$OUT_DIR/disclosure/foss-offer.txt"

echo "  ✓ fossinfo.json"
echo "  ✓ foss-offer.txt"

# ── 2. Build Info ──────────────────────────────────────────
echo ""
echo "[2/5] Build Info..."

cp "$REPO_ROOT/snap/snapcraft.yaml"                          "$OUT_DIR/build-info/snapcraft.yaml"
cp "$REPO_ROOT/configs/package-manifest.json"               "$OUT_DIR/build-info/package-manifest.json"
cp "$REPO_ROOT/package-assets/portlist-description.json"    "$OUT_DIR/build-info/portlist-description.json"
cp "$REPO_ROOT/package-assets/unixsocket-description.json"  "$OUT_DIR/build-info/unixsocket-description.json"
cp "$REPO_ROOT/package-assets/slotplug-description.json"    "$OUT_DIR/build-info/slotplug-description.json"

echo "  ✓ snapcraft.yaml"
echo "  ✓ package-manifest.json"
echo "  ✓ portlist-description.json"
echo "  ✓ unixsocket-description.json"
echo "  ✓ slotplug-description.json"

# ── 3. Documentation ───────────────────────────────────────
echo ""
echo "[3/5] Documentation..."

# Copy markdown sources
cp "$REPO_ROOT/docs/manual.md"                  "$OUT_DIR/documentation/manual.md"
cp "$REPO_ROOT/docs/release-notes.md"           "$OUT_DIR/documentation/release-notes.md"
cp "$REPO_ROOT/docs/test-setup-description.md"  "$OUT_DIR/documentation/test-setup-description.md"
cp "$REPO_ROOT/docs/architecture-overview.md"   "$OUT_DIR/documentation/architecture-overview.md"

echo "  ✓ manual.md"
echo "  ✓ release-notes.md"
echo "  ✓ test-setup-description.md"
echo "  ✓ architecture-overview.md"

# Optional: convert to PDF if pandoc is available
if command -v pandoc &>/dev/null; then
    echo ""
    echo "  pandoc found — converting to PDF..."
    for doc in manual release-notes test-setup-description architecture-overview; do
        pandoc "$OUT_DIR/documentation/$doc.md" \
            -o "$OUT_DIR/documentation/$doc.pdf" \
            --pdf-engine=xelatex \
            -V geometry:margin=2cm \
            2>/dev/null && echo "  ✓ $doc.pdf" || echo "  ✗ $doc.pdf (conversion failed, keeping .md)"
    done
else
    echo ""
    echo "  ℹ pandoc not found — markdown files kept. For submission, convert to PDF:"
    echo "    sudo apt-get install pandoc texlive-xetex"
    echo "    then re-run this script"
fi

# ── 4. App States ──────────────────────────────────────────
echo ""
echo "[4/5] App States..."

if [[ -f "$REPO_ROOT/package-assets/app-states/standard-scenario1.json" ]]; then
    cp "$REPO_ROOT/package-assets/app-states/standard-scenario1.json" \
       "$OUT_DIR/app-states/standard-scenario1.json"
    echo "  ✓ standard-scenario1.json"
else
    echo "  ✗ package-assets/app-states/standard-scenario1.json not found!"
    exit 1
fi

# ── 5. Snaps ───────────────────────────────────────────────
echo ""
echo "[5/5] Snaps..."

SNAP_FOUND=0
for arch in amd64 arm64; do
    SNAP_FILE="$REPO_ROOT/${APP_NAME}_${VERSION}_${arch}.snap"
    if [[ -f "$SNAP_FILE" ]]; then
        cp "$SNAP_FILE" "$OUT_DIR/snaps/"
        echo "  ✓ ${APP_NAME}_${VERSION}_${arch}.snap"
        SNAP_FOUND=1
    else
        echo "  ✗ ${APP_NAME}_${VERSION}_${arch}.snap not found (build first)"
    fi
done

if [[ $SNAP_FOUND -eq 0 ]]; then
    echo "  ⚠ No snap files found. Run ./build-snap-amd64.sh and/or ./build-snap-arm64.sh first."
fi

# ── Summary ────────────────────────────────────────────────
echo ""
echo "======================================================"
echo " Artifacts assembled: $OUT_DIR"
echo ""
echo " To submit to Bosch Rexroth ctrlX World Portal:"
echo "   cd $REPO_ROOT"
echo "   cd artifacts && zip -r ../artifacts.zip $APP_NAME/"
echo "   (use Windows-zip feature for the final submission)"
echo ""
echo " Checklist before submission:"
echo "   □ Docs converted to PDF (manual.pdf, release-notes.pdf,"
echo "     test-setup-description.pdf)"
echo "   □ Both arch snaps present (arm64 MANDATORY, amd64 optional)"
echo "   □ standard-scenario1.json tested in Postman"
echo "   □ fossinfo.json up to date"
echo "======================================================"
