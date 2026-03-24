#!/bin/bash
# Update inventory.json with system information for thin-edge.io
# Extracts hardware, OS, network data, and a detailed list of installed snap packages.

set -e

echo "Gathering system information for inventory..." >&2

# Nutze exakt die update-sicheren Pfade
STABLE_CURRENT="/var/snap/${SNAP_INSTANCE_NAME:-thin-edge-io}/current"
STABLE_COMMON="/var/snap/${SNAP_INSTANCE_NAME:-thin-edge-io}/common"

INVENTORY_FILE="${STABLE_CURRENT}/tedge/device/inventory.json"

# Stelle sicher, dass der Ordner existiert
mkdir -p "$(dirname "$INVENTORY_FILE")"

# --- 1. Daten sammeln ---

# Seriennummer (Versuche Hardware-DMI, ansonsten Hostname)
SERIAL=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$SERIAL" ] && SERIAL=$(cat /sys/class/dmi/id/board_serial 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$SERIAL" ] && SERIAL=$(hostname 2>/dev/null)
[ -z "$SERIAL" ] && SERIAL="ctrlX-Unknown"

# Modell
MODEL=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$MODEL" ] && MODEL="Bosch ctrlX CORE"

# Revision / Version
REVISION=$(cat /sys/class/dmi/id/product_version 2>/dev/null | tr -d '\0\n' | xargs)
[ -z "$REVISION" ] && REVISION="1.0"

# Betriebssystem (Lese /etc/os-release aus)
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME="${PRETTY_NAME:-Ubuntu Core}"
else
    OS_NAME="Linux"
fi

# IP-Adresse
IP_ADDRESS=$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{print $7}' | head -n 1)
[ -z "$IP_ADDRESS" ] && IP_ADDRESS=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$IP_ADDRESS" ] && IP_ADDRESS="127.0.0.1"

# MAC-Adresse & Interface-Name
INTERFACE=$(ip -4 route get 8.8.8.8 2>/dev/null | awk '{print $5}' | head -n 1)
[ -z "$INTERFACE" ] && INTERFACE="eth0"
MAC_ADDRESS=$(cat /sys/class/net/$INTERFACE/address 2>/dev/null)
[ -z "$MAC_ADDRESS" ] && MAC_ADDRESS="00:00:00:00:00:00"

# --- 2. Installierte Snaps detailliert auslesen (c8y_SoftwareList) ---
SOFTWARE_JSON=""
if command -v snap >/dev/null 2>&1; then
    SOFTWARE_JSON=$(snap list 2>/dev/null | awk 'NR>1 {
        name = $1
        version = $2
        rev = $3
        tracking = $4
        publisher = $5
        notes = $6
        
        # Säubere leere Werte (Minus-Zeichen in snap list)
        if (tracking == "-") tracking = ""
        if (publisher == "-") publisher = ""
        if (notes == "-") notes = ""
        
        # Formatiere als JSON-Objekt
        printf "%s{\"name\": \"%s\", \"version\": \"%s\", \"url\": \"%s\", \"revision\": \"%s\", \"publisher\": \"%s\", \"notes\": \"%s\"}", sep, name, version, tracking, rev, publisher, notes
        sep=",\n    "
    }')
fi

# --- 3. JSON generieren und schreiben ---

cat <<EOF > "$INVENTORY_FILE"
{
  "c8y_Hardware": {
    "model": "$MODEL",
    "serialNumber": "$SERIAL",
    "revision": "$REVISION"
  },
  "c8y_OS": {
    "family": "Linux",
    "version": "$OS_NAME"
  },
  "c8y_Network": {
    "c8y_LAN": {
      "name": "$INTERFACE",
      "ip": "$IP_ADDRESS",
      "mac": "$MAC_ADDRESS",
      "enabled": 1
    }
  },
  "c8y_SoftwareList": [
    $SOFTWARE_JSON
  ],
  "ctrlX_Info": {
    "device_type": "PLC / Edge Controller",
    "manufacturer": "Bosch Rexroth"
  }
}
EOF

# Setze korrekte Rechte, damit Cumulocity und der Agent die Datei lesen können
chmod 644 "$INVENTORY_FILE"

echo "Updated $INVENTORY_FILE successfully with detailed snap software list." >&2