# thin-edge.io for ctrlX AUTOMATION

## Overview

This is a CTRLX AUTOMATION app package for **thin-edge.io**, the open-source cloud-agnostic IoT edge framework. This app enables ctrlX CORE devices to connect to major cloud IoT platforms including Cumulocity IoT, AWS IoT, and Azure IoT Hub.

## Features

- **Multi-Cloud Connectivity**: Connect to Cumulocity IoT, AWS IoT Core, or Azure IoT Hub
- **Device Management**: Remote device monitoring and management
- **Software Management**: Over-the-air software updates
- **Configuration Management**: Remote configuration updates
- **Log Management**: Centralized log collection and forwarding
- **Remote Access**: Secure remote access to devices
- **MQTT Messaging**: Efficient local and cloud messaging
- **Protocol Translation**: Automatic translation between device and cloud protocols

## Components

This app includes all thin-edge.io components:

### Core Services
- **tedge**: Main CLI tool for configuration and management
- **tedge-agent**: Agent service for software and configuration management
- **tedge-mapper**: Protocol mappers for c8y/aws/azure
- **tedge-watchdog**: Health monitoring service

### Plugins
- **c8y-firmware-plugin**: Firmware management for Cumulocity
- **c8y-remote-access-plugin**: Remote access via Cumulocity
- **tedge-apt-plugin**: APT package management
- **tedge-file-config-plugin**: Configuration file management
- **tedge-file-log-plugin**: Log file management

## Installation

### Prerequisites
- ctrlX CORE or ctrlX COREvirtual with firmware version 1.20 or higher
- Network connectivity to your cloud platform

### Install Steps

1. Build or download the appropriate snap file:
   - `thin-edge-io_1.7.1_amd64.snap` for ctrlX COREvirtual
   - `thin-edge-io_1.7.1_arm64.snap` for ctrlX CORE hardware
   
   To build: Run `./setup-and-build-all.sh` (see "Building from Source" section)

2. Open ctrlX CORE web interface

3. Navigate to **Settings → Apps**

4. Switch to **Service Mode**

5. Click **Install from file**

6. Select the downloaded snap file

7. Switch back to **Operation Mode**

## Configuration

### Initial Setup

After installation, connect via SSH or use the web interface terminal:

```bash
# Configure connection to Cumulocity IoT
thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com
thin-edge-io.tedge config set device.id your-device-id

# Or configure for AWS IoT
thin-edge-io.tedge config set aws.url your-endpoint.iot.region.amazonaws.com

# Or configure for Azure IoT Hub
thin-edge-io.tedge config set az.url your-hub.azure-devices.net
```

### Certificate Management

```bash
# Create new device certificate
thin-edge-io.tedge cert create --device-id your-device-id

# Show certificate
thin-edge-io.tedge cert show
```

### Connect to Cloud

```bash
# Connect to Cumulocity IoT
thin-edge-io.tedge connect c8y

# Or connect to AWS IoT
thin-edge-io.tedge connect aws

# Or connect to Azure IoT Hub
thin-edge-io.tedge connect az
```

## Usage

### Check Status

```bash
# Check connection status
thin-edge-io.tedge connect c8y --test

# Check service status via snap
snap services thin-edge-io
```

### Send Measurements

```bash
# Send telemetry data
tedge mqtt pub te/device/main///m/ '{"temperature": 23.5}'
```

### View Logs

```bash
# View service logs
snap logs thin-edge-io.tedge-agent
snap logs thin-edge-io.tedge-mapper-c8y
snap logs thin-edge-io.tedge-watchdog
```

## Network Requirements

### Outbound Connections

The following outbound connections are required:

| Protocol | Port | Purpose |
|----------|------|---------|
| HTTPS | 443 | Cloud platform API access |
| MQTT/TLS | 8883 | Secure MQTT connections to cloud |

### Local Connections

| Protocol | Port | Purpose |
|----------|------|---------|
| HTTP | 8000 | Agent API (internal) |
| MQTT | 1883 | Local MQTT broker (optional) |

## Architecture

