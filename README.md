# thin-edge.io for ctrlX AUTOMATION (WORK IN PROGRESS)

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/thin-edge/tedge-ctrlx-os)
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

### Core Services (thin-edge.io v2.0.0)
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
| `tedge-file-config-plugin` | Configuration file management via Cumulocity configuration management |
| `c8y-remote-access-plugin` | Cumulocity remote access (SSH tunnel via Cloud Remote Access) |
| `c8y-firmware-plugin` | Firmware update support via Cumulocity firmware management |
| `tedge-snap-plugin` | Lists installed snaps in Cumulocity software inventory (read-only, install/remove not supported on ctrlX CORE) |

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
---



---

#### CLOUD CONFIGURATION

Three tabs — **Cumulocity IoT**, **AWS IoT**, **Azure IoT**:

| Tab | Fields |
|-----|--------|
| **Cumulocity IoT** | C8Y URL (e.g. `https://your-tenant.cumulocity.com`), Tenant ID, Enable Cumulocity Mapper toggle |
| **AWS IoT** | AWS IoT Endpoint URL (e.g. `xxxxxxxxxx.iot.us-east-1.amazonaws.com`), Enable AWS Mapper toggle |
| **Azure IoT** | Azure IoT Hub URL (e.g. `your-hub.azure-devices.net`), Enable Azure Mapper toggle |

Each tab has a **Save Configuration** button that writes values via `POST /api/config/{cloud}`. 

---

#### DEVICE CONFIGURATION & CERTIFICATE

Left panel — device identity:

| Element | Description |
|---------|-------------|
| **Device ID** | Read-only; the unique device identifier derived from the serial number |
| **External Device ID** | Editable CN used when creating / renewing the X.509 certificate |
| **Certificate Mode** | Toggle between **Self-Signed** and **CA-Signed** certificate modes |
| **Certificate Status** | Indicates whether a valid device certificate exists |
| **Upload Status** | Shows whether the certificate has been uploaded to Cumulocity (persisted in `tedge-web-config.json`) |

*Self-signed mode:*

| Element | Description |
|---------|-------------|
| **Renew** | Recreates the self-signed certificate with the current External Device ID as CN |
| **Upload Certificate** | Expands a credential form (Cumulocity username + password) and uploads the certificate via `POST /api/cert/upload/c8y` |

*CA-signed mode:*

| Element | Description |
|---------|-------------|
| **Download Status** | Shows whether the signed certificate has been downloaded from the CA (persisted in `tedge-web-config.json`) |
| **Request Certificate** | Sends a CSR to the configured CA and downloads the signed certificate |

Right panel (shown when a certificate exists): **Certificate Details** — displays subject, issuer, validity dates, and fingerprint.

---

#### CONNECT DEVICE

Four Buttons — **Cumulocity IoT**, **AWS IoT**, **Azure IoT** — each with:

- **Connect** — runs `tedge connect <cloud>`
- **Reconnect** — runs `tedge reconnect <cloud>`
- **Disconnect** — runs `tedge disconnect <cloud>`
- **Setup ↗** — opens the thin-edge.io documentation for the respective cloud

For **Cumulocity IoT** only, an additional **MQTT Port** toggle selects between:
- `Core MQTT (8883)` — standard TLS MQTT
- `MQTT Service (9883)` — Cumulocity MQTT Service (connection only; SmartREST operations not supported)
---

#### LOGS & DIAGNOSTICS

Live log viewer with controls:

| Control | Options |
|---------|---------|
| **Service** | `tedge-agent`, `tedge-mapper`, `tedge-bridge`, `log-upload`, `mosquitto`, `webserver` ,``snap-hooks|
| **Log Level** | `error`, `warn`, `info` (default), `debug`, `trace` |
| **Apply Level** | Writes the selected level via `RUST_LOG` to `$SNAP_DATA/log-levels/<service>` and restarts the service |
| **Load Logs** | Fetches recent log lines via `GET /api/logs?service=<name>` |
| **Copy** | Copies viewer content to clipboard |
| **Diag Upload** | Triggers a diagnostics upload to the cloud (only supported for Cumulocity IoT; requires `c8y-remote-access-plugin` to be enabled)


---

#### TEDGE CONFIGURATION

Read-only diagnostic output viewer. Select a command from the dropdown and press **Load**:

| Command | Equivalent CLI | Endpoint |
|---------|---------------|----------|
| `tedge config list` | `tedge config list` | `GET /api/tedge-config-list` |
| `tedge config list --all` | Includes defaults | `GET /api/tedge-config-list-all` |
| `tedge config list --doc` | With documentation | `GET /api/tedge-config-list-doc` |
| `tedge bridge inspect c8y` | Mosquitto bridge config | `GET /api/tedge-bridge-inspect` |

- **Load** — fetches the selected command output
- **Copy** — copies the output to clipboard

---

#### FLOWS

Manages thin-edge.io **flows** — script-based processing pipelines for MQTT messages, stored as files on the device.

**Toolbar:**

| Control | Description |
|---------|-------------|
| **Mapper** selector | Choose target mapper: `Cumulocity (c8y)`, `AWS IoT (aws)`, or `Azure IoT (az)` |
| **New Flow** | Opens inline form; creates a new flow directory with a `flow.toml` template via `POST /api/flows/file` |
| **Refresh** | Re-fetches all flows via `GET /api/flows?mapper=<mapper>` |

**Split layout:**

