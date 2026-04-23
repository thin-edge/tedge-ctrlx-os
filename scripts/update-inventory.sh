#!/bin/bash
# Update inventory.json with system information for thin-edge.io
# Extracts hardware, OS, network data, and a list of installed snap packages.

set -eo pipefail

echo "Gathering system information for inventory..." >&2

# SNAP_DATA = /var/snap/<name>/current (revision-symlink) — survives updates
STABLE_DIR="${SNAP_DATA:-/var/snap/${SNAP_INSTANCE_NAME:-ctrlx-cumulocity-thin-edge-io}/current}"
INVENTORY_FILE="${STABLE_DIR}/tedge/device/inventory.json"
export INVENTORY_FILE

# ---------------------------------------------------------------------------
# Serial number — always use hardware UUID (manage-device-id.sh get-serial)
# This is the stable hardware identity independent of the certificate CN.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(dirname "$0")"
SERIAL=$(bash "$SCRIPT_DIR/manage-device-id.sh" get-serial 2>/dev/null)
[ -n "$SERIAL" ] && echo "Using hardware serial: $SERIAL" >&2
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
# 1. snap list --json (requires snapd-control — connected during service context)
# 2. snap list (plain text fallback)
# 3. Fallback: own snap only ($SNAP_NAME/$SNAP_VERSION/$SNAP_REVISION)
# Result is a JSON array written directly into inventory.json as c8y_SoftwareList.
# ---------------------------------------------------------------------------
echo "Querying installed snaps..." >&2
SOFTWARE_LIST_JSON=$(python3 - 2>/dev/null << 'PYEOF'
import subprocess, json, sys, os

def query_snap_list_json():
    try:
        out = subprocess.check_output(
            ['snap', 'list', '--json'],
            stderr=subprocess.DEVNULL, timeout=10
        )
        data = json.loads(out)
        snaps_raw = data if isinstance(data, list) else data.get('snaps', [])
        snaps = []
        for sn in snaps_raw:
            name = sn.get('name', '')
            if not name:
                continue
            snaps.append({
                "name": name,
                "version": sn.get('version', '?'),
                "softwareType": "snap",
                "url": f"rev:{sn.get('revision', '?')}"
            })
        if snaps:
            print(f"[SNAP-INV] snap list --json: {len(snaps)} snaps", file=sys.stderr)
            return snaps
    except Exception as e:
        print(f"[SNAP-INV] snap list --json failed: {e}", file=sys.stderr)
    return None

def query_snap_list():
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

snaps = query_snap_list_json() or query_snap_list() or fallback_env()
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
import json, sys, os

model, serial, revision, os_name, iface, ip, mac, sw_json = sys.argv[1:9]

inventory_path = os.environ.get('INVENTORY_FILE', '/var/snap/ctrlx-cumulocity-thin-edge-io/current/tedge/device/inventory.json')

# Read existing inventory to preserve user-edited values
existing = {}
try:
    with open(inventory_path) as f:
        existing = json.load(f)
except Exception:
    pass

def keep(fragment, key, detected):
    """Return existing value if set, otherwise use auto-detected value."""
    v = existing.get(fragment, {}).get(key)
    if v is not None and str(v).strip() not in ("", "auto-detected"):
        return v
    return detected

inventory = {
    "c8y_Hardware": {
        "model":        keep("c8y_Hardware", "model",    model),
        # serialNumber always from hardware UUID — never from cert CN
        "serialNumber": serial,
        "revision":     keep("c8y_Hardware", "revision", revision),
    },
    "c8y_Firmware": {
        "name":    keep("c8y_Firmware", "name",    "Linux"),
        "version": keep("c8y_Firmware", "version", os_name),
        "url":     keep("c8y_Firmware", "url",     ""),
    },
    "c8y_Network": {
        "c8y_LAN": {
            # IP/MAC are always refreshed (they can change)
            "name":    iface,
            "ip":      ip,
            "mac":     mac,
            "enabled": 1,
        }
    },
    "c8y_Position": {
        "lat": keep("c8y_Position", "lat", 51.151977),
        "lng": keep("c8y_Position", "lng", 6.96173),
        "alt": keep("c8y_Position", "alt", 67),
    },
    "ctrlX_Info": {
        "device_type":  keep("ctrlX_Info", "device_type",  "PLC / Edge Controller"),
        "manufacturer": keep("ctrlX_Info", "manufacturer", "Bosch Rexroth"),
    },
    # Software list always refreshed
    "c8y_SoftwareList": json.loads(sw_json),
}

os.makedirs(os.path.dirname(inventory_path), exist_ok=True)
with open(inventory_path, 'w') as f:
    json.dump(inventory, f, indent=2)
print(f"Written: {inventory_path}", file=sys.stderr)
PYEOF

SNAP_COUNT=$(echo "$SOFTWARE_LIST_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")
echo "Updated $INVENTORY_FILE with hardware info and $SNAP_COUNT snaps." >&2

# ---------------------------------------------------------------------------
# Publish each inventory fragment individually as retained twin topics.
# te/device/main///twin/<fragment> → c8y-mapper → C8y inventory update.
# Uses mosquitto_pub (bundled in snap). || true = never fail hook.
# ---------------------------------------------------------------------------
MQTT_PUB=""
if [ -n "${SNAP:-}" ] && [ -x "$SNAP/usr/bin/mosquitto_pub" ]; then
    MQTT_PUB="$SNAP/usr/bin/mosquitto_pub"
elif command -v mosquitto_pub >/dev/null 2>&1; then
    MQTT_PUB="mosquitto_pub"
fi

if [ -n "$MQTT_PUB" ]; then
    echo "Publishing inventory fragments to MQTT..." >&2

    # Extract each fragment from inventory.json and publish as twin topic
    python3 - "$INVENTORY_FILE" << 'PUBEOF'
import json, sys, subprocess, os

inv_path = sys.argv[1]
mqtt_pub = ""
snap = os.environ.get("SNAP", "")
if snap and os.path.isfile(f"{snap}/usr/bin/mosquitto_pub"):
    mqtt_pub = f"{snap}/usr/bin/mosquitto_pub"
else:
    mqtt_pub = "mosquitto_pub"

try:
    with open(inv_path) as f:
        inv = json.load(f)
except Exception as e:
    print(f"Cannot read inventory: {e}", file=sys.stderr)
    sys.exit(0)

for key, value in inv.items():
    topic = f"te/device/main///twin/{key}"
    payload = json.dumps(value)
    try:
        subprocess.run(
            [mqtt_pub, "-h", "127.0.0.1", "-p", "1883", "-r", "-t", topic, "-m", payload],
            check=False, timeout=5, capture_output=True
        )
        print(f"  Published {topic}", file=sys.stderr)
    except Exception as e:
        print(f"  Failed to publish {topic}: {e}", file=sys.stderr)
PUBEOF
    echo "Inventory fragments published." >&2
else
    echo "mosquitto_pub not available — skipping MQTT publish" >&2
fi

# ---------------------------------------------------------------------------
# Check if snapd-control is connected (for complete snap list)
# ---------------------------------------------------------------------------
SNAP_INSTANCE="${SNAP_INSTANCE_NAME:-ctrlx-cumulocity-thin-edge-io}"
if snap connections "${SNAP_INSTANCE}" 2>/dev/null | grep -q "snapd-control.*-$"; then
    echo "WARNING: snapd-control not connected — snap list shows only own snap." >&2
    echo "         Run: sudo snap connect ${SNAP_INSTANCE}:snapd-control" >&2
fi