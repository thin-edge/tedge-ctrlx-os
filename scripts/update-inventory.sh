#!/bin/bash
# Update inventory.json with system information for thin-edge.io
# Extracts hardware, OS, network data, and a list of installed snap packages.

set -eo pipefail

echo "Gathering system information for inventory..." >&2

STABLE_COMMON="/var/snap/${SNAP_INSTANCE_NAME:-thin-edge-io}/common"
INVENTORY_FILE="${STABLE_COMMON}/tedge/device/inventory.json"
export INVENTORY_FILE

# ---------------------------------------------------------------------------
# Serial number — single source of truth:
# 1. Cert CN (= tedge device identity) if certificate exists
# 2. manage-device-id.sh get-serial (new device, no cert yet)
# ---------------------------------------------------------------------------
CERT_FILE="${STABLE_COMMON}/package-certificates/thin-edge-io/tedge/own/certs/tedge-certificate.pem"
SERIAL=""
if [ -f "$CERT_FILE" ]; then
    SERIAL=$(openssl x509 -in "$CERT_FILE" -noout -subject 2>/dev/null \
        | sed -n 's/.*CN\s*=\s*\([^,/]*\).*/\1/p' | sed 's/[[:space:]]*$//')
    [ -n "$SERIAL" ] && echo "Using cert CN as serial: $SERIAL" >&2
fi
if [ -z "$SERIAL" ]; then
    SCRIPT_DIR="$(dirname "$0")"
    SERIAL=$(bash "$SCRIPT_DIR/manage-device-id.sh" get-serial 2>/dev/null)
    [ -n "$SERIAL" ] && echo "Using get-serial as serial: $SERIAL" >&2
fi
[ -z "$SERIAL" ] && SERIAL="ctrlX-Unknown"

# ---------------------------------------------------------------------------
# Hardware info
# ---------------------------------------------------------------------------
MODEL=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$MODEL" ] && MODEL="Bosch ctrlX CORE"

REVISION=$(cat /sys/class/dmi/id/product_version 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$REVISION" ] && REVISION="1.0"

# ---------------------------------------------------------------------------
# OS
# ---------------------------------------------------------------------------
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME="${PRETTY_NAME:-Ubuntu Core}"
else
    OS_NAME="Linux"
fi

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------
IP_ADDRESS=$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{print $7}' | head -n 1)
[ -z "$IP_ADDRESS" ] && IP_ADDRESS=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$IP_ADDRESS" ] && IP_ADDRESS="127.0.0.1"

INTERFACE=$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{print $5}' | head -n 1)
[ -z "$INTERFACE" ] && INTERFACE="eth0"
MAC_ADDRESS=$(cat /sys/class/net/"$INTERFACE"/address 2>/dev/null)
[ -z "$MAC_ADDRESS" ] && MAC_ADDRESS="00:00:00:00:00:00"

# ---------------------------------------------------------------------------
# Snap software list — same priority chain as serial number:
# 1. snapd REST API via /run/snapd-snap.socket (no extra interface needed)
# 2. snap list (requires snapd-control)
# 3. Fallback: own snap only ($SNAP_NAME/$SNAP_VERSION/$SNAP_REVISION)
# Result is a JSON array written directly into inventory.json as c8y_SoftwareList.
# ---------------------------------------------------------------------------
echo "Querying installed snaps..." >&2
SOFTWARE_LIST_JSON=$(python3 - 2>/dev/null << 'PYEOF'
import socket, json, sys, os

def query_snapd_socket():
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect('/run/snapd-snap.socket')
        sock.sendall(b'GET /v2/snaps HTTP/1.0\r\nHost: localhost\r\n\r\n')
        data = b''
        while True:
            chunk = sock.recv(8192)
            if not chunk:
                break
            data += chunk
        sock.close()
        body = data.split(b'\r\n\r\n', 1)[-1]
        result = json.loads(body)
        snaps = []
        for snap in result.get('result', []):
            name = snap.get('name', '')
            version = snap.get('version', '')
            revision = snap.get('revision', '')
            if name:
                snaps.append({
                    "name": name,
                    "version": version,
                    "softwareType": "snap",
                    "url": f"rev:{revision}"
                })
        if snaps:
            print(f"[SNAP-INV] snapd socket: {len(snaps)} snaps", file=sys.stderr)
            return snaps
    except Exception as e:
        print(f"[SNAP-INV] snapd socket failed: {e}", file=sys.stderr)
    return None

def query_snap_list():
    import subprocess
    try:
        out = subprocess.check_output(
            ['snap', 'list', '--unicode=never', '--color=never'],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode()
        snaps = []
        for line in out.splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 3:
                snaps.append({
                    "name": parts[0],
                    "version": parts[1],
                    "softwareType": "snap",
                    "url": f"rev:{parts[2]}"
                })
        if snaps:
            print(f"[SNAP-INV] snap list: {len(snaps)} snaps", file=sys.stderr)
            return snaps
    except Exception as e:
        print(f"[SNAP-INV] snap list failed: {e}", file=sys.stderr)
    return None

def fallback_env():
    name = os.environ.get('SNAP_NAME', '')
    version = os.environ.get('SNAP_VERSION', '')
    revision = os.environ.get('SNAP_REVISION', '')
    if name:
        print("[SNAP-INV] fallback: env vars only", file=sys.stderr)
        return [{"name": name, "version": version, "softwareType": "snap", "url": f"rev:{revision}"}]
    return []

snaps = query_snapd_socket() or query_snap_list() or fallback_env()
print(json.dumps(snaps))
PYEOF
)

# Validate JSON (fallback to empty list if Python3 failed entirely)
if ! echo "$SOFTWARE_LIST_JSON" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
    echo "[SNAP-INV] WARNING: invalid JSON from snap query, using empty list" >&2
    SOFTWARE_LIST_JSON="[]"
fi

echo "Snap list: $SOFTWARE_LIST_JSON" >&2

# ---------------------------------------------------------------------------
# Write inventory.json using Python3 for safe JSON serialization
# (avoids heredoc injection with special characters in variable values)
# ---------------------------------------------------------------------------
python3 - "$MODEL" "$SERIAL" "$REVISION" "$OS_NAME" \
         "$INTERFACE" "$IP_ADDRESS" "$MAC_ADDRESS" \
         "$SOFTWARE_LIST_JSON" << 'PYEOF'
import json, sys

model, serial, revision, os_name, iface, ip, mac, sw_json = sys.argv[1:9]

inventory = {
    "c8y_Hardware": {
        "model": model,
        "serialNumber": serial,
        "revision": revision
    },
    "c8y_OS": {
        "family": "Linux",
        "version": os_name
    },
    "c8y_Network": {
        "c8y_LAN": {
            "name": iface,
            "ip": ip,
            "mac": mac,
            "enabled": 1
        }
    },
    "ctrlX_Info": {
        "device_type": "PLC / Edge Controller",
        "manufacturer": "Bosch Rexroth"
    },
    "c8y_SoftwareList": json.loads(sw_json)
}

import os
inventory_path = os.environ.get('INVENTORY_FILE', '/var/snap/thin-edge-io/common/tedge/device/inventory.json')
with open(inventory_path, 'w') as f:
    json.dump(inventory, f, indent=2)
print(f"Written: {inventory_path}", file=sys.stderr)
PYEOF

echo "Updated $INVENTORY_FILE with hardware info and $(echo "$SOFTWARE_LIST_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))") snaps." >&2