- **Left — Active Flows** tree: lists active flows with their files; click a file to open it in the editor; each flow row has an **Archive** button
- **Left — Archived Flows** tree: lists archived flows; each row has a **Restore** button (`POST /api/flows/restore`)
- **Right — Editor**: shows the selected file content in a resizable monospace textarea
  - **Save** — writes the file via `POST /api/flows/file?mapper=...&flow=...&file=...`
  - **Delete File** — removes the file via `DELETE /api/flows/file?...`
  - **Add File** — inline form to add a new file to the current flow (allowed extensions: `.js`, `.toml`, `.toml.template`)

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

**Datalayer Bridge Connection** toggle — enables/disables the bridge (top of section).

**Connection Settings** (collapsible `<details>`):

| Field | Description |
|-------|-------------|
| Static Token | Optional bearer token (overrides username/password; shown first) |
| Base URL | ctrlX Data Layer base URL (default `https://localhost`) |
| Username | Data Layer username (default `boschrexroth`) |
| Password | Data Layer password |
| Poll interval (ms) | How often the bridge polls Data Layer nodes (default `5000`) |
| Accept invalid TLS certs | Skip TLS verification (useful for self-signed certificates on local device) |

Settings are saved via the global **Save** button in the page toolbar (`POST /api/datalayer/config`).

**Node Browser** (collapsible `<details>`):
- Path input + **Browse** button — lists child nodes of the given Data Layer path via `GET /api/datalayer/browse`
- **↑ Up** — navigates to the parent path
- Clicking a node reads its current value; a **+** icon in the node list opens the Add Mapping form pre-filled with that path

**Mappings Form** (shown when adding or editing):

A **Mapping Type toggle** switches between two modes:

*Datalayer mode* (default) — reads a Data Layer node and publishes to MQTT:

| Field | Description |
|-------|-------------|
| Datalayer Path | Full path to the Data Layer node (e.g. `/framework/metrics/system/memfree-mb`) |
| tedge MQTT Topic | Auto-suggested based on transform type; editable (e.g. `c8y/mqtt/out/myTopic`) |
| Transform | `raw`, `measurement`, `event`, or `alarm` |
| Field name | JSON field name in the payload (auto-derived from path if left empty) |
| Unit | Optional unit string (e.g. `°C`, `MB`, `%`) — published as top-level `"unit"` field |

*Flow mode* — routes a Data Layer node through a thin-edge.io flow script:

| Field | Description |
|-------|-------------|
| Datalayer Path | Full path to the Data Layer node |
| Flow selector | Choose an existing flow from the Flows section |
| tedge MQTT Topic | Output topic written by the flow |
| Transform | `raw`, `measurement`, `event`, or `alarm` |
| Field name | JSON field name in the payload |
| Unit | Optional unit string |

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

| Column | Description |
|--------|-------------|
| **Name** | Capability / license name |
| **Status** | Current license status (e.g. active, expired) |
| **Valid Until** | License expiry date |
| **Qty** | Licensed quantity |

- **Manage Licenses** button — opens `/license-manager` (ctrlX License Manager UI) in a new tab

If no valid license is held, a **red warning banner** is shown at the top of the page with a link to the Licensing section and the Bosch Rexroth Licensing Center.

---



### Web API (REST)

See **[docs/api-reference.md](docs/api-reference.md)** for the complete REST API reference.

## Installation

See **[docs/installation.md](docs/installation.md)** for the complete installation guide, including:

- Prerequisites and supported ctrlX OS versions
- Step-by-step install via web interface and CLI
- First-time setup wizard (cloud config, certificate, connect)
- Snap service management commands
- CLI commands reference
- Important file paths
- Network requirements
- Uninstall instructions

## Configuration

See **[docs/installation.md](docs/installation.md)** for CLI-based configuration and **[docs/configuration-reference.md](docs/configuration-reference.md)** for the complete reference of all auto-configured tedge settings, plugin configs, and Data Layer bridge configuration.

Quick start via web UI:

```
https://<device-ip>/thin-edge-io/
```

## Building from Source

See **[docs/building.md](docs/building.md)** for the full build guide, including automated and manual build instructions, frontend development workflow, and a build scripts reference.

Quick start:

```bash
git clone https://github.com/thin-edge/tedge-ctrlx-os.git
cd tedge-ctrlx-os
./setup-and-build-all.sh --fix
```

## Troubleshooting

See **[docs/troubleshooting.md](docs/troubleshooting.md)** for common issues and solutions covering cloud connectivity, certificate management, service startup failures, the Data Layer bridge, and license problems.

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

See **[docs/building.md](docs/building.md)** for the complete build guide and scripts reference.

```bash
# Full build
./setup-and-build-all.sh

# Format check
./scripts/check-format.sh

# Clean build artifacts
./scripts/clean.sh
```

## thin-edge.io Configuration Interface

See **[docs/configuration-reference.md](docs/configuration-reference.md)** for the complete reference of all auto-configured tedge settings and snap-managed plugin configurations.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/installation.md](docs/installation.md) | Installation, first-time setup, CLI reference, file paths, network requirements |
| [docs/building.md](docs/building.md) | Building from source, frontend development, scripts reference |
| [docs/configuration-reference.md](docs/configuration-reference.md) | tedge.toml auto-configuration, plugin configs, Data Layer bridge config |
| [docs/api-reference.md](docs/api-reference.md) | Complete REST API reference with all endpoints and scopes |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common issues and solutions |
| [docs/manual.md](docs/manual.md) | Screenshot-based user manual for the web UI |
| [docs/architecture-overview.md](docs/architecture-overview.md) | System architecture and component overview |
| [docs/auth-integration.md](docs/auth-integration.md) | ctrlX authentication and role-based access control |
| [docs/release-notes.md](docs/release-notes.md) | Version history and changelog |
| [docs/roadmap.md](docs/roadmap.md) | Not yet implemented features and known limitations |
| [docs/test-setup-description.md](docs/test-setup-description.md) | Test environment setup |
