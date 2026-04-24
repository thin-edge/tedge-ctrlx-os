# thin-edge.io for ctrlX AUTOMATION (WORK IN PROGRESS)

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/thin-edge/tedge-ctrlx-os)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)
[![Architecture](https://img.shields.io/badge/arch-amd64%20%7C%20arm64-lightgrey)](https://github.com/thin-edge/tedge-ctrlx-os)

## Overview

This is a **ctrlX AUTOMATION** snap app that packages [thin-edge.io](https://thin-edge.io) — the open-source, cloud-agnostic IoT edge framework. It enables ctrlX CORE and ctrlX COREvirtual devices to securely connect to major IoT cloud platforms and provides a built-in web UI for configuration and monitoring.

## Features

- **Multi-Cloud Connectivity** — Cumulocity IoT, AWS IoT Core, Azure IoT Hub
- **Web-Based Configuration UI** — Browser-accessible dashboard served directly from the device
- **Device Management** — Remote monitoring, configuration management
- **Log Management** — Centralized log collection with live viewer in the web UI
- **MQTT Bridge** — Efficient local and cloud messaging via Mosquitto
- **ctrlX Data Layer Bridge** — Bridge service reads ctrlX Data Layer nodes and publishes them to MQTT/cloud
- **ctrlX License Enforcement** — Acquires and periodically re-checks ctrlX OS license via Unix socket; shows warning banner when license is missing
- **Health Monitoring** — Integrated watchdog service with automatic service recovery
- **Strict Snap Confinement** — Process isolation, no root privileges required

## Repository Structure

```
tedge-ctrlx-os/
├── snap/
│   ├── snapcraft.yaml          # Snap build definition
│   └── hooks/                  # install, configure, post-refresh, remove hooks
├── web-server-rust/            # Actix-web backend (Rust)
│   └── src/main.rs             # REST API server + license enforcement loop
├── bridge-service-rust/        # ctrlX Data Layer bridge (Rust)
├── web/www/                    # Frontend source (HTML, JS, CSS, styles.less)
├── scripts/                    # Build and runtime helper scripts
├── configs/                    # App metadata (caddyfile, package-manifest.json)
├── package-assets/             # ctrlX Store assets (icons, i18n, proxy config)
└── docs/                       # Documentation
```

## Components

### Core Services (thin-edge.io v1.7.1)
| Service | Description |
|---------|-------------|
| `tedge` | CLI tool for configuration and management |
| `tedge-agent` | Main agent service for device operations |
| `tedge-mapper-c8y` | Protocol mapper for Cumulocity IoT |
| `tedge-mapper-aws` | Protocol mapper for AWS IoT Core |
| `tedge-mapper-az` | Protocol mapper for Azure IoT Hub |
| `tedge-watchdog` | Health monitoring and automatic recovery |
| `mosquitto` | Local MQTT broker |

### Plugins
| Plugin | Description |
|--------|-------------|
| `tedge-file-config-plugin` | Configuration file management |
| `tedge-snap-plugin` | Lists installed snaps in Cumulocity software inventory (read-only, install/remove not supported) |

### Custom Services
| Service | Description |
|---------|-------------|
| `webserver` | Rust/Actix-web configuration UI (accessible via ctrlX sidebar); acquires ctrlX license on startup, shows warning banner if missing |
| `tedge-datalayer-bridge` | ctrlX Data Layer ↔ thin-edge.io bridge; polls Data Layer nodes and publishes measurements/events/alarms to MQTT |
| `tedge-log-upload-manager` | Coordinates log file uploads to cloud platforms (replaces standard `tedge-file-log-plugin`) |

## Web UI

After installation, the configuration UI is accessible via the ctrlX CORE sidebar under **thin-edge.io**, or directly at:

```
https://<device-ip>/thin-edge-io/
```

### UI Sections

Each section is a collapsible card in the sidebar UI. All sections are always visible simultaneously (no navigation required).

---

#### CONNECTION STATUS

Three-column live status dashboard, auto-refreshing every 30 seconds (also on demand via **Refresh Status** button):

| Column | Items |
|--------|-------|
| **Services** | MQTT Broker, Tedge Agent, Datalayer Bridge, Watchdog, Log Manager — each label is clickable to restart the service |
| **Mappers** | Cumulocity IoT, AWS IoT, Azure IoT — shows whether the mapper process is running |
| **Cloud Connections** | Cumulocity IoT, AWS IoT, Azure IoT — shows MQTT bridge state (`$SYS/broker/connection/*/state`) |

Status indicators:
- 🟢 **Running** — process active
- 🔴 **Stopped** — process not running  
- ⚫ **Inactive** — disabled/not configured
- ⚪ **Unknown** — not yet checked

---

#### CLOUD CONFIGURATION

Three tabs — **Cumulocity IoT**, **AWS IoT**, **Azure IoT**:

| Tab | Fields |
|-----|--------|
| **Cumulocity IoT** | C8Y URL (e.g. `https://your-tenant.cumulocity.com`), Tenant ID, Enable Cumulocity Mapper toggle |
| **AWS IoT** | AWS IoT Endpoint URL (e.g. `xxxxxxxxxx.iot.us-east-1.amazonaws.com`), Enable AWS Mapper toggle |
| **Azure IoT** | Azure IoT Hub URL (e.g. `your-hub.azure-devices.net`), Enable Azure Mapper toggle |

Each tab has a **Save Configuration** button that writes values via `POST /api/config/{cloud}`. The **Enable Mapper** toggle immediately starts (`snapctl start thin-edge-io.tedge-mapper-<cloud>`) or stops (`snapctl stop`) the corresponding mapper service — no manual restart required.

---

#### DEVICE CONFIGURATION & CERTIFICATE

Left panel — device identity:

| Element | Description |
|---------|-------------|
| **Device ID** | Read-only; the unique device identifier derived from the serial number |
| **Device Name** | Editable CN used when creating / renewing the X.509 certificate |
| **Certificate Status** | Indicates whether a valid device certificate exists |
| **Upload Status** | Shows whether the certificate has been uploaded to Cumulocity (persisted in `tedge-web-config.json`) |
| **Save** | Saves device name changes |
| **Renew Certificate** | Recreates the certificate with the current Device Name as CN |
| **Upload Certificate** | Expands a credential form (Cumulocity username + password) and uploads the certificate via `POST /api/cert/upload/c8y` |

Right panel (shown when a certificate exists): **Certificate Details** — displays subject, issuer, validity dates, and fingerprint.

---

#### CONNECT DEVICE

Three tabs — **Cumulocity IoT**, **AWS IoT**, **Azure IoT** — each with:

- **Connect** — runs `tedge connect <cloud>`
- **Reconnect** — runs `tedge reconnect <cloud>`
- **Disconnect** — runs `tedge disconnect <cloud>`
- **Setup ↗** — opens the thin-edge.io documentation for the respective cloud

For **Cumulocity IoT** only, an additional **MQTT Port** toggle selects between:
- `Core MQTT (8883)` — standard TLS MQTT
- `MQTT Service (9883)` — Cumulocity MQTT Service (connection only; SmartREST operations not supported)

**Test Messages** section (bottom, shared across all tabs):

| Button | MQTT Topic |
|--------|-----------|
| Test Measurement | publishes a sample measurement payload |
| Test Event | publishes a sample event payload |
| Test Alarm | publishes a sample alarm payload |

Output of connect/disconnect/test operations appears in the **Logs & Diagnostics** viewer.

---

#### LOGS & DIAGNOSTICS

Live log viewer with controls:

| Control | Options |
|---------|---------|
| **Service** | `tedge-agent`, `tedge-mapper-c8y`, `tedge-mapper-aws`, `tedge-mapper-az`, `tedge-bridge`, `log-upload`, `mosquitto`, `webserver` |
| **Log Level** | `error`, `warn`, `info` (default), `debug`, `trace` |
| **Apply Level** | Writes the selected level via `RUST_LOG` to `$SNAP_DATA/log-levels/<service>` and restarts the service |
| **Load Logs** | Fetches recent log lines via `GET /api/logs?service=<name>` |
| **Copy** | Copies viewer content to clipboard |

The viewer is a 320 px high monospace scrollable area.

---

#### TEDGE CONFIGURATION

Read-only view of the complete `tedge config list` output (equivalent to running `thin-edge-io.tedge config list` on the device):

- **Load** — fetches via `GET /api/tedge-config-list`
- **Copy** — copies all lines to clipboard

The viewer is a 400 px high monospace scrollable area.

---

#### SNAP CONFIGURATION FILES

Direct file editor for the snap's configuration files stored in `$SNAP_DATA`. Useful for advanced manual edits without SSH access.

**File selector:**

| File | Location | Description |
|------|----------|-------------|
| `datalayer-mappings.json` | `$SNAP_DATA/datalayer-mappings.json` | ctrlX Data Layer ↔ MQTT bridge mapping definitions |
| `inventory.json` | `$SNAP_DATA/tedge/device/inventory.json` | Device inventory reported to cloud (hardware, snap list) |
| `mosquitto.conf` | `$SNAP_DATA/mosquitto/mosquitto.conf` | Mosquitto MQTT broker configuration (ports, TLS, bridge) |
| `tedge.toml` | `$SNAP_DATA/tedge/tedge.toml` | Main thin-edge.io configuration (URLs, paths, plugin settings) |
| `tedge-log-plugin.toml` | `$SNAP_DATA/tedge/plugins/tedge-log-plugin.toml` | Log file paths exposed for remote log upload requests |
| `tedge-configuration-plugin.toml` | `$SNAP_DATA/tedge/plugins/tedge-configuration-plugin.toml` | Config files exposed for remote configuration management |

The file's full path is shown below the selector as a hint. The editor textarea is resizable vertically.

- **Load** — reads the file via `GET /api/snapconfig?file=<name>`
- **Save** — writes back via `POST /api/snapconfig` (requires `thin-edge-io.rw` scope)
- **Copy** — copies editor content to clipboard

---

#### CTRLX DATA POINTS (DATALAYER)

Manages the optional ctrlX Data Layer ↔ MQTT bridge service (`tedge-datalayer-bridge`).

**Status row:** Shows the bridge service dot and connection state; **Refresh** button re-polls `GET /api/datalayer/status`.

**Connection Settings** (collapsible `<details>`):

| Field | Description |
|-------|-------------|
| Base URL | ctrlX Data Layer base URL (default `https://localhost`) |
| Username | Data Layer username (default `boschrexroth`) |
| Password | Data Layer password |
| Poll interval (ms) | How often the bridge polls Data Layer nodes (default `5000`) |
| Static Token | Optional bearer token (overrides username/password) |
| Enabled toggle | Enable/disable the bridge |
| Accept invalid TLS certs | Skip TLS verification (useful for self-signed certificiates on local device) |
| **Save Connection** | Saves via `POST /api/datalayer/config` |

**Node Browser** (collapsible `<details>`):
- Path input + **Browse** button — lists child nodes of the given Data Layer path via `GET /api/datalayer/browse`
- **↑ Up** — navigates to the parent path
- Clicking a node reads its current value; a **+** icon in the node list opens the Add Mapping form pre-filled with that path

**Mappings Form** (shown when adding or editing):

| Field | Description |
|-------|-------------|
| Datalayer Path | Full path to the Data Layer node (e.g. `/framework/metrics/system/memfree-mb`) |
| Direction | `Datalayer ➔ tedge` (read) or `tedge ➔ Datalayer` (write) |
| tedge MQTT Topic | Auto-suggested based on transform type; editable (e.g. `c8y/mqtt/out/myTopic`) |
| Transform | `raw`, `measurement`, `event`, or `alarm` |
| Field name | JSON field name in the payload (auto-derived from path if left empty) |
| Unit | Optional unit string (e.g. `°C`, `MB`, `%`) — published as top-level `"unit"` field |

**Measurement Payload Format** (when using Cumulocity MQTT Service, port 9883):

```json
{
  "memfree-mb": 6892.03,
  "unit": "MB",
  "time": "2026-04-21T09:30:00.123Z",
  "externalId": "ctrlx-984c906200b9425eb91c96474c64c938"
}
```

- `"time"`: UTC timestamp, added automatically on each poll cycle
- `"unit"`: included only if configured in the mapping
- `"externalId"`: automatically injected for topics starting with `c8y/mqtt/out/`; equals the device certificate CN (= the external ID registered in Cumulocity)
- Multiple mappings can use the **same** MQTT topic — each is identified by its UUID and processed independently

**Mappings Table** (bottom): lists all saved mappings with columns Path, Topic, Direction (arrow icon), Type · Field, Active toggle, and an edit button. Changes to individual rows are saved via `PUT /api/datalayer/mappings/{id}` or `DELETE /api/datalayer/mappings/{id}`.

---

#### CTRLX LICENSING

Shows the ctrlX OS licenses currently active on the device. Loaded automatically when the section is opened.

| Element | Description |
|---------|-------------|
| License table | Lists all capabilities returned by the ctrlX License Manager API (`/license-manager/api/v1/capabilities`) — name, permanent flag, expiry date, count |
| **Refresh** button | Re-fetches `GET /api/licenses` |
| **Manage Licenses** button | Opens `/license-manager` (ctrlX License Manager UI) in a new tab |

If no valid license is held, a **red warning banner** is shown at the top of the page with a link to the Licensing section and the Bosch Rexroth Licensing Center.

---

#### SYSTEM INFORMATION

Displays read-only device and build metadata:

| Field | Source |
|-------|--------|
| **Version** | Snap version (from `GET /api/build-info`) |
| **Build** | Build number / Git commit from `configs/build-info.txt` |
| **Architecture** | CPU architecture (`amd64` or `arm64`) |

**Refresh** button reloads all status data (same as the button in Connection Status).

### Web API (REST)

The web server exposes the following API endpoints under `/api/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Service status for all components |
| GET | `/config` | Current tedge configuration |
| POST | `/config/c8y` | Save Cumulocity configuration |
| POST | `/config/aws` | Save AWS configuration |
| POST | `/config/az` | Save Azure configuration |
| POST | `/config/device` | Save device configuration |
| GET | `/device-id` | Get current device ID |
| POST | `/device-id` | Set device ID |
| POST | `/device-id/recreate` | Recreate device certificate |
| POST | `/device-id/create-auto` | Auto-create certificate from device ID |
| GET | `/device-id/cert-info` | Show certificate details |
| POST | `/connect/{cloud}` | Connect to cloud (c8y/aws/az) |
| POST | `/disconnect/{cloud}` | Disconnect from cloud |
| POST | `/reconnect/{cloud}` | Reconnect to cloud |
| POST | `/cert/upload/c8y` | Upload certificate to Cumulocity |
| POST | `/test-message` | Publish test MQTT message |
| GET | `/logs` | Fetch service logs |
| GET | `/tedge-config-list` | Full `tedge config list` output |
| GET | `/build-info` | Build and version information |
| GET | `/log-level` | Get configured log level per service |
| POST | `/log-level` | Set log level for a service (`error`/`warn`/`info`/`debug`/`trace`); restarts service to apply |
| POST | `/restart` | Restart all services |
| POST | `/restart-service` | Restart a single named service |
| GET | `/me` | Current authenticated user and role |
| POST | `/set-mqtt-port` | Set MQTT port (8883 = MQTT Core, 9883 = MQTT Service) |
| GET | `/snapconfig` | Read raw `tedge.toml` snap config file |
| POST | `/snapconfig` | Write raw `tedge.toml` snap config file |
| GET | `/datalayer/status` | Data Layer bridge status |
| GET | `/datalayer/config` | Data Layer bridge configuration |
| POST | `/datalayer/config` | Save Data Layer bridge configuration |
| GET | `/datalayer/raw-config` | Raw Data Layer config file content |
| GET | `/datalayer/mappings` | List MQTT ↔ Data Layer mappings |
| POST | `/datalayer/mappings` | Save all mappings |
| POST | `/datalayer/mappings/add` | Add a single mapping |
| PUT | `/datalayer/mappings/{id}` | Update a mapping by ID |
| DELETE | `/datalayer/mappings/{id}` | Delete a mapping by ID |
| GET | `/datalayer/browse` | Browse Data Layer nodes |
| GET | `/datalayer/node` | Read a single Data Layer node value |
| GET | `/licenses` | List all ctrlX OS license capabilities (via Unix socket) |
| GET | `/license-status` | Returns `{"licensed": true/false}` — whether a valid license is currently held |

## Installation

### Prerequisites

- ctrlX CORE or ctrlX COREvirtual with **ctrlX OS 1.20 or higher**
- Network connectivity to your cloud platform

### Install Steps

1. Build the snap (see [Building from Source](#building-from-source)) or download a release:
   - `ctrlx-cumulocity-thin-edge-io_2.0.0_amd64.snap` — ctrlX COREvirtual
   - `ctrlx-cumulocity-thin-edge-io_2.0.0_arm64.snap` — ctrlX CORE hardware

2. Open the ctrlX CORE web interface

3. Navigate to **Settings → Apps**

3a. If necessary set **Allow installation from unknown source.**

4. Switch to **Service Mode**

5. Click **Install from file** and select the snap file

6. Switch back to **Operation Mode**

## Configuration

### Via Web UI (Recommended)

Open `https://<device-ip>/thin-edge-io/` and configure cloud connection, device ID, and certificates directly in the browser.

### Via CLI (SSH / Terminal)
SSH is only woking if your user is Member of the `ssh-users` group. You can add your user to this group via the ctrlX CORE web interface under **Settings → Users & Groups** and SSH is activated in **Settings → Apps → SSH**.
```bash
# Configure Cumulocity IoT
thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com

# Or configure for AWS IoT
thin-edge-io.tedge config set aws.url your-endpoint.iot.region.amazonaws.com

# Or configure for Azure IoT Hub
thin-edge-io.tedge config set az.url your-hub.azure-devices.net
```

### Certificate Management

```bash
# Create device certificate
thin-edge-io.tedge cert create --device-id your-device-id

# Show certificate details
thin-edge-io.tedge cert show

# Connect to Cumulocity (registers device and uploads cert)
thin-edge-io.tedge connect c8y
```

### Snap Configuration

```bash
# Show status of all services
snap services ctrlx-cumulocity-thin-edge-io

Service                                                  Startup  Current   Notes
ctrlx-cumulocity-thin-edge-io.mosquitto                 enabled  active    -
ctrlx-cumulocity-thin-edge-io.setup-directories         enabled  inactive  -
ctrlx-cumulocity-thin-edge-io.tedge-agent               enabled  active    -
ctrlx-cumulocity-thin-edge-io.tedge-datalayer-bridge    enabled  active    -
ctrlx-cumulocity-thin-edge-io.tedge-log-upload-manager  enabled  active    -
ctrlx-cumulocity-thin-edge-io.tedge-mapper-aws          enabled  inactive  -
ctrlx-cumulocity-thin-edge-io.tedge-mapper-az           enabled  inactive  -
ctrlx-cumulocity-thin-edge-io.tedge-mapper-c8y          enabled  active    -
ctrlx-cumulocity-thin-edge-io.tedge-watchdog            enabled  active    -
ctrlx-cumulocity-thin-edge-io.webserver                 enabled  active    -

# Restart all services
snap restart ctrlx-cumulocity-thin-edge-io

# Restart a single service
snap restart ctrlx-cumulocity-thin-edge-io.tedge-agent

# View live logs of a service
snap logs ctrlx-cumulocity-thin-edge-io.webserver -f
snap logs ctrlx-cumulocity-thin-edge-io.tedge-agent -f

# Show snap version and revision
snap info ctrlx-cumulocity-thin-edge-io

# Disable / enable snap
snap disable ctrlx-cumulocity-thin-edge-io
snap enable ctrlx-cumulocity-thin-edge-io

# View snap configuration (tedge.toml)
snap get ctrlx-cumulocity-thin-edge-io -d

# Remove snap (configuration remains in $SNAP_DATA)
snap remove ctrlx-cumulocity-thin-edge-io

# Completely remove snap including all data
snap remove --purge ctrlx-cumulocity-thin-edge-io

# Revert to previous snap revision after update
snap revert ctrlx-cumulocity-thin-edge-io
```

### Snap CLI Commands

Das Snap stellt folgende CLI-Befehle bereit (erreichbar per SSH oder Terminal):

#### `ctrlx-cumulocity-thin-edge-io.manage-device-id` — Device-ID Verwaltung

```bash
ctrlx-cumulocity-thin-edge-io.manage-device-id <command> [device-id]
```

| Command | Beschreibung |
|---------|-------------|
| `get-serial` | Gibt die Systemseriennummer aus (DMI/UUID-basiert, für neue Geräte ohne Zertifikat) |
| `get-current` | Gibt die aktuelle Device-ID aus dem vorhandenen Gerätezertifikat aus |
| `status` | Zeigt Systemseriennummer und aktuelle Device-ID (aus Zertifikat) an |
| `create [device-id]` | Erstellt ein neues Zertifikat — ohne Argument wird `get-serial` verwendet |
| `recreate [device-id]` | Erstellt das Zertifikat neu (z.B. nach Gerätewechsel) |
| `set <device-id>` | Setzt eine explizite Device-ID und erstellt das Zertifikat |

**Beispiele:**
```bash
# Status anzeigen
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id status

# Zertifikat mit automatisch erkannter Seriennummer erstellen
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id create

# Explizite Device-ID setzen
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id set my-device-001
```

#### `ctrlx-cumulocity-thin-edge-io.tedge-connect` — Cloud-Verbindung

```bash
# Mit Cumulocity IoT verbinden (registriert Gerät, lädt Zertifikat hoch)
ctrlx-cumulocity-thin-edge-io.tedge-connect c8y

# Verbindung trennen
ctrlx-cumulocity-thin-edge-io.tedge-connect c8y --disconnect
```

#### `ctrlx-cumulocity-thin-edge-io.build-info` — Build-Informationen

```bash
# Zeigt Versionsinformationen des installierten Snaps
ctrlx-cumulocity-thin-edge-io.build-info
```

**Important Paths:**

| Path | Contents |
|------|----------|
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/` | Service logs |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/package-certificates/thin-edge-io/tedge/` | Device certificate & private key (ctrlX Certificate Store) |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/datalayer-credentials.json` | ctrlX Data Layer credentials (survives snap updates) |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/package-run/thin-edge-io/` | Runtime status (ctrlX) |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/datalayer-mappings.json` | Data Layer ↔ MQTT bridge mappings |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/log-levels/` | Log level files per service |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/tedge/` | tedge configuration (`tedge.toml`) |
| `/tmp/ctrlx-cumulocity-thin-edge-io.license` | Held ctrlX license ID (cleared on reboot / snap remove) |

## Building from Source

### Automated Build (Recommended)

```bash
git clone https://github.com/thin-edge/tedge-ctrlx-os.git
cd tedge-ctrlx-os
./setup-and-build-all.sh --fix
```

This script installs all dependencies (Rust toolchain, Snapcraft) and builds snaps for both architectures.

> **Note**: The first build takes 15–30 minutes as it compiles all Rust dependencies from source.

### Manual Build

#### Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.94

# Snapcraft
sudo snap install snapcraft --classic

# System dependencies
sudo apt-get install pkg-config libssl-dev libsqlite3-dev
```

#### Build

```bash
# ctrlX COREvirtual (amd64)
./build-snap-amd64.sh

# ctrlX CORE hardware (arm64)
./build-snap-arm64.sh  (requires arm64 build environment or cross-compilation)
```

### Frontend Development

The frontend source lives in `web/www/` (includes `styles.less`). After editing, sync to the Rust server:

```bash
cp web/www/app.js web/www/index.html web/www/styles.css web-server-rust/www/
```

> **Warning**: A CSS formatter may replace `var(--brand-primary)` with hardcoded hex values. After formatter runs, verify with:
> ```bash
> grep -n "86efac\|4ade80\|FDC000" web-server-rust/www/styles.css
> ```

## Troubleshooting

### Connection Issues

```bash
# Test cloud connectivity
thin-edge-io.tedge connect c8y --test

# Show current configuration
thin-edge-io.tedge config list

# Check certificate
thin-edge-io.tedge cert show
```

### Service Not Starting

```bash
# View logs (follow)
snap logs thin-edge-io.<service> -f
snap logs thin-edge-io.tedge-agent -f
snap logs thin-edge-io.webserver -f

# Restart all services
snap restart thin-edge-io
```

### Directory / Permission Issues

The snap uses `$SNAP_DATA` (per-revision path) for all runtime data. After a snap update, paths are re-configured automatically via the `post-refresh` hook:

```
$SNAP_DATA/tedge/run/        → tedge run.path
$SNAP_DATA/tedge/tmp/        → tedge tmp.path
$SNAP_DATA/tedge/log-plugins/
$SNAP_DATA/tedge/sm-plugins/
    apt  → $SNAP/bin/tedge-apt-plugin   (Debian packages in Cumulocity)
    snap → $SNAP/scripts/sm-plugins/tedge-snap-plugin  (Snaps in Cumulocity)
$SNAP_DATA/tedge/.agent/
```

## Network Requirements

| Direction | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| Outbound | HTTPS | 443 | Cloud platform REST API |
| Outbound | MQTT/TLS | 8883 | Secure cloud MQTT (recommended) |
| Outbound | MQTT/TLS | 9883 | Cumulocity MQTT Service (connection only; SmartREST operations not supported) |
| Local | HTTP | 8888 | Web UI (proxied via ctrlX Caddy) |
| Local | MQTT | 1883 | Local broker (internal) |

## Security

- All cloud connections use **TLS 1.2+**
- **Certificate-based** device authentication (X.509)
- **Strict snap confinement** — process isolation, no root required
- **ctrlX Bearer Token** authentication for web UI access
- Role-based scopes: `thin-edge-io.rwx`, `thin-edge-io.rw`, `thin-edge-io.r`

## Resource Usage

| Resource | Typical |
|----------|---------|
| RAM | ~50–100 MB (depending on active mappers) |
| CPU | <5% idle, <20% during active data transfer |
| Storage | ~100 MB for app + logs/cache |

## License

This app packages **thin-edge.io**, licensed under the **Apache License 2.0**.

All included open-source components are documented in [`package-assets/fossinfo.json`](package-assets/fossinfo.json) and [`package-assets/foss-offer.txt`](package-assets/foss-offer.txt).

## Links

- **thin-edge.io Docs**: https://thin-edge.github.io/thin-edge.io/
- **thin-edge.io GitHub**: https://github.com/thin-edge/thin-edge.io
- **This App Repository**: https://github.com/thin-edge/tedge-ctrlx-os
- **Discord Community**: https://discord.com/invite/sVX3B8nj5d

## Roadmap

- ✅ ctrlX License Management integration (acquire/release/periodic re-check + warning banner)
- Enhanced ctrlX Diagnostics/Logbook integration

## Contributing

Contributions to thin-edge.io are welcome! Visit the GitHub repository for contribution guidelines.

## About thin-edge.io

thin-edge.io is the first open-source and cloud-agnostic edge framework designed for resource-constrained IoT devices. It provides re-usable and modular components for IoT device enablement across different cloud platforms and industrial IoT scenarios.

## Build & Development

The project uses a modular build process:

- **setup-and-build-all.sh**: Orchestrates the complete build
- **scripts/**: Contains runtime wrappers and helper scripts
    - `setup-config.sh` — Interactive configuration helper script
    - `setup-directories.sh` — Directory initialization at snap startup
    - `mosquitto-wrapper.sh` — Mosquitto MQTT broker wrapper
    - `connect-wrapper.sh` — Snap-aware tedge connect/disconnect/reconnect (sets `mqtt.bridge.built_in=true`, reads cert paths)
    - `watchdog-wrapper.sh` — Health monitoring wrapper
    - `webserver-wrapper.sh` — Webserver starter (reads log level from `$SNAP_DATA/log-levels/webserver`)
    - `tedge-service-wrapper.sh` — General service wrapper (reads log level from `$SNAP_DATA/log-levels/<service>`, sets `RUST_LOG`)
    - `manage-device-id.sh` — Device ID management (serial number, certificate creation)
    - `update-inventory.sh` — Inventory update script
    - `show-build-info.sh` — Build info display
    - `check-format.sh` — Code format check
    - `clean.sh` — Remove build artifacts

**Tip:** For modifications to build or tests, please edit the respective scripts in `scripts/`.

### Run Build

    ./setup-and-build-all.sh

### Clean

    ./scripts/clean.sh


## thin-edge.io Configuration Interface

The snap auto-configures all required tedge settings on first install and after every update. Below is the complete reference of all configuration blocks managed by this snap.

### Auto-Configured Settings (tedge.toml)

These are set automatically by the `install` hook and kept current by the `post-refresh` hook.

#### `device` block

| Key | Value | Description |
|-----|-------|-------------|
| `device.type` | `ctrlX-CORE` | Device type reported to cloud |
| `device.cert_path` | `$SNAP_COMMON/package-certificates/thin-edge-io/tedge/own/certs/tedge-certificate.pem` | Device certificate (ctrlX Certificate Store) |
| `device.key_path` | `$SNAP_COMMON/package-certificates/thin-edge-io/tedge/own/private/tedge-private-key.pem` | Private key (ctrlX Certificate Store, mode 700) |

#### `mqtt` block

| Key | Value | Description |
|-----|-------|-------------|
| `mqtt.bind.address` | `127.0.0.1` | Mosquitto listens on localhost only |
| `mqtt.bind.port` | `1883` | Local broker port |
| `mqtt.client.port` | `1883` | Port used by tedge services to connect to the broker |

#### `http` block

| Key | Value | Description |
|-----|-------|-------------|
| `http.bind.address` | `127.0.0.1` | File-transfer service listens on localhost only |
| `http.bind.port` | `8000` | File-transfer service port |

#### `software` block

| Key | Value | Description |
|-----|-------|-------------|
| `software.plugin.default` | `snap` | Default software management plugin |

#### `data` / `logs` / paths

| Key | Value | Description |
|-----|-------|-------------|
| `data.path` | `$SNAP_COMMON/tedge` | Persistent data directory (survives snap updates) |
| `logs.path` | `$SNAP_COMMON/tedge/log` | Log directory |
| `run.path` | `$SNAP_DATA/tedge/run` | Runtime sockets and PID files (updated on each refresh) |
| `tmp.path` | `$SNAP_DATA/tedge/tmp` | Temporary files |
| `log.plugin_paths` | `$SNAP_DATA/tedge/log-plugins-disabled` | Set to empty dir to disable tedge-agent's built-in log manager; log uploads are handled by `tedge-log-upload-manager` |

#### `sudo` block

| Key | Value | Description |
|-----|-------|-------------|
| `sudo.enable` | `false` | Disabled — snap runs without root |

### Snap-Managed Plugin Configurations

These files are re-generated by the `post-refresh` hook after every snap update to fix revision-specific paths.

#### `tedge-log-plugin.toml` (`$SNAP_DATA/tedge/plugins/`)

| Log type | Path pattern |
|----------|-------------|
| `software-management` | `$SNAP_COMMON/tedge/log/agent/workflow-software_*` |
| `tedge-agent` | `$SNAP_COMMON/tedge/log/tedge-agent.log` |
| `tedge-datalayer-bridge` | `$SNAP_COMMON/tedge/log/tedge-datalayer-bridge.log` |
| `tedge-mapper-c8y` | `$SNAP_COMMON/tedge/log/tedge-mapper.log` |
| `mosquitto` | `$SNAP_COMMON/tedge/log/mosquitto.log` |
| `webserver` | `$SNAP_COMMON/tedge/log/tedge-web-config.log` |
| `log-upload-manager` | `$SNAP_COMMON/tedge/log/tedge-log-upload-manager.log` |

#### `tedge-configuration-plugin.toml` (`$SNAP_DATA/tedge/plugins/`)

| Config type | File path |
|-------------|-----------|
| `tedge.toml` / `default` | `$SNAP_DATA/tedge/tedge.toml` |
| `mosquitto.conf` | `$SNAP_DATA/mosquitto/mosquitto.conf` |
| `inventory.json` | `$SNAP_DATA/tedge/device/inventory.json` |
| `tedge-log-plugin` | `$SNAP_DATA/tedge/plugins/tedge-log-plugin.toml` |

### REST API — Data Layer Mappings

The following endpoints manage ctrlX Data Layer ↔ MQTT bridge mappings:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datalayer/mappings` | List all mappings |
| POST | `/api/datalayer/mappings` | Replace all mappings |
| POST | `/api/datalayer/mappings/add` | Add a single mapping |
| PUT | `/api/datalayer/mappings/{id}` | Update a mapping by ID |
| DELETE | `/api/datalayer/mappings/{id}` | Delete a mapping by ID |

## How to connect to Cumulocity IoT and other cloud platforms and run the thin-edge.io snap on ctrlX CORE

See the [docs/](docs/) folder for detailed guides:
- [Architecture Overview](docs/architecture-overview.md)
- [Auth Integration](docs/auth-integration.md)
- [Manual](docs/manual.md)
- [Release Notes](docs/release-notes.md)
- [Test Setup](docs/test-setup-description.md)
