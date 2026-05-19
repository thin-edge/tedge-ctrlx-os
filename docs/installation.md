# Installation Guide

This guide covers installing the **thin-edge.io for ctrlX AUTOMATION** snap on a ctrlX CORE or ctrlX COREvirtual device and performing the initial setup to connect it to a cloud platform.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install the Snap](#2-install-the-snap)
3. [First-Time Setup via Web UI](#3-first-time-setup-via-web-ui)
4. [First-Time Setup via CLI](#4-first-time-setup-via-cli)
5. [Certificate Management (CLI)](#5-certificate-management-cli)
6. [Snap Service Management](#6-snap-service-management)
7. [Snap CLI Commands](#7-snap-cli-commands)
8. [Important File Paths](#8-important-file-paths)
9. [Network Requirements](#9-network-requirements)
10. [Uninstall](#10-uninstall)

---

## 1. Prerequisites

- ctrlX CORE or ctrlX COREvirtual running **ctrlX OS 1.20 or higher**
- Network connectivity from the device to your cloud platform
- A snap package file — either built from source (see [building.md](building.md)) or downloaded from a release:
  - `ctrlx-cumulocity-thin-edge-io_0.1.0_amd64.snap` — ctrlX COREvirtual (x86-64)
  - `ctrlx-cumulocity-thin-edge-io_0.1.0_arm64.snap` — ctrlX CORE hardware (ARM64)

---

## 2. Install the Snap

### Via ctrlX Web Interface (Recommended)

1. Open the ctrlX CORE web interface in your browser
2. Navigate to **Settings → Apps**
3. If required, enable **Allow installation from unknown source**
4. Switch the device to **Service Mode**
5. Click **Install from file** and select the `.snap` file
6. Switch back to **Operation Mode**

The snap will appear in the ctrlX sidebar as **thin-edge.io** after a few seconds.

### Via SSH / Terminal

```bash
# Copy the snap file to the device first, then:
snap install ctrlx-cumulocity-thin-edge-io_0.1.0_amd64.snap --dangerous
```

> `--dangerous` is required for locally built or unsigned snaps.

---

## 3. First-Time Setup via Web UI

Open the configuration UI at:

```
https://<device-ip>/thin-edge-io/
```

Or click **thin-edge.io** in the ctrlX sidebar.

### Step 1 — Configure Cloud Endpoint

1. Open the **Cloud Configuration** section
2. Select the **Cumulocity IoT** tab
3. Enter your tenant URL, e.g. `your-tenant.cumulocity.com`
4. Select MQTT port: **8883** (standard) or **9883** (MQTT Service)
5. Click **Save**

### Step 2 — Create Device Certificate

1. Open the **Device & Certificate** section
2. The **Device ID** is auto-detected from the hardware serial number
3. Set the **Certificate Mode** toggle to **Self-Signed**
4. Click **Renew** to create the self-signed certificate
5. Click **Upload Certificate** and enter your Cumulocity credentials to register the certificate

### Step 3 — Connect

1. Open the **Connect Device** section
2. Click **Connect C8y**
3. The **Connection Status** section will show the `c8y` bridge as 🟢 running

---

## 4. First-Time Setup via CLI

SSH access requires the user to be a member of the `ssh-users` group (**Settings → Users & Groups**) and SSH to be enabled (**Settings → Apps → SSH**).

```bash
# Configure Cumulocity IoT
ctrlx-cumulocity-thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com

# Configure for AWS IoT
ctrlx-cumulocity-thin-edge-io.tedge config set aws.url your-endpoint.iot.region.amazonaws.com

# Configure for Azure IoT Hub
ctrlx-cumulocity-thin-edge-io.tedge config set az.url your-hub.azure-devices.net
```

---

## 5. Certificate Management (CLI)

```bash
# Create device certificate (auto-detects device ID from hardware)
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id create

# Create with an explicit device ID
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id set my-device-001

# Show certificate details
ctrlx-cumulocity-thin-edge-io.tedge cert show

# Connect to Cumulocity (uploads certificate, creates device in tenant)
ctrlx-cumulocity-thin-edge-io.tedge connect c8y

# Reconnect (e.g. after certificate renewal)
ctrlx-cumulocity-thin-edge-io.tedge reconnect c8y

# Disconnect
ctrlx-cumulocity-thin-edge-io.tedge disconnect c8y
```

---

## 6. Snap Service Management

```bash
# Show status of all services
snap services ctrlx-cumulocity-thin-edge-io

# Example output:
# Service                                                  Startup  Current   Notes
# ctrlx-cumulocity-thin-edge-io.mosquitto                 enabled  active    -
# ctrlx-cumulocity-thin-edge-io.tedge-agent               enabled  active    -
# ctrlx-cumulocity-thin-edge-io.tedge-datalayer-bridge    enabled  active    -
# ctrlx-cumulocity-thin-edge-io.tedge-log-upload-manager  enabled  active    -
# ctrlx-cumulocity-thin-edge-io.tedge-mapper-aws          enabled  inactive  -
# ctrlx-cumulocity-thin-edge-io.tedge-mapper-az           enabled  inactive  -
# ctrlx-cumulocity-thin-edge-io.tedge-mapper-c8y          enabled  active    -
# ctrlx-cumulocity-thin-edge-io.tedge-watchdog            enabled  active    -
# ctrlx-cumulocity-thin-edge-io.webserver                 enabled  active    -

# Restart all services
snap restart ctrlx-cumulocity-thin-edge-io

# Restart a single service
snap restart ctrlx-cumulocity-thin-edge-io.tedge-agent

# View live logs
snap logs ctrlx-cumulocity-thin-edge-io.webserver -f
snap logs ctrlx-cumulocity-thin-edge-io.tedge-agent -f

# Show snap version and revision
snap info ctrlx-cumulocity-thin-edge-io

# View snap configuration (tedge.toml)
snap get ctrlx-cumulocity-thin-edge-io -d

# Disable / enable snap
snap disable ctrlx-cumulocity-thin-edge-io
snap enable ctrlx-cumulocity-thin-edge-io
```

---

## 7. Snap CLI Commands

### `manage-device-id` — Device ID Management

```bash
ctrlx-cumulocity-thin-edge-io.manage-device-id <command> [device-id]
```

| Command | Description |
|---------|-------------|
| `get-serial` | Print the system serial number (DMI/UUID-based) |
| `get-current` | Print the current device ID from the existing certificate |
| `status` | Show system serial number and current device ID |
| `create [device-id]` | Create a new certificate — uses `get-serial` if no ID is provided |
| `recreate [device-id]` | Recreate the certificate (e.g. after device replacement) |
| `set <device-id>` | Set an explicit device ID and create the certificate |

**Examples:**

```bash
# Show current status
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id status

# Create certificate using auto-detected serial number
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id create

# Set an explicit device ID
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id set my-device-001
```

### `build-info` — Version Information

```bash
ctrlx-cumulocity-thin-edge-io.build-info
```

Displays the installed snap version, build number, and architecture.

---

## 8. Important File Paths

| Path | Contents |
|------|----------|
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/` | Service log files |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/package-certificates/thin-edge-io/tedge/own/certs/` | Device certificate (`.pem`) |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/package-certificates/thin-edge-io/tedge/own/private/` | Private key |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/common/datalayer-credentials.json` | ctrlX Data Layer credentials (survives updates) |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/datalayer-mappings.json` | Data Layer ↔ MQTT bridge mappings |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/tedge/tedge.toml` | Main thin-edge.io configuration |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/log-levels/` | Log level files per service |
| `/var/snap/ctrlx-cumulocity-thin-edge-io/current/package-run/thin-edge-io/` | Runtime status (ctrlX) |
| `/tmp/ctrlx-cumulocity-thin-edge-io.license` | Held ctrlX license ID (cleared on reboot) |

---

## 9. Network Requirements

| Direction | Protocol | Port | Purpose |
|-----------|----------|------|---------|
| Outbound | HTTPS | 443 | Cloud platform REST API (certificate upload, tenant info) |
| Outbound | MQTT/TLS | 8883 | Secure cloud MQTT — Core MQTT (recommended) |
| Outbound | MQTT/TLS | 9883 | Cumulocity MQTT Service (connection only; SmartREST not supported) |
| Local | HTTP | 8888 | Web UI (proxied through ctrlX Caddy reverse proxy) |
| Local | MQTT | 1883 | Local Mosquitto broker (internal services only) |

---

## 10. Uninstall

```bash
# Remove snap (configuration and logs remain in $SNAP_COMMON)
snap remove ctrlx-cumulocity-thin-edge-io

# Remove snap and all data permanently
snap remove --purge ctrlx-cumulocity-thin-edge-io

# Revert to previous revision after a failed update
snap revert ctrlx-cumulocity-thin-edge-io
```

> **Note**: `snap remove` without `--purge` keeps all data under `/var/snap/ctrlx-cumulocity-thin-edge-io/common/`. This allows reinstalling without losing certificates and configuration.
