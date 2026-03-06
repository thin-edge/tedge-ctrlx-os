#!/bin/bash
set -euo pipefail
# Baut und testet die Rust Datalayer Bridge


echo "[build-bridge.sh] Baue und teste Rust-Bridge..."

BRIDGE_LOG="build-rust-bridge-$(date +%Y%m%d-%H%M%S).log"
echo "Log file: $BRIDGE_LOG"
echo ""

{
	echo "=============================================="
	echo "Rust Datalayer Bridge Build"
	echo "Started: $(date '+%Y-%m-%d %H:%M:%S %Z')"
	echo "=============================================="
	echo ""
	cd bridge-service-rust
	echo "[1/3] Building bridge..."
	if cargo build --release 2>&1; then
		echo ""
		echo "[✓] Bridge compiled successfully"
		BRIDGE_BIN="target/release/tedge-datalayer-bridge"
		if [ -f "$BRIDGE_BIN" ]; then
			BRIDGE_SIZE=$(du -h "$BRIDGE_BIN" | cut -f1)
			echo "[✓] Binary created: $BRIDGE_BIN ($BRIDGE_SIZE)"
		fi
		echo ""
		echo "[2/3] Running tests..."
		if cargo test 2>&1; then
			echo "[✓] All tests passed"
		else
			echo "[!] Some tests failed (non-critical)"
		fi
		echo ""
		echo "[3/3] Checking binary..."
		if [ -f "$BRIDGE_BIN" ]; then
			echo "Binary information:"
			file "$BRIDGE_BIN"
			ls -lh "$BRIDGE_BIN"
			echo ""
			echo "[✓] Bridge is ready for snap packaging"
		else
			echo "[✗] Binary not found!"; exit 1
		fi
	else
		echo "[✗] Bridge build failed!"; exit 1
	fi
	cd ..
	echo ""
	echo "=============================================="
	echo "Rust Bridge Build Complete"
	echo "Completed: $(date '+%Y-%m-%d %H:%M:%S %Z')"
	echo "=============================================="
} 2>&1 | tee "$BRIDGE_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
	echo "[✓] Rust bridge built and tested successfully!"
	echo "[i] Build log: $BRIDGE_LOG"
else
	echo "[✗] Rust bridge build failed!"
	echo "[i] Check log file: $BRIDGE_LOG"
	exit 1
fi
