#!/bin/bash
# Device ID Management Script for thin-edge.io Snap
# Handles automatic detection, manual setting, certificate creation, and inventory update

set -eo pipefail

TEDGE_CONFIG_DIR="${SNAP_DATA:-/var/snap/thin-edge-io/current}/tedge"
TEDGE_DATA_DIR="${SNAP_COMMON:-/var/snap/thin-edge-io/common}/tedge"
TEDGE_BIN="${SNAP:-/snap/thin-edge-io/current}/bin/tedge"

# ctrlX Certificate Store paths (managed by ctrlX Certificate Manager)
CERT_STORE_DIR="${SNAP_COMMON:-/var/snap/thin-edge-io/common}/package-certificates/thin-edge-io/tedge"
CERT_FILE="$CERT_STORE_DIR/own/certs/tedge-certificate.pem"
KEY_FILE="$CERT_STORE_DIR/own/private/tedge-private-key.pem"

# Function to get system serial number
get_system_serial() {
    local serial=""
    
    # Priority 1: ctrlX product serial
    if [ -r /sys/class/dmi/id/product_serial ] && [ -s /sys/class/dmi/id/product_serial ]; then
        serial=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d '\0\n' | xargs)
        if [ -n "$serial" ] && [ "$serial" != "0" ] && [ "$serial" != "None" ]; then
            echo "ctrlx-$serial"
            return 0
        fi
    fi
    
    # Priority 2: Board serial
    if [ -r /sys/class/dmi/id/board_serial ] && [ -s /sys/class/dmi/id/board_serial ]; then
        serial=$(cat /sys/class/dmi/id/board_serial 2>/dev/null | tr -d '\0\n' | xargs)
        if [ -n "$serial" ] && [ "$serial" != "0" ] && [ "$serial" != "None" ]; then
            echo "ctrlx-$serial"
            return 0
        fi
    fi
    
    # Priority 3: Chassis serial
    if [ -r /sys/class/dmi/id/chassis_serial ] && [ -s /sys/class/dmi/id/chassis_serial ]; then
        serial=$(cat /sys/class/dmi/id/chassis_serial 2>/dev/null | tr -d '\0\n' | xargs)
        if [ -n "$serial" ] && [ "$serial" != "0" ] && [ "$serial" != "None" ]; then
            echo "ctrlx-$serial"
            return 0
        fi
    fi
    
    # Priority 4: Product UUID (VMs)
    if [ -r /sys/class/dmi/id/product_uuid ] && [ -s /sys/class/dmi/id/product_uuid ]; then
        serial=$(cat /sys/class/dmi/id/product_uuid 2>/dev/null | tr -d '\0\n' | xargs)
        if [ -n "$serial" ] && [ "$serial" != "0" ] && [ "$serial" != "None" ]; then
            echo "ctrlx-${serial:0:12}"
            return 0
        fi
    fi
    
    # Fallback: hostname-based
    local hostname=$(hostname 2>/dev/null || echo "device")
    echo "ctrlx-$hostname"
}

# Function to get current device ID from certificate
get_current_device_id() {
    if [ -f "$CERT_FILE" ]; then
        openssl x509 -in "$CERT_FILE" -noout -subject 2>/dev/null | \
            sed -n 's/.*CN\s*=\s*\([^,/]*\).*/\1/p' | sed 's/[[:space:]]*$//' || echo ""
    else
        echo ""
    fi
}

# NEU: Aktualisiert die inventory.json mit der echten Seriennummer
update_inventory() {
    local device_id="$1"
    local inventory_file="$TEDGE_DATA_DIR/device/inventory.json"
    
    if [ -f "$inventory_file" ]; then
        echo "Updating inventory.json with Device ID: $device_id" >&2
        # Use python3 for safe JSON manipulation (avoids sed injection with special chars in device_id)
        python3 -c "
import json, sys
with open('$inventory_file', 'r') as f:
    data = json.load(f)
data['serialNumber'] = sys.argv[1]
with open('$inventory_file', 'w') as f:
    json.dump(data, f, indent=2)
" "$device_id"
    else
        echo "WARNING: inventory.json not found at $inventory_file" >&2
    fi
}

# Function to create device certificate
create_certificate() {
    local device_id="$1"
    
    if [ -z "$device_id" ]; then
        echo "ERROR: Device ID is required" >&2
        return 1
    fi
    
    echo "Creating device certificate for: $device_id" >&2
    
    # Configure tedge to use ctrlX certificate store paths
    "$TEDGE_BIN" --config-dir "$TEDGE_CONFIG_DIR" config set device.cert_path "$CERT_FILE" 2>&1
    "$TEDGE_BIN" --config-dir "$TEDGE_CONFIG_DIR" config set device.key_path "$KEY_FILE" 2>&1

    # Remove old certificate if exists
    rm -f "$CERT_FILE" 2>/dev/null || true
    rm -f "$KEY_FILE" 2>/dev/null || true
    
    # Create new certificate
    if "$TEDGE_BIN" --config-dir "$TEDGE_CONFIG_DIR" cert create --device-id "$device_id" 2>&1; then
        echo "SUCCESS: Certificate created for $device_id" >&2
        
        # NEU: Inventory JSON aktualisieren
        update_inventory "$device_id"
        
        # Restart services
        if command -v snapctl >/dev/null 2>&1; then
            echo "Restarting thin-edge.io services..." >&2
            snapctl restart thin-edge-io.tedge-mapper-c8y 2>/dev/null || true
            snapctl restart thin-edge-io.tedge-agent 2>/dev/null || true
        fi
        
        return 0
    else
        echo "ERROR: Failed to create certificate" >&2
        return 1
    fi
}

# Main command handler
case "${1:-}" in
    get-serial)
        get_system_serial
        ;;
    
    get-current)
        current=$(get_current_device_id)
        if [ -n "$current" ]; then
            echo "$current"
        else
            echo "No certificate found"
            exit 1
        fi
        ;;
    
    create)
        device_id="${2:-}"
        if [ -z "$device_id" ]; then
            device_id=$(get_system_serial)
            echo "Auto-detected device ID: $device_id" >&2
        fi
        create_certificate "$device_id"
        ;;
    
    recreate)
        device_id="${2:-}"
        if [ -z "$device_id" ]; then
            device_id=$(get_current_device_id)
            if [ -z "$device_id" ]; then
                device_id=$(get_system_serial)
            fi
        fi
        echo "Recreating certificate for: $device_id" >&2
        create_certificate "$device_id"
        ;;
    
    set)
        device_id="$2"
        if [ -z "$device_id" ]; then
            echo "ERROR: Device ID required" >&2
            echo "Usage: $0 set <device-id>" >&2
            exit 1
        fi
        create_certificate "$device_id"
        ;;
    
    status)
        echo "=== Device ID Status ==="
        echo "System Serial: $(get_system_serial)"
        current=$(get_current_device_id)
        if [ -n "$current" ]; then
            echo "Current Device ID: $current"
            echo "Certificate: EXISTS"
        else
            echo "Current Device ID: NOT SET"
            echo "Certificate: MISSING"
        fi
        ;;
    
    *)
        echo "thin-edge.io Device ID Management"
        echo ""
        echo "Usage: $0 <command> [device-id]"
        echo ""
        echo "Commands:"
        echo "  get-serial           Get system serial number"
        echo "  get-current          Get current device ID from certificate"
        echo "  create [device-id]   Create certificate (auto-detect if not provided)"
        echo "  recreate [device-id] Recreate certificate"
        echo "  set <device-id>      Set new device ID and create certificate"
        echo "  status               Show current device ID status"
        exit 1
        ;;
esac