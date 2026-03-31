# Architecture Overview: thin-edge.io for ctrlX AUTOMATION

**App Name**: thin-edge.io  
**Version**: 1.7.1  
**Date**: March 2026  

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ctrlX CORE Device                             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  thin-edge.io App (Snap)                       │  │
│  │                                                                 │  │
│  │  ┌─────────────┐      ┌──────────────┐   ┌─────────────────┐ │  │
│  │  │ tedge-agent │◄────►│ tedge-mapper │   │    webserver    │ │  │
│  │  │             │      │ (c8y/aws/az) │   │  (Actix-Web)   │ │  │
│  │  └─────────────┘      └──────────────┘   └────────┬────────┘ │  │
│  │         ▲                    ▲                      │ HTTP     │  │
│  │         │ MQTT (1883)        │                      │ :8888    │  │
│  │         ▼                    │            ┌─────────▼────────┐ │  │
│  │  ┌─────────────┐      ┌──────┴───────┐   │  ctrlX Caddyfile │ │  │
│  │  │   Plugins   │      │   watchdog   │   │  Bearer Token    │ │  │
│  │  │ (5 plugins) │      │  (wrapper)   │   │  RBAC Proxy      │ │  │
│  │  └─────────────┘      └──────────────┘   └──────────────────┘ │  │
│  │         ▲                                                        │  │
│  │         │                                                        │  │
│  │  ┌──────┴──────────────────────────────────────────────────┐   │  │
│  │  │              mosquitto (local MQTT, :1883)               │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │         ▲                                                        │  │
│  │         │                                                        │  │
│  │  ┌──────┴──────────────┐   ┌──────────────────────────────┐    │  │
│  │  │ tedge-datalayer-    │   │   tedge-log-upload-manager   │    │  │
│  │  │ bridge              │   │                               │    │  │
│  │  └──────┬──────────────┘   └──────────────────────────────┘    │  │
│  │         │ ctrlX Data Layer API                                  │  │
│  │  ┌──────▼──────────────────────────────────────────────────┐   │  │
│  │  │         Data Storage & Configuration                     │   │  │
│  │  │    $SNAP_DATA/tedge  ($SNAP_COMMON/tedge)               │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│         ▲                              ▲                              │
│         │ TLS MQTT (8883), HTTPS (443) │ ctrlX Data Layer             │
│         ▼                              ▼                              │
└─────────────────────────────────────────────────────────────────────┘
          │
          │ Internet
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Cloud IoT Platform                             │
│          (Cumulocity IoT / AWS IoT / Azure IoT Hub)                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Overview

### 2.1 Core Components

| Component | Type | Purpose | Auto-Start |
|-----------|------|---------|------------|
| mosquitto | Service | Local MQTT broker (port 1883) | Yes |
| tedge | CLI | Configuration and management tool | No (on-demand) |
| tedge-agent | Service | Device management operations | Yes |
| tedge-mapper-c8y | Service | Cumulocity protocol translation | Conditional |
| tedge-mapper-aws | Service | AWS IoT protocol translation | Conditional |
| tedge-mapper-az | Service | Azure IoT protocol translation | Conditional |
| tedge-watchdog | Service | Health monitoring (wrapper script) | Yes |
| webserver | Service | Configuration Web UI with RBAC (port 8888) | Yes |
| tedge-datalayer-bridge | Service | ctrlX Data Layer ↔ MQTT bridge | Yes |
| tedge-log-upload-manager | Service | Log upload coordination | Yes |
| setup-directories | Service (oneshot) | Directory initialization at snap start | Yes |

### 2.2 Plugins

| Plugin | Purpose | Trigger |
|--------|---------|---------|
| c8y-firmware-plugin | Firmware updates via Cumulocity | On-demand |
| c8y-remote-access-plugin | Remote SSH/VNC access | On-demand |
| tedge-apt-plugin | APT package management | On-demand |
| tedge-file-config-plugin | Configuration file operations | On-demand |
| tedge-file-log-plugin | Log file collection | On-demand |

---

## 3. Communication Paths

### 3.1 Internal Communication

```
tedge-agent ──► MQTT (1883) ──► mosquitto ──► tedge-mapper ──► Cloud (8883)
     │                               ▲
     └──► IPC ──► Plugins            │
                               tedge-datalayer-bridge ──► ctrlX Data Layer

webserver (port 8888) ──► Caddyfile proxy ──► ctrlX sidebar
     │
     └──► spawns: tedge CLI, snapctl, journalctl
```

**Protocols**:
- MQTT (local broker, port 1883)
- HTTP REST API (webserver, port 8888, proxied via Caddyfile)
- ctrlX Data Layer API (datalayer-bridge)
- Unix Domain Sockets (IPC)

### 3.2 External Communication

#### Outbound Only:
- **MQTT/TLS** → Port 8883 → Cloud MQTT broker
- **HTTPS** → Port 443 → Cloud REST APIs

#### No Inbound:
- App does not accept external connections
- All management via local CLI or internal API

---

## 4. Data Flow

### 4.1 Telemetry Flow

