#!/bin/bash
# Script: check-format.sh
# Prüft das Format von JS, HTML und Rust-Dateien im Projekt
# Abbruch bei Fehlern (z.B. nicht formatiert)

set -e

# Immer relativ zum Skript-Standort arbeiten
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

# JS/HTML: Prettier (muss installiert sein)
PRETTIER_CMD=$(command -v prettier || true)
if [ -z "$PRETTIER_CMD" ]; then
  echo "[FEHLER] Prettier ist nicht installiert. Bitte mit 'npm install -g prettier' installieren."
  exit 1
fi

# Rust: rustfmt (muss installiert sein)
RUSTFMT_CMD=$(command -v rustfmt || true)
if [ -z "$RUSTFMT_CMD" ]; then
  echo "[FEHLER] rustfmt ist nicht installiert. Bitte mit 'rustup component add rustfmt' installieren."
  exit 1
fi

# JS Linting (nur wenn ESLint vorhanden)
ESLINT_CMD=$(command -v eslint || true)
if [ -z "$ESLINT_CMD" ]; then
  echo "[WARNUNG] ESLint ist nicht installiert. JS-Linting wird übersprungen. (npm install -g eslint)"
else
  # Hinweis: Skript erwartet Ausführung aus dem Projekt-Root.
  # Prüfe Node.js-Version für ESLint-Kompatibilität
  if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 16 ]; then
      echo "[FEHLER] Node.js >= 16 wird für moderne ESLint-Versionen benötigt. Bitte Node.js aktualisieren!"
      exit 1
    fi
  fi

  find ./web/www -type f -name '*.js' | xargs "$ESLINT_CMD"
fi

# Rust Linting (nur wenn Clippy vorhanden)
if cargo clippy --version >/dev/null 2>&1; then
  if [ -d "bridge-service-rust" ]; then
    (cd bridge-service-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
  if [ -d "web-server-rust" ]; then
    (cd web-server-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
else
  echo "[WARNUNG] Clippy ist nicht installiert. Rust-Linting wird übersprungen. (rustup component add clippy)"
fi

# JS/HTML prüfen und ggf. automatisch formatieren
if [ "$1" = "--fix" ]; then
  echo "[i] Führe Prettier mit --write aus (automatische Korrektur)..."
  find ./web/www -type f \( -name '*.js' -o -name '*.html' \) | xargs "$PRETTIER_CMD" --write
else
  echo "[i] Prüfe Formatierung mit Prettier..."
  find ./web/www -type f \( -name '*.js' -o -name '*.html' \) | xargs "$PRETTIER_CMD" --check
fi

# Rust prüfen
find bridge-service-rust web-server-rust -type f -name '*.rs' -not -path "*/target/*" | \
  xargs "$RUSTFMT_CMD" --edition 2021 --check

echo "Alle Format- und Lintprüfungen bestanden!"
echo "Alle Format- und Lintprüfungen bestanden!"
