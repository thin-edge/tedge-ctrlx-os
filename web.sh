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
  hybrid)
    echo "Starting hybrid UI: classic web/www + Node.js backend on port 9080..."
    lessc web/www/styles.less web/www/styles.css
    cp web/www/index.html web-server-rust/www/index.html
    cp web/www/app.js    web-server-rust/www/app.js
    cp web/www/styles.less web-server-rust/www/styles.less
    cp web/www/styles.css  web-server-rust/www/styles.css
    cp web/www/icon.svg  web-server-rust/www/icon.svg 2>/dev/null || true

    # Start Node.js backend (Socket.IO, tedge commands) on port 9080
    echo "Starting Node.js backend on port 9080..."
    if [[ ! -d management-ui/server/node_modules ]]; then
      (cd management-ui/server && npm install)
    fi
    pkill -f "node.*management-ui/server/app/server.js" 2>/dev/null || true
    sudo mkdir -p /etc/tedge-mgmt-server
    mkdir -p logs
    node management-ui/server/app/server.js > "$PWD/logs/backend.log" 2>&1 &
    echo "Node.js backend PID: $!"
    ;;
  *)
    echo "Usage: $0 [classic|hybrid]"
    echo "  classic    – original web/www single-page UI (default)"
    echo "  hybrid     – web/www UI + Node.js backend on port 9080"
    exit 1
    ;;
esac

cd web-server-rust
cargo build --release
SNAP_DATA=.. cargo run --release
