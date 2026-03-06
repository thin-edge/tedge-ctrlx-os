#!/bin/bash
set -euo pipefail
# Validiert zentrale Konfigurationsdateien (manifest.json, package-manifest.json, ggf. weitere)

fail=0

# Prüfe manifest.json (JSON-Syntax)
if [ -f "configs/manifest.json" ]; then
  if jq empty configs/manifest.json; then
    echo "[✓] configs/manifest.json ist gültiges JSON."
  else
    echo "[✗] Fehler in configs/manifest.json (kein gültiges JSON)"; fail=1
  fi
else
  echo "[!] configs/manifest.json nicht gefunden."
fi

# Prüfe package-manifest.json (JSON-Syntax)
if [ -f "configs/package-manifest.json" ]; then
  if jq empty configs/package-manifest.json; then
    echo "[✓] configs/package-manifest.json ist gültiges JSON."
  else
    echo "[✗] Fehler in configs/package-manifest.json (kein gültiges JSON)"; fail=1
  fi
else
  echo "[!] configs/package-manifest.json nicht gefunden."
fi

# Weitere Checks können hier ergänzt werden (z.B. YAML, Schema-Validierung)

exit $fail
