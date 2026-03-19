#!/bin/bash
set -euo pipefail
lessc web/www/styles.less web/www/styles.css
cp web/www/index.html web-server-rust/www/index.html
cp web/www/app.js web-server-rust/www/app.js
cp web/www/styles.less web-server-rust/www/styles.less
cp web/www/styles.css web-server-rust/www/styles.css

cd web-server-rust
cargo build --release
cargo run --release