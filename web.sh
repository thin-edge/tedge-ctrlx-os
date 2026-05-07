#!/bin/bash
set -euo pipefail

UI="${1:-classic}"

case "$UI" in
  classic)
    echo "Starting classic UI (web/www)..."
    lessc web/www/styles.less web/www/styles.css
    cp web/www/index.html web-server-rust/www/index.html
    cp web/www/app.js    web-server-rust/www/app.js
    cp web/www/styles.less web-server-rust/www/styles.less
    cp web/www/styles.css  web-server-rust/www/styles.css
    ;;
  *)

    ;;
esac

cd web-server-rust
cargo build --release
SNAP_DATA=.. cargo run --release
