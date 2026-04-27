#!/bin/bash
# Script: check-format.sh
# Checks formatting of JS, HTML, and Rust files in the project
# Exits on errors (e.g. unformatted files)

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

# JS/HTML: Prettier (must be installed)
PRETTIER_CMD=$(command -v prettier || true)
if [ -z "$PRETTIER_CMD" ]; then
  echo "[ERROR] Prettier is not installed. Please run 'npm install -g prettier' to install it."
  exit 1
fi

# Rust: rustfmt (must be installed)
RUSTFMT_CMD=$(command -v rustfmt || true)
if [ -z "$RUSTFMT_CMD" ]; then
  echo "[ERROR] rustfmt is not installed. Please run 'rustup component add rustfmt' to install it."
  exit 1
fi

# JS Linting (only if ESLint is available)
ESLINT_CMD=$(command -v eslint || true)
if [ -z "$ESLINT_CMD" ]; then
  echo "[WARNING] ESLint is not installed. JS linting will be skipped. (npm install -g eslint)"
else
  # Note: Script expects to be run from the project root.
  # Check Node.js version for ESLint compatibility
  if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 16 ]; then
      echo "[ERROR] Node.js >= 16 is required for modern ESLint versions. Please update Node.js!"
      exit 1
    fi
  fi

  find ./web/www -type f -name '*.js' | xargs "$ESLINT_CMD"
fi

# Rust Linting (only if Clippy is available)
if cargo clippy --version >/dev/null 2>&1; then
  if [ -d "bridge-service-rust" ]; then
    (cd bridge-service-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
  if [ -d "web-server-rust" ]; then
    (cd web-server-rust && cargo clippy --all-targets --all-features -- -D warnings)
  fi
else
  echo "[WARNING] Clippy is not installed. Rust linting will be skipped. (rustup component add clippy)"
fi

# JS/HTML: check and optionally auto-format
if [ "$1" = "--fix" ]; then
  echo "[i] Running Prettier with --write (auto-fix)..."
  find ./web/www -type f \( -name '*.js' -o -name '*.html' \) | xargs "$PRETTIER_CMD" --write
else
  echo "[i] Checking formatting with Prettier..."
  find ./web/www -type f \( -name '*.js' -o -name '*.html' \) | xargs "$PRETTIER_CMD" --check
fi

# Rust: check formatting
find bridge-service-rust web-server-rust -type f -name '*.rs' -not -path "*/target/*" | \
  xargs "$RUSTFMT_CMD" --edition 2021 --check

echo "All format and lint checks passed!"