```
┌─────────────────────────────────────────────┐
│           ctrlX CORE Device                  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  thin-edge.io App                     │  │
│  │                                        │  │
│  │  ┌─────────────┐   ┌──────────────┐  │  │
│  │  │ tedge-agent │   │ tedge-mapper │  │  │
│  │  └─────────────┘   └──────────────┘  │  │
│  │                                        │  │
│  │  ┌─────────────┐   ┌──────────────┐  │  │
│  │  │  Plugins    │   │   watchdog   │  │  │
│  │  └─────────────┘   └──────────────┘  │  │
│  └──────────────────────────────────────┘  │
│                  ↕                          │
│         MQTT / HTTP / IPC                   │
└─────────────────────────────────────────────┘
                  ↕
          Internet (TLS)
                  ↕
┌─────────────────────────────────────────────┐
│        Cloud IoT Platform                    │
│   (Cumulocity / AWS / Azure)                │
└─────────────────────────────────────────────┘
```

## Security

- All cloud connections use TLS encryption
- Certificate-based device authentication
- Snap confinement for process isolation
- Minimal required permissions (network, network-bind, system-observe)
- No root privileges required

## Troubleshooting

### Connection Issues

```bash
# Test cloud connectivity
thin-edge-io.tedge connect c8y --test

# Check certificate
thin-edge-io.tedge cert show

# Verify configuration
thin-edge-io.tedge config list
```

### Service Not Starting

```bash
# Check service logs
snap logs thin-edge-io.tedge-agent -f

# Restart services
snap restart thin-edge-io
```

### High Resource Usage

```bash
# Check resource usage
snap info thin-edge-io

# View running processes
ps aux | grep tedge
```

## Performance

### Resource Requirements

- **RAM**: ~50-100 MB (depending on active mappers)
- **CPU**: <5% on idle, <20% during active data transfer
- **Storage**: ~100 MB for app, additional space for logs/cache
- **Network**: Minimal bandwidth, optimized MQTT protocol

### Scalability

- Handles 1000+ measurements per minute
- Supports multiple simultaneous mapper connections
- Efficient message batching and compression

## Building from Source

### Automated Setup and Build (Recommended)

Use the automated script to install all dependencies and build both architectures:

```bash
./setup-and-build-all.sh
```

This script will:
- Install Rust toolchain (if not present)
- Install Snapcraft (if not present)
- Install build dependencies
- Build snap for amd64 (ctrlX COREvirtual)
- Build snap for arm64 (ctrlX CORE hardware)

**Note**: First build takes 15-30 minutes as it downloads and compiles all Rust dependencies.

### Manual Build (Advanced)

#### Prerequisites

```bash
# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.85

# Install snapcraft
sudo snap install snapcraft --classic

# Install build dependencies
sudo apt-get install pkg-config libssl-dev libsqlite3-dev
```

#### Build Commands

```bash
# For ctrlX COREvirtual (amd64)
./build-snap-amd64.sh

# For ctrlX CORE hardware (arm64)
./build-snap-arm64.sh
```

#### Build Output

After successful build, snap files will be created in the current directory:
- `thin-edge-io_1.7.1_amd64.snap` - For ctrlX COREvirtual
- `thin-edge-io_1.7.1_arm64.snap` - For ctrlX CORE hardware

## License

This app packages thin-edge.io, which is licensed under **Apache License 2.0**.

All included open-source components are properly attributed. See `configs/fossinfo.json` and `configs/foss-offer.txt` for complete license information.

## Support

- **Documentation**: https://thin-edge.github.io/thin-edge.io/
- **GitHub**: https://github.com/thin-edge/thin-edge.io
- **Discord**: https://discord.com/invite/sVX3B8nj5d
- **Email**: info@thin-edge.io

## Version

- **App Version**: 1.7.1
- **thin-edge.io Version**: 1.7.1
- **Base**: Ubuntu Core 24
- **Architectures**: amd64, arm64

## Changelog

### Version 1.7.1 (2026-02-12)
- Initial CTRLX AUTOMATION release
- All core components included
- Support for Cumulocity, AWS, and Azure
- Complete plugin suite
- Health monitoring and watchdog
- Full snap confinement

## Known Limitations

- Direct ctrlX Data Layer integration not yet implemented
- Web UI integration pending
- Some advanced network features may require manual configuration

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
