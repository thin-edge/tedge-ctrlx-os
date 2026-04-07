#!/bin/bash
set -euo pipefail

# Immer relativ zum Skript-Standort arbeiten
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Zentraler Build-Log
BUILD_LOG="logs/build-all-$(date +%Y%m%d-%H%M%S).log"
echo "[i] Schreibe alle Ausgaben in $BUILD_LOG"
exec > >(tee "$BUILD_LOG") 2>&1

# Setup-Umgebung
# Prüft und installiert Rust, Snapcraft und Build-Abhängigkeiten
# Kann als eigenständiges Setup-Skript verwendet werden


echo "[setup-env.sh] Prüfe und installiere Build-Umgebung..."

# Prüft, ob ein Befehl existiert
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

echo "=============================================="
echo "Step 1: Check and Install Rust"
echo "=============================================="

if command_exists rustc; then
	RUST_VERSION=$(rustc --version | cut -d' ' -f2)
	echo "[✓] Rust is already installed (version: $RUST_VERSION)"
	if command_exists cargo; then
		echo "[✓] Cargo is available"
	fi
else
	echo "[i] Rust not found. Installing Rust toolchain..."
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.94
	source "$HOME/.cargo/env"
	if command_exists rustc; then
		echo "[✓] Rust installed successfully: $(rustc --version)"
	else
		echo "[✗] Failed to install Rust"; exit 1
	fi
fi

if command_exists rustup; then
	echo "[i] Setting Rust 1.94 as default..."
	rustup default 1.94 || rustup install 1.94 && rustup default 1.94
	echo "[✓] Rust 1.94 is active"
fi

echo "=============================================="
echo "Step 2: Check and Install Snapcraft"
echo "=============================================="

if command_exists snapcraft; then
	SNAPCRAFT_VERSION=$(snapcraft --version 2>/dev/null || echo "unknown")
	echo "[✓] Snapcraft is already installed (version: $SNAPCRAFT_VERSION)"
else
	echo "[i] Snapcraft not found. Installing..."
	if command_exists snap; then
		sudo snap install snapcraft --classic
		if command_exists snapcraft; then
			echo "[✓] Snapcraft installed successfully"
		else
			echo "[✗] Failed to install Snapcraft"; exit 1
		fi
	else
		echo "[✗] Snap is not available on this system"; exit 1
	fi
fi


# Build-Info erzeugen
echo "=============================================="
echo "Step 4: Generate Build Info"
echo "=============================================="
echo "[build-info.sh] Erzeuge build-info.txt ..."

VERSION="1.7.1"
BUILD_NUMBER="$(date +%Y%m%d%H%M%S)"
BUILD_DATE="$(date '+%Y-%m-%d %H:%M:%S %Z')"
BUILD_HOST="$(hostname)"
BUILD_USER="$(whoami)"
BUILD_ARCH="$(uname -m)"
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
echo "[✓] build-info.txt erzeugt: $BUILD_INFO_FILE"