```
Local Data Source
      │
      ▼
tedge-agent (collects)
      │
      ▼
MQTT Topic (te/device/main///m/)
      │
      ▼
tedge-mapper (translates)
      │
      ▼
Cloud Platform (TLS encrypted)
```

### 4.2 Command Flow

```
Cloud Platform
      │
      ▼
tedge-mapper (receives via MQTT/TLS)
      │
      ▼
MQTT Topic (te/device/main///cmd/)
      │
      ▼
tedge-agent (executes)
      │
      ▼
Plugin (performs operation)
      │
      ▼
Response → tedge-agent → tedge-mapper → Cloud
```

---

## 5. Configuration and Data Storage

### 5.1 Configuration

**Location**: `$SNAP_DATA/tedge/config/`

Files:
- `tedge.toml` - Main configuration
- `system.toml` - System settings

**Web UI / Bridge config** (in `$SNAP_DATA`):
- `tedge-web-config.json` - Webserver runtime configuration
- `datalayer-mappings.json` - MQTT ↔ Data Layer path mappings

**Persistence**: Survives app updates and reboots

### 5.2 Data Storage

| Type | Location | Persistence |
|------|----------|-------------|
| Config | $SNAP_DATA/tedge/config/ | Permanent |
| Certificates | $SNAP_DATA/tedge/device-certs/ | Permanent |
| Logs | $SNAP_COMMON/tedge/log/ | Rotated |
| Cache | $SNAP_COMMON/tedge/cache/ | Temporary |
| IPC Sockets | $SNAP_DATA/tedge/ipc/ | Runtime only |

### 5.3 Configuration Parameters

Key settings managed via `tedge config`:
- Cloud platform URLs (c8y.url, aws.url, az.url)
- Device identity (device.id)
- MQTT settings (qos, keepalive)
- HTTP timeouts
- Log levels

---

## 6. Security Architecture

### 6.1 Snap Confinement

**Confinement Mode**: Strict

**Interfaces Used**:
- `network` - Required for cloud connectivity
- `network-bind` - Required for internal HTTP API and local MQTT broker
- `system-observe` - For health monitoring (agent, watchdog)
- `log-observe` - For reading service logs via journalctl/snapctl (agent, log-upload-manager, webserver)
- `hardware-observe` - For reading device serial number via DMI (webserver, tedge CLI)
- `mount-observe` - For disk usage information (webserver)
- `removable-media` - For external config/logs (tedge CLI)
- `datalayer` - ctrlX Data Layer slot (tedge-datalayer-bridge)

### 6.2 Authentication & Encryption

```
Device ──► X.509 Certificate ──► Cloud Platform
         └─► TLS 1.2+ ──────────► Encrypted Channel
```

**Certificate Management**:
- Self-signed device certificates generated locally
- Public key uploaded to cloud
- Private key never leaves device
- Stored in `$SNAP_DATA` with restricted permissions

### 6.3 Network Security

**Outbound Only (cloud)**:
- Port 8883 (MQTT/TLS to cloud)
- Port 443 (HTTPS to cloud REST APIs)

**Internal Only**:
- Port 1883 (local Mosquitto, bound to 127.0.0.1)
- Port 8888 (webserver, proxied via ctrlX Caddyfile — not directly exposed)

**No Direct Inbound**: All external web access is proxied through the ctrlX Caddyfile with Bearer Token validation and RBAC

---

## 7. Typical Usage Scenario

### 7.1 Standard Deployment

1. **Installation**
   - User installs snap via ctrlX web interface
   - Services remain inactive until configured

2. **Configuration**
   - User runs `tedge config set` commands
   - Creates device certificate
   - Registers device in cloud platform

3. **Connection**
   - User runs `tedge connect c8y|aws|az`
   - Appropriate mapper service starts
   - Agent and watchdog start
   - Connection established to cloud

4. **Operation**
   - Device sends telemetry periodically
   - Cloud can send commands
   - Plugins handle software/config operations
   - Watchdog monitors health

5. **Monitoring**
   - User checks status via `snap services`
   - Views logs via `snap logs`
   - Monitors health in cloud platform

### 7.2 Data Flow Example: Temperature Monitoring

```
1. Local sensor ─► temperature reading
                    │
2. tedge-agent  ◄───┘ (receives via custom integration)
                    │
3. Publishes to ───► te/device/main///m/
                    {"temperature": 23.5}
                    │
4. tedge-mapper ◄───┘ (subscribes to topic)
                    │
5. Translates to ───► Cloud-specific format
                    (Cumulocity measurement)
                    │
6. MQTT/TLS    ───────► Port 8883
                    │
7. Cloud receives ◄──┘ measurement
```

---

## 8. Resource Consumption

### 8.1 Expected Resource Usage

**Under Normal Load** (1 measurement/second):
- **RAM**: 50-100 MB total
  - tedge-agent: ~30 MB
  - tedge-mapper: ~25 MB
  - tedge-watchdog: ~15 MB
  - Plugins: on-demand only
- **CPU**: <5% average, <20% during bursts
- **Storage**: ~100 MB app, ~50 MB data/config/logs
- **Network**: <10 KB/s average

