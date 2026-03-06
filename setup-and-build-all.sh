

#!/bin/bash
set -euo pipefail

# Orchestrator für den kompletten Build-Prozess
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo "thin-edge.io CTRLX App - Modularer Build-Prozess"
echo "=============================================="

scripts/setup-env.sh
scripts/build-bridge.sh
scripts/build-info.sh

echo "----------------------------------------------"
echo "Kompiliere LESS → CSS..."
lessc web/www/styles.less web/www/styles.css
echo "  styles.css aktualisiert."

echo "----------------------------------------------"
echo "Synchronisiere web-server-rust/www/ (lokaler Dev-Server)..."
rsync -a --delete --exclude='styles.less' web/www/ web-server-rust/www/
echo "  web-server-rust/www/ synchronisiert."

scripts/build-snap.sh
scripts/test-snap.sh

echo "=============================================="
echo "Build & Test abgeschlossen!"
echo "=============================================="
echo "All done! Your thin-edge.io CTRLX app is ready for deployment."