# Angular UI bauen
echo "=============================================="
echo "Step 5: Build Angular Management UI"
echo "=============================================="
if [ -d "ui" ]; then
  echo "[i] Installiere Angular-Abhängigkeiten..."
  (cd ui && npm install --legacy-peer-deps 2>&1 | tail -5)

  # Webpack-Symlink für @c8y/devkit (Instanzkonflikt webpack / @angular-devkit)
  echo "[i] Stelle webpack-Symlink her..."
  UI_DEVKIT_WP="ui/node_modules/@angular-devkit/build-angular/node_modules/webpack"
  if [ -L "ui/node_modules/webpack" ]; then
    rm "ui/node_modules/webpack"
  elif [ -d "ui/node_modules/webpack" ]; then
    rm -rf "ui/node_modules/webpack"
  fi
  ln -s "$(pwd)/${UI_DEVKIT_WP}" "ui/node_modules/webpack"

  echo "[i] Baue Angular Production Build..."
  (cd ui && node_modules/.bin/ng build --configuration production 2>&1 | tail -5)

  echo "[i] Kopiere Angular-Build nach web/www/ ..."
  # Zuerst alles außer Icon-Dateien und *.less entfernen
  find web/www -mindepth 1 ! -name 'icon.png' ! -name 'icon.svg' ! -name '*.less' -delete 2>/dev/null || true
  # Gebaute Dateien kopieren (über /tmp um Shell-Glob-Probleme zu vermeiden)
  cp -r "ui/dist/tedge-mgmt-ui" /tmp/_angular_ui_build
  cp -r /tmp/_angular_ui_build/. web/www/
  rm -rf /tmp/_angular_ui_build

  # cumulocity.json für standalone-Modus patchen
  cat > web/www/cumulocity.json << 'CUMULOCITY_JSON'
{
  "name": "thin-edge.io Configuration",
  "contextPath": "thin-edge-io",
  "key": "thin-edge-io-key",
  "noLogin": true,
  "noAppSwitcher": true,
  "hidePowered": false,
  "disableTracking": true
}
CUMULOCITY_JSON

  # index.html: window.C8Y_CLOUD_CONFIG vor dem Main-Bundle einfügen (verhindert C8y-Auth-Versuche)
  if grep -q "window.C8Y_CLOUD_CONFIG" web/www/index.html 2>/dev/null; then
    echo "[i] index.html bereits gepatcht"
  else
    sed -i 's|<script defer src="main\.|<script>\n    window.C8Y_CLOUD_CONFIG = { noLogin: true, noAppSwitcher: true, disableTracking: true };\n  </script>\n  <script defer src="main.|' web/www/index.html
    echo "[✓] index.html mit C8Y_CLOUD_CONFIG gepatcht"
  fi

  echo "[✓] Angular UI nach web/www/ kopiert"
else
  echo "[WARNUNG] Verzeichnis 'ui' nicht gefunden, UI-Build wird übersprungen."
fi


# Format- und Lint-Checks

echo "=============================================="
echo "Step 7: Format- und Lint-Checks"
echo "=============================================="

# Sicherstellen, dass wir im Hauptverzeichnis des Projekts sind
cd "$SCRIPT_DIR"

# Rust: rustfmt (muss installiert sein)
RUSTFMT_CMD=$(command -v rustfmt || true)
if [ -z "$RUSTFMT_CMD" ]; then
  echo "[FEHLER] rustfmt ist nicht installiert. Bitte mit 'rustup component add rustfmt' installieren."
  exit 1
fi

