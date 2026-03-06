#!/bin/bash
set -euo pipefail
# Erzeugt configs/build-info.txt mit Build-Informationen


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
