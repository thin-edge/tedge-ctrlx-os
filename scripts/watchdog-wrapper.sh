#!/bin/bash
# Snap watchdog for thin-edge.io services
#
# Implements the same logic as the tedge-watchdog binary, adapted for the
# snap environment where systemd service-file discovery is unavailable:
#
#   1. Reads MQTT config from tedge config (host, port, topic root)
#   2. Publishes own health status as a retained MQTT message (like sd_notify --ready)
#   3. Sends periodic health-check requests to monitored services (same MQTT topics
#      as tedge-watchdog: <root>/device/main/service/<name>/cmd/health/check)
#   4. If a service does not respond with {"status":"up"} within the timeout,
#      restarts the service via `snapctl restart` (replaces systemd WATCHDOG=1 logic)
#
# Services monitored (matches tedge-watchdog binary's hardcoded list):
#   tedge-agent, tedge-mapper-c8y, tedge-mapper-aws, tedge-mapper-az,
#   c8y-firmware-plugin

set -uo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SNAP_NAME="${SNAP_INSTANCE_NAME:-thin-edge-io}"
TEDGE_CONFIG_DIR="${TEDGE_CONFIG_DIR:-$SNAP_DATA/tedge}"

# How often to run a health-check round (seconds)
CHECK_INTERVAL="${WATCHDOG_CHECK_INTERVAL:-30}"

# How long to wait for a service's MQTT health response (seconds)
MQTT_TIMEOUT="${WATCHDOG_MQTT_TIMEOUT:-10}"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] [tedge-watchdog] $*"; }

# ---------------------------------------------------------------------------
# Read MQTT settings from tedge config
# ---------------------------------------------------------------------------
tedge_cfg() {
    "$SNAP/bin/tedge" --config-dir "$TEDGE_CONFIG_DIR" config get "$1" 2>/dev/null || true
}

MQTT_HOST=$(tedge_cfg mqtt.client.host);  MQTT_HOST="${MQTT_HOST:-127.0.0.1}"
MQTT_PORT=$(tedge_cfg mqtt.client.port);  MQTT_PORT="${MQTT_PORT:-1883}"
TOPIC_ROOT=$(tedge_cfg mqtt.topic_root);  TOPIC_ROOT="${TOPIC_ROOT:-te}"

MQTT_PUB="$SNAP/usr/bin/mosquitto_pub"
MQTT_SUB="$SNAP/usr/bin/mosquitto_sub"

log "Starting snap watchdog"
log "  MQTT broker : ${MQTT_HOST}:${MQTT_PORT}"
log "  Topic root  : ${TOPIC_ROOT}"
log "  Interval    : ${CHECK_INTERVAL}s"
log "  MQTT timeout: ${MQTT_TIMEOUT}s"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Publish own health status as a retained MQTT message.
# Mirrors what tedge-watchdog does via notify_systemd(process::id(), "--ready").
publish_own_health() {
    "$MQTT_PUB" \
        -h "$MQTT_HOST" -p "$MQTT_PORT" \
        -r \
        -t "${TOPIC_ROOT}/device/main/service/tedge-watchdog/status/health" \
        -m "{\"status\":\"up\",\"pid\":$$,\"type\":\"snap-watchdog\"}" \
        2>/dev/null || true
}

# Check whether the mosquitto broker process is running (via /proc).
# If mosquitto is down, MQTT health checks would all fail — skip them.
mosquitto_running() {
    for f in /proc/[0-9]*/comm; do
        [[ "$(cat "$f" 2>/dev/null)" == "mosquitto" ]] && return 0
    done
    return 1
}

# Check MQTT health for a service.
# 1. Reads the retained status/health message (fast path).
# 2. If not "up", sends an explicit health-check request and waits.
# Returns 0 if the service reports {"status":"up"}, 1 otherwise.
check_mqtt_health() {
    local svc="$1"
    local health_topic="${TOPIC_ROOT}/device/main/service/${svc}/status/health"
    local check_topic="${TOPIC_ROOT}/device/main/service/${svc}/cmd/health/check"
    local msg

    # --- Fast path: retained message (3 s timeout) ---
    msg=$("$MQTT_SUB" -h "$MQTT_HOST" -p "$MQTT_PORT" \
        -t "$health_topic" -W 3 -C 1 2>/dev/null) || true

    if echo "${msg:-}" | grep -q '"status"[[:space:]]*:[[:space:]]*"up"'; then
        return 0
    fi

    # --- Slow path: explicit health-check request ---
    "$MQTT_PUB" -h "$MQTT_HOST" -p "$MQTT_PORT" \
        -t "$check_topic" -m '{"status":"check"}' 2>/dev/null || true

    msg=$("$MQTT_SUB" -h "$MQTT_HOST" -p "$MQTT_PORT" \
        -t "$health_topic" -W "$MQTT_TIMEOUT" -C 1 2>/dev/null) || true

    if echo "${msg:-}" | grep -q '"status"[[:space:]]*:[[:space:]]*"up"'; then
        return 0
    fi

    return 1
}

# Check whether a snap service is currently active (running) via snapctl.
service_is_active() {
    local svc="$1"
    local current
    # snapctl services output (within snap, qualified name):
    #   Service                         Startup  Current  Notes
    #   thin-edge-io.tedge-agent        enabled  active   -
    current=$(snapctl services "${SNAP_NAME}.${svc}" 2>/dev/null \
        | awk 'NR==2 {print $3}') || return 1
    [[ "$current" == "active" ]]
}

# Restart an unhealthy service via snapctl.
restart_service() {
    local svc="$1"
    log "${svc}: restarting via snapctl..."
    snapctl restart "${SNAP_NAME}.${svc}" 2>&1 \
        && log "${svc}: restart command sent" \
        || log "${svc}: WARNING – snapctl restart failed"
}

# ---------------------------------------------------------------------------
# Services to monitor  (same list as tedge-watchdog binary)
# ---------------------------------------------------------------------------
WATCH_SERVICES=(
    "tedge-agent"
    "tedge-mapper-c8y"
    "tedge-mapper-aws"
    "tedge-mapper-az"
    "c8y-firmware-plugin"
)

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
publish_own_health

while true; do

    if ! mosquitto_running; then
        log "mosquitto is not running – skipping MQTT health checks this round"
        sleep "$CHECK_INTERVAL"
        continue
    fi

    for svc in "${WATCH_SERVICES[@]}"; do

        # Only monitor services that are currently active in snapd
        if ! service_is_active "$svc"; then
            continue
        fi

        if check_mqtt_health "$svc"; then
            log "${svc}: healthy"
        else
            log "${svc}: unhealthy (no \"up\" MQTT response) – restarting"
            restart_service "$svc"
        fi

    done

    publish_own_health
    sleep "$CHECK_INTERVAL"

done
