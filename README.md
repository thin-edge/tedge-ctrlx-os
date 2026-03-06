# thin-edge.io for ctrlX AUTOMATION

[![Version](https://img.shields.io/badge/version-1.7.1-blue)](https://github.com/Cumulocity-IoT/thin-edge-io-app)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)
[![Architecture](https://img.shields.io/badge/arch-amd64%20%7C%20arm64-lightgrey)](https://github.com/Cumulocity-IoT/thin-edge-io-app)

## Overview

This is a **ctrlX AUTOMATION** snap app that packages [thin-edge.io](https://thin-edge.io) — the open-source, cloud-agnostic IoT edge framework. It enables ctrlX CORE and ctrlX COREvirtual devices to securely connect to major IoT cloud platforms and provides a built-in web UI for configuration and monitoring.

## Features

- **Multi-Cloud Connectivity** — Cumulocity IoT, AWS IoT Core, Azure IoT Hub
- **Web-Based Configuration UI** — Browser-accessible dashboard served directly from the device
- **Device Management** — Remote monitoring, software updates, configuration management
- **Log Management** — Centralized log collection with live viewer in the web UI
- **Tedge Configuration Viewer** — Live view of `tedge config list` output in the web UI
- **Remote Access** — Secure remote access via Cumulocity
- **MQTT Bridge** — Efficient local and cloud messaging via Mosquitto
- **ctrlX Data Layer Bridge** — Optional bridge service for ctrlX Data Layer integration
- **Health Monitoring** — Integrated watchdog service with automatic service recovery
- **Strict Snap Confinement** — Process isolation, no root privileges required

## Repository Structure

```
thin-edge-io-app/
├── snap/
│   ├── snapcraft.yaml          # Snap build definition
│   └── hooks/                  # install, configure, post-refresh hooks
├── web-server-rust/            # Actix-web backend (Rust)
│   ├── src/main.rs             # REST API server
│   └── www/                    # Frontend (HTML, JS, CSS)
├── bridge-service-rust/        # ctrlX Data Layer bridge (Rust)
├── web/www/                    # Frontend source (includes styles.less)
├── scripts/                    # Build and runtime helper scripts
├── configs/                    # App metadata (caddyfile, package-manifest)
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
| `c8y-firmware-plugin` | Firmware update management for Cumulocity |
| `c8y-remote-access-plugin` | Secure remote access via Cumulocity |
| `tedge-apt-plugin` | APT package management integration |
| `tedge-file-config-plugin` | Configuration file management |
| `tedge-file-log-plugin` | Log file collection and forwarding |

### Custom Services
| Service | Description |
|---------|-------------|
| `webserver` | Rust/Actix-web configuration UI (accessible via ctrlX sidebar) |
| `tedge-datalayer-bridge` | ctrlX Data Layer ↔ thin-edge.io bridge |

## Web UI

After installation, the configuration UI is accessible via the ctrlX CORE sidebar under **thin-edge.io**, or directly at:

```
https://<device-ip>/thin-edge-io/
```

### UI Sections

- **Status** — Live service status for all thin-edge.io services
- **Cloud Configuration** — Configure Cumulocity IoT, AWS IoT, or Azure IoT Hub connection
- **Device Identity** — Manage device ID and X.509 certificates
- **Connection** — Connect, disconnect, reconnect to cloud platforms; send test messages
- **Logs** — Live log viewer with selectable service and log level
- **Tedge Configuration** — Full output of `tedge config list`
- **System Information** — Build info, snap version, architecture

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
| GET | `/log-level` | Get current log level |
| POST | `/log-level` | Set log level |
| POST | `/restart` | Restart all services |

## Installation

### Prerequisites

- ctrlX CORE or ctrlX COREvirtual with **ctrlX OS 1.20 or higher**
- Network connectivity to your cloud platform

### Install Steps

1. Build the snap (see [Building from Source](#building-from-source)) or download a release:
   - `thin-edge-io_1.7.1_amd64.snap` — ctrlX COREvirtual
   - `thin-edge-io_1.7.1_arm64.snap` — ctrlX CORE hardware

2. Open the ctrlX CORE web interface

3. Navigate to **Settings → Apps**

4. Switch to **Service Mode**

5. Click **Install from file** and select the snap file

6. Switch back to **Operation Mode**

## Configuration

### Via Web UI (Recommended)

Open `https://<device-ip>/thin-edge-io/` and configure cloud connection, device ID, and certificates directly in the browser.

### Via CLI (SSH / Terminal)

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

## Building from Source

### Automated Build (Recommended)

```bash
git clone https://github.com/Cumulocity-IoT/thin-edge-io-app.git
cd thin-edge-io-app
./setup-and-build-all.sh
```

This script installs all dependencies (Rust toolchain, Snapcraft) and builds snaps for both architectures.

> **Note**: The first build takes 15–30 minutes as it compiles all Rust dependencies from source.

### Manual Build

#### Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.85

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
# build-snap-arm64.sh  (requires arm64 build environment or cross-compilation)
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
$SNAP_DATA/tedge/.agent/
```

## Network Requirements

| Direction | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| Outbound | HTTPS | 443 | Cloud platform REST API |
| Outbound | MQTT/TLS | 8883 | Secure cloud MQTT |
| Local | HTTP | 8000 | Web UI (proxied via ctrlX caddy) |
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
- **This App Repository**: https://github.com/Cumulocity-IoT/thin-edge-io-app
- **Discord Community**: https://discord.com/invite/sVX3B8nj5d

## Roadmap

- Integration with ctrlX Data Layer
- Web UI for configuration
- ctrlX identity management integration
- Enhanced logging to ctrlX diagnostics system

## Contributing

Contributions to thin-edge.io are welcome! Visit the GitHub repository for contribution guidelines.

## About thin-edge.io

thin-edge.io is the first open-source and cloud-agnostic edge framework designed for resource-constrained IoT devices. It provides re-usable and modular components for IoT device enablement across different cloud platforms and industrial IoT scenarios.

## Build & Entwicklung

Das Projekt verwendet einen modularen Build-Prozess:

- **setup-and-build-all.sh**: Orchestriert den kompletten Build (ruft alle Teilschritte auf)
- **scripts/**: Enthält alle Build-, Test- und Wrapper-Skripte
    - setup-env.sh: Prüft/Installiert Rust, Snapcraft, Abhängigkeiten
    - build-bridge.sh: Baut und testet die Rust Datalayer Bridge
    - build-info.sh: Erstellt build-info.txt
    - build-snap.sh: Snap-Build für amd64/arm64
    - test-snap.sh: Build-Summary und Snap-Installationshinweise
    - clean.sh: Entfernt Build-Artefakte

**Tipp:** Für Anpassungen an Build oder Tests bitte die jeweiligen Skripte in scripts/ bearbeiten.

### Build ausführen

    ./setup-and-build-all.sh

### Clean

    ./scripts/clean.sh
