# thin-edge.io CTRLX App - User Manual

**Version**: 1.7.1  
**Date**: March 2026  
**App ID**: thin-edge-io  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Operation](#5-operation)
6. [Monitoring](#6-monitoring)
7. [Troubleshooting](#7-troubleshooting)
8. [API Reference](#8-api-reference)
9. [Security](#9-security)
10. [Support](#10-support)

---

## 1. Introduction

### 1.1 Purpose

This manual describes the installation, configuration, and operation of the thin-edge.io app for ctrlX AUTOMATION. The app enables ctrlX CORE devices to connect to cloud IoT platforms and provides comprehensive device management capabilities.

### 1.2 Scope

This app is designed for:
- Industrial IoT applications requiring cloud connectivity
- Device monitoring and management scenarios
- Multi-cloud deployment strategies
- Edge data processing and forwarding

### 1.3 Key Features

- **Web-Based Configuration UI**: Browser-accessible dashboard served directly from the device
- **Cloud Connectivity**: Connect to Cumulocity IoT, AWS IoT, or Azure IoT Hub
- **Device Management**: Remote monitoring, configuration, and software updates
- **Data Management**: Telemetry collection, processing, and forwarding
- **ctrlX Data Layer Bridge**: Optional bridge service for ctrlX Data Layer integration
- **Security**: TLS encryption, certificate-based authentication, ctrlX RBAC
- **Monitoring**: Health checks, service watchdog, log management

---

## 2. System Requirements

### 2.1 Hardware

**Minimum Requirements:**
- ctrlX CORE or ctrlX COREvirtual
- 512 MB RAM
- 200 MB available storage
- Network interface with internet access

**Recommended:**
- 1 GB RAM
- 500 MB available storage
- Gigabit Ethernet connection

### 2.2 Software

- ctrlX OS version 1.20 or higher
- Active network connection
- Cloud platform account (Cumulocity/AWS/Azure)

### 2.3 Network

**Required Outbound Access:**
- HTTPS (port 443) to cloud platform
- MQTT over TLS (port 8883) to cloud platform

**Internal (not externally accessible):**
- MQTT (port 1883) — local Mosquitto broker, bound to 127.0.0.1
- HTTP (port 8888) — Web UI, proxied via ctrlX Caddyfile to `/thin-edge-io/`

---

## 3. Installation

### 3.1 Download

Download the appropriate snap package:
- **ctrlX COREvirtual**: `thin-edge-io_1.7.1_amd64.snap`
- **ctrlX CORE Hardware**: `thin-edge-io_1.7.1_arm64.snap`

### 3.2 Install via Web Interface

1. Open ctrlX CORE web interface
2. Navigate to **Settings → Apps**
3. Enable **Service Mode**
4. Click **Install from file**
5. Select the snap file
6. Wait for installation to complete
7. Return to **Operation Mode**

### 3.3 Verify Installation

Check that all services are running:
```bash
snap services thin-edge-io
```

Expected output shows all services as "active".

---

## 4. Configuration

### 4.0 Web UI (Recommended)

After installation, open the configuration UI directly in the ctrlX sidebar or navigate to:

```
https://<device-ip>/thin-edge-io/
```

The Web UI allows you to:
- Select and configure cloud platform (Cumulocity, AWS, Azure)
- Manage device identity and certificates
- Connect, disconnect, and reconnect to cloud platforms
- View live service logs and status
- Read the full `tedge config list` output
- Manage ctrlX Data Layer mappings

> **Note**: The Web UI enforces ctrlX role-based access control. Users need the `thin-edge-io.r` scope (Viewer) for read-only access, `thin-edge-io.rw` (Editor) for configuration changes, or `thin-edge-io.rwx` (Admin) for full access including service restarts.

### 4.1 Cloud Platform Selection

Choose your target cloud platform and configure accordingly.

#### 4.1.1 Cumulocity IoT

```bash
# Set Cumulocity tenant URL
thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com

# Set device ID
thin-edge-io.tedge config set device.id your-device-id

# Set connection type (optional)
thin-edge-io.tedge config set c8y.mqtt.client_id your-client-id
```

#### 4.1.2 AWS IoT Core

```bash
# Set AWS IoT endpoint
thin-edge-io.tedge config set aws.url xxxx.iot.region.amazonaws.com

# Set device ID
thin-edge-io.tedge config set device.id your-device-id
```

#### 4.1.3 Azure IoT Hub

```bash
# Set Azure IoT Hub hostname
thin-edge-io.tedge config set az.url your-hub.azure-devices.net

# Set device ID
thin-edge-io.tedge config set device.id your-device-id
```

### 4.2 Certificate Management

#### 4.2.1 Create Device Certificate

```bash
# Generate new device certificate
thin-edge-io.tedge cert create --device-id your-device-id

# Display certificate
thin-edge-io.tedge cert show

# Show certificate thumbprint (for cloud registration)
thin-edge-io.tedge cert show --thumbprint
```

#### 4.2.2 Upload Certificate to Cloud

**Cumulocity IoT:**
1. Log into Cumulocity web interface
2. Navigate to Device Management → Device Registration
3. Register device with certificate thumbprint

**AWS IoT:**
1. Log into AWS Console
2. Navigate to IoT Core → Security → Certificates
3. Register certificate and attach policy

**Azure IoT Hub:**
1. Log into Azure Portal
2. Navigate to IoT Hub → Device Management
3. Add device with X.509 authentication

### 4.3 Connect to Cloud

```bash
# Connect to Cumulocity
thin-edge-io.tedge connect c8y

# Connect to AWS
thin-edge-io.tedge connect aws

# Connect to Azure
thin-edge-io.tedge connect az
```

### 4.4 Advanced Configuration

#### 4.4.1 MQTT Settings

```bash
# Configure MQTT QoS
thin-edge-io.tedge config set mqtt.qos 1

# Configure keep-alive interval
thin-edge-io.tedge config set mqtt.keepalive 60
```

#### 4.4.2 HTTP Settings

```bash
# Configure HTTP timeout
thin-edge-io.tedge config set http.timeout 30
```

#### 4.4.3 Log Settings

```bash
# Set log level
thin-edge-io.tedge config set log.level info

# Available levels: error, warn, info, debug, trace
```

---

## 5. Operation

### 5.1 Starting Services

Services start automatically after installation. To manually control:

```bash
# Start all services
snap start thin-edge-io

# Start specific service
snap start thin-edge-io.tedge-agent

# Enable autostart
snap enable thin-edge-io
```

### 5.2 Stopping Services

```bash
# Stop all services
snap stop thin-edge-io

# Stop specific service
snap stop thin-edge-io.tedge-mapper-c8y
```

### 5.3 Restarting Services

```bash
# Restart all services
snap restart thin-edge-io

# Restart specific service
snap restart thin-edge-io.tedge-agent
```

### 5.4 Sending Data

#### 5.4.1 Send Measurements

```bash
# Send temperature measurement
thin-edge-io.tedge mqtt pub te/device/main///m/ '{
  "temperature": 23.5,
  "humidity": 45.2,
  "pressure": 1013.25
}'
```

#### 5.4.2 Send Events

```bash
# Send alarm event
thin-edge-io.tedge mqtt pub te/device/main///e/alarm '{
  "text": "High temperature detected",
  "severity": "major"
}'
```

#### 5.4.3 Update Configuration

```bash
# Request configuration update
thin-edge-io.tedge mqtt pub te/device/main///config/update '{
  "config_type": "system",
  "url": "https://example.com/config.json"
}'
```

---

## 6. Monitoring

### 6.1 Service Status

```bash
# Check service status
snap services thin-edge-io

# Check specific service
snap service thin-edge-io.tedge-agent
```

### 6.2 View Logs

```bash
# View all logs
snap logs thin-edge-io

# View specific service logs
snap logs thin-edge-io.tedge-agent

# Follow logs in real-time
snap logs thin-edge-io.tedge-agent -f

# View last 100 lines
snap logs thin-edge-io.tedge-agent -n 100
```

### 6.3 Connection Status

```bash
# Test cloud connection
thin-edge-io.tedge connect c8y --test

# Check configuration
thin-edge-io.tedge config list
```

### 6.4 Web UI

The Web UI at `https://<device-ip>/thin-edge-io/` provides:
- **Status tab**: Live status of all snap services
- **Logs tab**: Live log viewer with service and level selection
- **Tedge Configuration tab**: Full `tedge config list` output
- **System Information**: Build info, snap version, architecture, device serial

### 6.5 Resource Usage

```bash
# Check snap resource usage
snap info thin-edge-io

# Check process details
ps aux | grep tedge

# Monitor memory usage
top -p $(pgrep tedge | tr '\n' ',' | sed 's/,$//')
```

---

## 7. Troubleshooting

### 7.1 Connection Issues

**Problem**: Cannot connect to cloud platform

**Solutions**:
1. Verify network connectivity:
   ```bash
   ping your-tenant.cumulocity.com
   ```

2. Check certificate:
   ```bash
   thin-edge-io.tedge cert show
   ```

3. Verify configuration:
   ```bash
   thin-edge-io.tedge config list
   ```

4. Check mapper logs:
   ```bash
   snap logs thin-edge-io.tedge-mapper-c8y
   ```

### 7.2 Service Not Starting

**Problem**: Service fails to start

**Solutions**:
1. Check service status:
   ```bash
   snap services thin-edge-io
   ```

2. View error logs:
   ```bash
   snap logs thin-edge-io.tedge-agent
   ```

3. Restart service:
   ```bash
   snap restart thin-edge-io.tedge-agent
   ```

### 7.3 Certificate Errors

**Problem**: Certificate validation fails

**Solutions**:
1. Regenerate certificate:
   ```bash
   thin-edge-io.tedge cert remove
   thin-edge-io.tedge cert create --device-id your-device-id
   ```

2. Re-upload to cloud platform

3. Reconnect:
   ```bash
   thin-edge-io.tedge disconnect c8y
   thin-edge-io.tedge connect c8y
   ```

### 7.4 High Resource Usage

**Problem**: Excessive CPU or memory usage

**Solutions**:
1. Check log level (reduce if set to debug/trace):
   ```bash
   thin-edge-io.tedge config set log.level info
   ```

2. Reduce MQTT message frequency

3. Restart services:
   ```bash
   snap restart thin-edge-io
   ```

---

## 8. API Reference

### 8.1 MQTT Topics

#### Device Measurements
```
te/device/{device_id}///m/
```

#### Device Events
```
te/device/{device_id}///e/{event_type}
```

#### Device Alarms
```
te/device/{device_id}///a/{alarm_type}
```

#### Configuration
```
te/device/{device_id}///config/{operation}
```

### 8.2 Web UI REST API

The webserver exposes a REST API on port 8888 (proxied to `/thin-edge-io/api/` by ctrlX Caddyfile):

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/status` | All | Service status |
| GET | `/api/config` | All | Current tedge configuration |
| POST | `/api/config/c8y` | Editor+ | Save Cumulocity configuration |
| POST | `/api/config/aws` | Editor+ | Save AWS configuration |
| POST | `/api/config/az` | Editor+ | Save Azure configuration |
| POST | `/api/config/device` | Editor+ | Save device configuration |
| GET | `/api/device-id` | All | Get device ID |
| POST | `/api/device-id` | Editor+ | Set device ID |
| POST | `/api/device-id/recreate` | Admin | Recreate certificate |
| POST | `/api/device-id/create-auto` | Admin | Auto-create certificate |
| GET | `/api/device-id/cert-info` | All | Certificate details |
| POST | `/api/connect/{cloud}` | Admin | Connect to cloud |
| POST | `/api/disconnect/{cloud}` | Admin | Disconnect from cloud |
| POST | `/api/reconnect/{cloud}` | Admin | Reconnect to cloud |
| POST | `/api/cert/upload/c8y` | Admin | Upload cert to Cumulocity |
| POST | `/api/test-message` | Editor+ | Publish test MQTT message |
| GET | `/api/logs` | All | Fetch service logs |
| GET | `/api/tedge-config-list` | All | Full `tedge config list` output |
| GET | `/api/build-info` | All | Build and version information |
| GET | `/api/me` | All | Current user and role |
| POST | `/api/restart` | Admin | Restart all services |
| POST | `/api/restart-service` | Admin | Restart single service |
| POST | `/api/set-mqtt-port` | Admin | Set `c8y.mqtt.port` (8883/9883) |
| GET | `/api/datalayer/status` | All | Data Layer bridge status |
| GET | `/api/datalayer/config` | All | Data Layer bridge configuration |
| POST | `/api/datalayer/config` | Editor+ | Save Data Layer configuration |
| GET | `/api/datalayer/mappings` | All | List MQTT ↔ Data Layer mappings |
| POST | `/api/datalayer/mappings` | Editor+ | Save all mappings |
| POST | `/api/datalayer/mappings/add` | Editor+ | Add a mapping |
| DELETE | `/api/datalayer/mappings/{id}` | Admin | Delete a mapping |
| GET | `/api/datalayer/browse` | All | Browse Data Layer nodes |
| GET | `/api/datalayer/node` | All | Read a Data Layer node value |

---

## 9. Security

### 9.1 Authentication

- Certificate-based device authentication
- TLS encryption for all cloud connections
- No plaintext credentials stored

### 9.2 Network Security

- All cloud connections use TLS 1.2+
- MQTT cloud connections use port 8883 (encrypted)
- Local MQTT broker (port 1883) bound to 127.0.0.1 only
- Web UI (port 8888) accessible only via ctrlX Caddyfile proxy — not directly exposed
- ctrlX Bearer Token authentication enforced for all Web UI access
- Role-based access control: Viewer / Editor / Admin scopes

### 9.3 Snap Confinement

- Strict snap confinement enabled
- Minimal required permissions
- Process isolation
- No root privileges required

### 9.4 Best Practices

1. Use unique device IDs
2. Rotate certificates regularly
3. Monitor connection logs
4. Keep app updated
5. Use strong passwords for cloud platforms

---

## 10. Support

### 10.1 Documentation

- Online Docs: https://thin-edge.github.io/thin-edge.io/
- GitHub: https://github.com/thin-edge/thin-edge.io

### 10.2 Community Support

- Discord: https://discord.com/invite/sVX3B8nj5d
- GitHub Issues: https://github.com/thin-edge/thin-edge.io/issues

### 10.3 Contact

- Email: info@thin-edge.io
- Website: https://thin-edge.io

---

**End of Manual**
