#!/bin/bash
set -euo pipefail
# Testet die Snap-Installation und Funktion

echo "[test-snap.sh] Teste Snap-Installation und Funktion..."

echo "=============================================="
echo "Build Summary"
echo "=============================================="

SNAP_FILES=$(ls -1 *.snap 2>/dev/null)
if [ -n "$SNAP_FILES" ]; then
    echo "[✓] Successfully built snap packages:"
    echo ""
    ls -lh *.snap
    echo ""
    echo "[i] Installation instructions:"
    echo ""
    echo "  1. Download the appropriate snap file to your PC:"
    AMD64_EXISTS=$(ls -1 thin-edge-io_*_amd64.snap 2>/dev/null)
    ARM64_EXISTS=$(ls -1 thin-edge-io_*_arm64.snap 2>/dev/null)
    if [ -n "$AMD64_EXISTS" ]; then
        echo "     - For ctrlX COREvirtual: $AMD64_EXISTS"
    fi
    if [ -n "$ARM64_EXISTS" ]; then
        echo "     - For ctrlX CORE:        $ARM64_EXISTS"
    fi
    echo ""
    echo "  2. Open ctrlX CORE web interface"
    echo "  3. Navigate to Settings → Apps"
    echo "  4. Switch to Service Mode"
    echo "  5. Click 'Install from file'"
    echo "  6. Select the downloaded snap file"
    echo "  7. Switch back to Operation Mode"
    echo ""

        echo "[i] Prüfe Snap-Services..."
        SNAP_NAME="thin-edge-io"
        SERVICES=(
            "${SNAP_NAME}.tedge-agent"
            "${SNAP_NAME}.tedge-mapper-c8y"
            "${SNAP_NAME}.tedge-mapper-aws"
            "${SNAP_NAME}.tedge-mapper-az"
            "${SNAP_NAME}.tedge-watchdog"
            "${SNAP_NAME}.mosquitto"
            "${SNAP_NAME}.tedge-datalayer-bridge"
            "${SNAP_NAME}.webserver"
        )
        for svc in "${SERVICES[@]}"; do
            if snap services "$svc" 2>/dev/null | grep -q "active"; then
                echo "[✓] Service läuft: $svc"
            else
                echo "[✗] Service NICHT aktiv: $svc"
            fi
        done

        echo "[i] Teste tedge CLI..."
        if tedge --version 2>/dev/null; then
            echo "[✓] tedge CLI funktioniert."
        else
            echo "[✗] tedge CLI nicht verfügbar oder Fehler."
        fi
else
        echo "[✗] No snap files found. Build may have failed."
        exit 1
fi

echo "=============================================="
echo "Setup and Build Complete!"
echo "=============================================="
echo ""

TOTAL_SIZE=$(du -ch *.snap 2>/dev/null | grep total | cut -f1)
if [ -n "$TOTAL_SIZE" ]; then
    echo "[✓] Total size of snap packages: $TOTAL_SIZE"
fi