# Rust Linting (nur wenn Clippy vorhanden)
if cargo clippy --version >/dev/null 2>&1; then
  echo "[i] Führe Rust Clippy aus..."
  if [ -d "bridge-service-rust" ]; then
    (cd bridge-service-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
  if [ -d "web-server-rust" ]; then
    (cd web-server-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
else
  echo "[WARNUNG] Clippy ist nicht installiert. Rust-Linting wird übersprungen."
fi

# Rust automatisch formatieren (cargo fmt)
echo "[i] Führe cargo fmt für alle Rust-Projekte aus..."
if [ -d "bridge-service-rust" ]; then
  (cd bridge-service-rust && cargo fmt)
fi
if [ -d "web-server-rust" ]; then
  (cd web-server-rust && cargo fmt)
fi

# Rust prüfen
echo "[i] Prüfe Rust-Formatierung..."
find bridge-service-rust web-server-rust -type f -name '*.rs' -not -path "*/target/*" | \
  xargs "$RUSTFMT_CMD" --edition 2021 --check

echo "[✓] Alle Format- und Lintprüfungen bestanden!"


# Snap bauen
echo "=============================================="
echo "Step 8: Build Snap"
echo "=============================================="
# Wieder sicherstellen, dass wir im Hauptverzeichnis bleiben!
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

BUILD_DATE="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
BUILD_NUMBER="build.$(date -u +%Y%m%d.%H%M)"
BUILD_HOST="$(hostname)"
BUILD_USER="$(whoami)"
VERSION=$(grep "^version:" snap/snapcraft.yaml | awk '{print $2}' | tr -d '"')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# --- NEU: thin-edge.io HEAD Commit holen und snapcraft.yaml aktualisieren ---
THIN_EDGE_IO_REPO="https://github.com/thin-edge/thin-edge.io.git"
THIN_EDGE_IO_COMMIT=$(git ls-remote "$THIN_EDGE_IO_REPO" HEAD | awk '{print $1}')
if [ -z "$THIN_EDGE_IO_COMMIT" ]; then
  echo "[FEHLER] Konnte aktuellen Commit von $THIN_EDGE_IO_REPO nicht ermitteln!" >&2
  exit 1
fi
echo "[i] Setze source-commit in snapcraft.yaml auf $THIN_EDGE_IO_COMMIT"
sed -i "s/^\(\s*source-commit:\s*\).*/\1$THIN_EDGE_IO_COMMIT/" snap/snapcraft.yaml
# --- ENDE NEU ---

mkdir -p logs

echo "======================================"
echo "Building thin-edge.io CTRLX App"
echo "Version: ${VERSION}  Commit: ${GIT_COMMIT}  Upstream: ${THIN_EDGE_IO_COMMIT}"
echo "======================================"

cat > "configs/build-info.txt" << EOF
Version: ${VERSION}+${BUILD_NUMBER}
Build Date: ${BUILD_DATE}
Build Host: ${BUILD_HOST}
Build User: ${BUILD_USER}
Base: core22
Architecture: amd64
Git Commit: ${GIT_COMMIT}
Upstream Commit: ${THIN_EDGE_IO_COMMIT}
EOF
echo "[i] Build-Info aktualisiert."

AMD64_BUILD_LOG="logs/build-snap-amd64-$(date +%Y%m%d-%H%M%S).log"
echo "[i] Building amd64 snap (logging to $AMD64_BUILD_LOG)..."

if snapcraft --destructive-mode --enable-manifest --target-arch=amd64 2>&1 | tee "$AMD64_BUILD_LOG"; then
    AMD64_SNAP=$(ls -1 thin-edge-io_*_amd64.snap 2>/dev/null | head -1 || true)
    if [ -z "$AMD64_SNAP" ]; then
        echo -e "${RED}[✗] Snap-Build meldet Erfolg, aber keine .snap-Datei gefunden!${NC}"; exit 1
    else
        echo -e "${GREEN}[✓] Snap für amd64 gebaut: $AMD64_SNAP${NC}"
    fi
else
    echo -e "${RED}[✗] Snap-Build für amd64 fehlgeschlagen!${NC}"
    exit 1
fi

# ─── arm64 ───────────────────────────────────────────
echo ""
echo "=============================================="
echo "Step 9: Build Snap for arm64"
echo "=============================================="

ARM64_BUILD_LOG="logs/build-snap-arm64-$(date +%Y%m%d-%H%M%S).log"
echo "[i] Building arm64 snap (logging to $ARM64_BUILD_LOG)..."

if snapcraft --destructive-mode --enable-manifest --target-arch=arm64 2>&1 | tee "$ARM64_BUILD_LOG"; then
    ARM64_SNAP=$(ls -1 thin-edge-io_*_arm64.snap 2>/dev/null | head -1 || true)
    if [ -z "$ARM64_SNAP" ]; then
        echo -e "${RED}[✗] Snap-Build meldet Erfolg, aber keine .snap-Datei gefunden!${NC}"; exit 1
    else
        echo -e "${GREEN}[✓] Snap für arm64 gebaut: $ARM64_SNAP${NC}"
    fi
else
    echo -e "${RED}[✗] Snap-Build für arm64 fehlgeschlagen!${NC}"
    exit 1
fi

# Snap testen


echo "=============================================="
echo "Step 10: Test Snap"
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
        echo "[✗] tedge CLI nicht verfügbar."
    fi
else
    echo "[✗] Keine Snap-Dateien gefunden. Build fehlgeschlagen."
    exit 1
fi

# Abschlussmeldung
cat <<EOF
==============================================
thin-edge.io CTRLX App - Modularer Build-Prozess
==============================================
Build & Test abgeschlossen!
All done! Your thin-edge.io CTRLX app is ready for deployment.
==============================================
EOF


