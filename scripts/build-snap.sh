#!/bin/bash
set -euo pipefail
# Baut das Snap für amd64 und arm64


echo "[build-snap.sh] Baue Snap für amd64 und arm64..."

echo "=============================================="
echo "Step 6: Build Snap for amd64"
echo "=============================================="

AMD64_BUILD_LOG="build-snap-amd64-$(date +%Y%m%d-%H%M%S).log"
echo "[i] Building amd64 snap (logging to $AMD64_BUILD_LOG)..."
if ./build-snap-amd64.sh 2>&1 | tee "$AMD64_BUILD_LOG"; then
	echo "[✓] amd64 snap built successfully!"
	AMD64_SNAP=$(ls -1 thin-edge-io_*_amd64.snap 2>/dev/null | head -1)
	if [ -z "$AMD64_SNAP" ]; then
		echo "[✗] Snap-Build meldet Erfolg, aber keine .snap-Datei gefunden!"; exit 1
	fi
	SNAP_SIZE=$(du -h "$AMD64_SNAP" | cut -f1)
	echo "[✓] Snap file: $AMD64_SNAP ($SNAP_SIZE)"
else
	echo "[✗] amd64 build failed!"
	echo "[i] Check the error messages above for details."
	echo "[i] Build log: $AMD64_BUILD_LOG"
	exit 1
fi

# Teste Snap-Installation direkt nach Build
if [ -n "$AMD64_SNAP" ]; then
	echo "[i] Testing snap install --dangerous $AMD64_SNAP ..."
	SNAP_INSTALL_LOG="snap-install-$(date +%Y%m%d-%H%M%S).log"
	if sudo snap install --dangerous "$AMD64_SNAP" 2>&1 | tee "$SNAP_INSTALL_LOG"; then
		echo "[✓] Snap installation test successful!"
	else
		echo "[✗] Snap installation test failed!"
		echo "[i] See log: $SNAP_INSTALL_LOG"
		exit 1
	fi
fi

echo "=============================================="
echo "Step 7: Build Snap for arm64"
echo "=============================================="

echo "[i] Starting arm64 build (for ctrlX CORE hardware)..."
if ./build-snap-arm64.sh; then
	echo "[✓] arm64 snap built successfully!"
	ARM64_SNAP=$(ls -1 thin-edge-io_*_arm64.snap 2>/dev/null | head -1)
	if [ -n "$ARM64_SNAP" ]; then
		SNAP_SIZE=$(du -h "$ARM64_SNAP" | cut -f1)
		echo "[✓] Snap file: $ARM64_SNAP ($SNAP_SIZE)"
	fi
else
	echo "[✗] arm64 build failed!"
	echo "[i] Check the error messages above for details."
fi