**Peak Load** (1000 measurements/minute):
- **RAM**: 100-150 MB
- **CPU**: 10-20% average
- **Network**: 50-100 KB/s

### 8.2 Read/Write Operations

**File System**:
- Config: Read on startup, write on `tedge config set`
- Logs: Append-only, rotated daily
- Cache: Write for buffering during network issues
- Certificates: Read on startup, write on cert creation

**Network**:
- Continuous MQTT connection (keepalive every 60s)
- Data transmission: on-demand based on telemetry frequency
- HTTP API: occasional local requests only

---

## 9. Task Scheduling

### 9.1 Service Tasks

| Service | Frequency | Priority |
|---------|-----------|----------|
| tedge-agent | Continuous | Normal |
| tedge-mapper | Continuous | Normal |
| tedge-watchdog | Every 60s check | Low |
| Log rotation | Daily | Low |

### 9.2 Real-Time Requirements

**No hard real-time requirements**:
- All services run in user-space
- No real-time kernel integration needed
- Soft real-time acceptable for telemetry (<1s latency)

---

## 10. Integration with ctrlX

### 10.1 Current Integration

✅ **Implemented**:
- Standard snap packaging (Strict Confinement)
- ctrlX App Store compatible
- Follows ctrlX security model (snap confinement)
- **ctrlX Web UI** — accessible via ctrlX sidebar under `thin-edge-io`
- **ctrlX Authentication** — Caddyfile reverse proxy with Bearer Token validation and scope-based RBAC (Admin/Editor/Viewer)
- **ctrlX Data Layer** — `tedge-datalayer-bridge` maps MQTT telemetry into Data Layer nodes
- **ctrlX package-manifest** — proxyMapping, scopes-declaration, FOSS compliance

### 10.2 Future Integration (Roadmap)

🔄 **Planned**:
- ctrlX License Management
- Enhanced ctrlX Diagnostics/Logbook integration

---

## 11. Failure Handling

### 11.1 Automatic Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Service crash | Snap daemon | Auto-restart (10s delay) |
| Network loss | MQTT keepalive | Reconnect with backoff |
| Cloud disconnect | Mapper timeout | Buffer data, reconnect |
| Config error | Validation on load | Log error, use defaults |

### 11.2 Health Monitoring

**tedge-watchdog** monitors:
- Service process status
- MQTT connection status
- Memory usage
- Disk space

**Actions on failure**:
- Log warning
- Attempt service restart
- Alert via cloud if connection available

---

## 12. Dependencies

### 12.1 System Dependencies

- Ubuntu Core 22 / core22 (base snap)
- Snapd (snap runtime)
- Network stack (Linux kernel)
- Certificate store (ca-certificates)

### 12.2 External Dependencies

- Cloud platform (Cumulocity/AWS/Azure)
- Internet connectivity
- DNS resolution
- NTP for time synchronization (recommended)
- ctrlX OS 1.20+ for full Web UI / Auth integration

### 12.3 No Dependencies On

- External MQTT broker (Mosquitto is bundled)
- Database server (embedded SQLite if needed)
- Other ctrlX apps

---

## 13. Extensibility

### 13.1 Plugin Architecture

Plugins are standalone binaries that:
- Communicate via MQTT topics
- Receive commands from agent
- Execute operations (install, config, logs)
- Report results back to agent

### 13.2 Custom Plugins

Users can add custom plugins:
- Build binary that follows thin-edge.io plugin protocol
- Add to snap in custom build
- Configure agent to recognize new plugin

---

## 14. Testing

### 14.1 Test Coverage

Component testing:
- Unit tests for core components
- Integration tests for mappers
- E2E tests with cloud platforms

### 14.2 Typical Test Scenario

See `test-setup-description.md` for complete test plan.

Key tests:
1. Installation and configuration
2. Cloud connectivity (all 3 platforms)
3. Data transmission
4. Command reception
5. Plugin execution
6. Failure recovery
7. Resource usage
8. Security validation

---

## 15. Compliance

### 15.1 Security

- Strict snap confinement
- TLS-only cloud connections
- Certificate-based authentication
- No hardcoded credentials
- Minimal permissions

### 15.2 Open Source

- Apache 2.0 license
- All dependencies properly attributed
- Source code available on GitHub
- FOSS compliance documentation provided

---

## 16. Limitations

### 16.1 Known Limitations

1. **Single Device**: One device identity per installation
2. **No Hardware Integration**: No direct PLC/motion control access
3. **No ctrlX License Management**: License enforcement not yet integrated

### 16.2 Workarounds

1. Install multiple snap instances for multiple device identities (not recommended)
2. Use MQTT or HTTP for hardware/PLC integration

---

## 17. Version History

- **v1.7.1** (Mar 2026): ctrlX AUTOMATION release with Web UI, ctrlX Auth, Data Layer bridge

---

**Document prepared for**: ctrlX AUTOMATION App Validation  
**Contact**: info@thin-edge.io  
**Source**: https://github.com/thin-edge/thin-edge.io
