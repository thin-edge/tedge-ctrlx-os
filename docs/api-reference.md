# REST API Reference

The web server exposes a REST API at `https://<device-ip>/thin-edge-io/api/`.

All endpoints require a valid **ctrlX Bearer Token** (passed automatically by the ctrlX reverse proxy when accessed via the sidebar). For direct access, include the token in the `Authorization: Bearer <token>` header.

---

## Access Scopes

| Scope | Permissions |
|-------|-------------|
| `thin-edge-io.rwx` | Full access (read, write, execute) |
| `thin-edge-io.rw` | Read and write (no connect/disconnect) |
| `thin-edge-io.r` | Read-only |

---

## Status & Build

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/status` | r | Service status for all components |
| GET | `/build-info` | r | Snap version, build number, architecture |
| GET | `/me` | r | Current authenticated user and role |

---

## Configuration

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/config` | r | Current tedge configuration (all values) |
| POST | `/config/c8y` | rw | Save Cumulocity IoT configuration |
| POST | `/config/aws` | rw | Save AWS IoT configuration |
| POST | `/config/az` | rw | Save Azure IoT Hub configuration |
| POST | `/config/device` | rw | Save device configuration (name, ID) |
| POST | `/set-mqtt-port` | rw | Set MQTT port (`8883` = Core MQTT, `9883` = MQTT Service) |
| GET | `/tedge-config-list` | r | Full `tedge config list` output |

---

## Device Identity & Certificate

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/device-id` | r | Get current device ID |
| POST | `/device-id` | rw | Set device ID |
| POST | `/device-id/recreate` | rwx | Recreate device certificate |
| POST | `/device-id/create-auto` | rwx | Auto-create certificate from current device ID |
| GET | `/device-id/cert-info` | r | Show certificate details (subject, issuer, validity, fingerprint) |
| POST | `/cert/upload/c8y` | rwx | Upload certificate to Cumulocity tenant |

---

## Cloud Connection

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| POST | `/connect/{cloud}` | rwx | Connect to cloud — `cloud` = `c8y`, `aws`, or `az` |
| POST | `/disconnect/{cloud}` | rwx | Disconnect from cloud |
| POST | `/reconnect/{cloud}` | rwx | Reconnect to cloud (disconnect + connect) |
| POST | `/test-message` | rwx | Publish a test MQTT message |

---

## Logs

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/logs?service=<name>` | r | Fetch recent log lines for a service |
| GET | `/log-level?service=<name>` | r | Get configured log level for a service |
| POST | `/log-level` | rw | Set log level (`error`/`warn`/`info`/`debug`/`trace`); restarts service to apply |

**Service names** (for `?service=` parameter):

| Name | Service |
|------|---------|
| `tedge-agent` | thin-edge agent |
| `tedge-mapper-c8y` | Cumulocity mapper |
| `tedge-mapper-aws` | AWS mapper |
| `tedge-mapper-az` | Azure mapper |
| `tedge-bridge` | MQTT bridge |
| `tedge-datalayer-bridge` | ctrlX Data Layer bridge |
| `log-upload` | Log upload manager |
| `mosquitto` | Local MQTT broker |
| `webserver` | Configuration UI server |

---

## Service Control

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| POST | `/restart` | rwx | Restart all snap services |
| POST | `/restart-service` | rwx | Restart a single named service |

---

## Snap Configuration Files

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/snapconfig?file=<name>` | r | Read a snap configuration file |
| POST | `/snapconfig` | rw | Write a snap configuration file |

**Available file names** (for `?file=` parameter):

| Name | Path |
|------|------|
| `datalayer-mappings.json` | `$SNAP_DATA/datalayer-mappings.json` |
| `inventory.json` | `$SNAP_DATA/tedge/device/inventory.json` |
| `mosquitto.conf` | `$SNAP_DATA/mosquitto/mosquitto.conf` |
| `tedge.toml` | `$SNAP_DATA/tedge/tedge.toml` |
| `tedge-log-plugin.toml` | `$SNAP_DATA/tedge/plugins/tedge-log-plugin.toml` |
| `tedge-configuration-plugin.toml` | `$SNAP_DATA/tedge/plugins/tedge-configuration-plugin.toml` |

---

## ctrlX Data Layer Bridge

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/datalayer/status` | r | Bridge service status and connection state |
| GET | `/datalayer/config` | r | Bridge configuration (URL, credentials, poll interval) |
| POST | `/datalayer/config` | rw | Save bridge configuration |
| GET | `/datalayer/raw-config` | r | Raw bridge config file content |
| GET | `/datalayer/browse?path=<path>` | r | List child nodes of a Data Layer path |
| GET | `/datalayer/node?path=<path>` | r | Read the current value of a single Data Layer node |
| GET | `/datalayer/mappings` | r | List all configured mappings |
| POST | `/datalayer/mappings` | rw | Replace all mappings (full overwrite) |
| POST | `/datalayer/mappings/add` | rw | Add a single mapping |
| PUT | `/datalayer/mappings/{id}` | rw | Update a mapping by UUID |
| DELETE | `/datalayer/mappings/{id}` | rw | Delete a mapping by UUID |

### Mapping Object Schema

```json
{
  "id": "uuid-string",
  "path": "framework/metrics/system/memfree-mb",
  "topic": "c8y/mqtt/out/memfree-mb",
  "direction": "dl_to_tedge",
  "transform": "measurement",
  "field_name": "memfree-mb",
  "unit": "MB",
  "enabled": true
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `direction` | `dl_to_tedge` / `tedge_to_dl` | Data flow direction |
| `transform` | `raw` / `measurement` / `event` / `alarm` | Payload transformation type |
| `unit` | string (optional) | Unit label included in the outgoing payload |
| `enabled` | boolean | Whether the mapping is active |

---

## Licensing

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/licenses` | r | List all ctrlX OS license capabilities (via Unix socket) |
| GET | `/license-status` | r | Returns `{"licensed": true/false}` |

---

## Response Format

All endpoints return JSON. Successful mutations return:

```json
{ "success": true }
```

Errors return an appropriate HTTP status code and:

```json
{ "error": "description of the error" }
```
