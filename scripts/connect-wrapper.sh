#!/bin/bash
# Snap-compatible wrapper for "tedge connect/disconnect/reconnect <cloud>"
#
# Problem: tedge connect writes the mosquitto bridge config but then tries to
# restart mosquitto via systemd – which is unavailable in strict snap confinement.
# The ServiceManagerUnavailable error is silently ignored by tedge, so mosquitto
# never reloads the bridge config and the connection health check always fails.
#
# This wrapper:
#   1. Runs "tedge connect/disconnect/reconnect <cloud>" to write the configs
#   2. Restarts mosquitto via snapctl so it picks up the new bridge config
#   3. Restarts the appropriate mapper via snapctl
#   4. Waits for the bridge to settle
#   5. Runs "tedge connect <cloud> --test" to verify the connection
#
# Usage: connect-wrapper.sh <connect|disconnect|reconnect> <cloud>
#   cloud: c8y | aws | az

set -uo pipefail

ACTION="${1:-connect}"
CLOUD="${2:-}"

if [[ -z "$CLOUD" ]] || [[ ! "$CLOUD" =~ ^(c8y|aws|az)$ ]]; then
    echo "Usage: $0 <connect|disconnect|reconnect> <c8y|aws|az>" >&2
    exit 1
fi

SNAP_NAME="${SNAP_INSTANCE_NAME:-thin-edge-io}"
TEDGE_BIN="${SNAP}/bin/tedge"
TEDGE_CONFIG_DIR="${TEDGE_CONFIG_DIR:-$SNAP_DATA/tedge}"

# Map cloud name to mapper service name
case "$CLOUD" in
    c8y) MAPPER_SVC="tedge-mapper-c8y" ;;
    aws) MAPPER_SVC="tedge-mapper-aws" ;;
    az)  MAPPER_SVC="tedge-mapper-az"  ;;
esac

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] [connect-wrapper] $*"; }

log "Running: tedge $ACTION $CLOUD"

# Step 1: Run tedge connect/disconnect/reconnect
# This writes the bridge config (and silently swallows the systemd error)
"$TEDGE_BIN" --config-dir "$TEDGE_CONFIG_DIR" "$ACTION" "$CLOUD" 2>&1 || true

# Step 1b: Fix hardcoded revision paths in bridge configs.
# tedge connect writes absolute paths like /var/snap/thin-edge-io/x42/...
# After a snap update the revision changes, making cert paths invalid.
# Replace all revision-specific paths with the stable "current" symlink.
MOSQUITTO_CONF_DIR="$SNAP_DATA/tedge/mosquitto-conf"
if [ -d "$MOSQUITTO_CONF_DIR" ]; then
    SNAP_BASE="/var/snap/thin-edge-io"
    for f in "$MOSQUITTO_CONF_DIR"/*.conf; do
        [ -f "$f" ] || continue
        # Replace /var/snap/thin-edge-io/x<digits>/ with /var/snap/thin-edge-io/current/
        if grep -qE "${SNAP_BASE}/x[0-9]+" "$f" 2>/dev/null; then
            sed -i -E "s|${SNAP_BASE}/x[0-9]+/|${SNAP_BASE}/current/|g" "$f"
            log "Fixed revision paths in: $(basename "$f")"
        fi
    done
fi

# For disconnect we only need to stop the mapper and restart mosquitto (to drop bridge)
if [[ "$ACTION" == "disconnect" ]]; then
    log "Stopping mapper ${MAPPER_SVC} via snapctl..."
    snapctl stop "${SNAP_NAME}.${MAPPER_SVC}" 2>/dev/null || true

    log "Restarting mosquitto to drop bridge config..."
    snapctl restart "${SNAP_NAME}.mosquitto" 2>/dev/null || true

    log "Disconnect complete."
    exit 0
fi

# Step 2: Restart mosquitto so it reloads the new bridge config
log "Restarting mosquitto to pick up new bridge config..."
snapctl restart "${SNAP_NAME}.mosquitto"

# Step 3: Wait for mosquitto to come back up
for i in $(seq 1 10); do
    sleep 1
    if cat /proc/*/comm 2>/dev/null | grep -q '^mosquitto$'; then
        log "mosquitto is up (after ${i}s)"
        break
    fi
    log "Waiting for mosquitto... (${i}/10)"
done

# Step 4: Restart the cloud mapper
log "Restarting ${MAPPER_SVC} via snapctl..."
snapctl restart "${SNAP_NAME}.${MAPPER_SVC}"

# Step 5: Give the bridge a moment to establish
log "Waiting 5s for bridge to establish..."
sleep 5

# Step 6: Verify the connection via MQTT health check
log "Verifying connection: tedge connect $CLOUD --test"
"$TEDGE_BIN" --config-dir "$TEDGE_CONFIG_DIR" connect "$CLOUD" --test 2>&1
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
    log "Connection to $CLOUD verified successfully."
else
    log "WARNING: Connection test returned exit code $EXIT_CODE"
    log "Bridge config is applied, but cloud connectivity could not be confirmed."
    log "Check: snap logs thin-edge-io.mosquitto"
fi

exit $EXIT_CODE
