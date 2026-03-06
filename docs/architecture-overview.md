# Architecture Overview: thin-edge.io for ctrlX AUTOMATION

**App Name**: thin-edge.io  
**Version**: 1.7.1  
**Date**: February 2026  

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    ctrlX CORE Device                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              thin-edge.io App (Snap)                    │   │
│  │                                                          │   │
│  │  ┌──────────────┐         ┌──────────────┐            │   │
│  │  │ tedge-agent  │◄───────►│ tedge-mapper │            │   │
│  │  │              │         │  (c8y/aws/az)│            │   │
│  │  └──────────────┘         └──────────────┘            │   │
│  │         ▲                        ▲                      │   │
│  │         │                        │                      │   │
│  │         ▼                        ▼                      │   │
│  │  ┌──────────────┐         ┌──────────────┐            │   │
│  │  │   Plugins    │         │  watchdog    │            │   │
│  │  │  (5 plugins) │         │              │            │   │
│  │  └──────────────┘         └──────────────┘            │   │
│  │                                                          │   │
│  │         ▲                                                │   │
│  │         │ MQTT / HTTP / IPC                            │   │
│  │         ▼                                                │   │
│  │  ┌──────────────────────────────────────────────┐     │   │
│  │  │         Data Storage & Configuration          │     │   │
│  │  │    $SNAP_DATA/tedge  ($SNAP_COMMON/tedge)    │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│         ▲                                                        │
│         │ TLS (8883), HTTPS (443)                              │
│         ▼                                                        │
└────────────────────────────────────────────────────────────────┘
                          │
                          │ Internet
                          ▼
┌────────────────────────────────────────────────────────────────┐
│              Cloud IoT Platform                                 │
│     (Cumulocity IoT / AWS IoT / Azure IoT Hub)                │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Overview

### 2.1 Core Components

| Component | Type | Purpose | Auto-Start |
|-----------|------|---------|------------|
| tedge | CLI | Configuration and management tool | No (on-demand) |
| tedge-agent | Service | Device management operations | Yes |
| tedge-mapper-c8y | Service | Cumulocity protocol translation | Conditional |
| tedge-mapper-aws | Service | AWS IoT protocol translation | Conditional |
| tedge-mapper-az | Service | Azure IoT protocol translation | Conditional |
| tedge-watchdog | Service | Health monitoring | Yes |

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
tedge-agent ──► IPC/MQTT ──► tedge-mapper ──► Cloud
     │
     └──► HTTP API (port 8000, internal only)
     │
     └──► IPC ──► Plugins
```

**Protocols**:
- MQTT (internal broker or external)
- HTTP REST API (internal, port 8000)
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
- `network-bind` - Required for internal HTTP API
- `network-control` - For advanced network config (agent only)
- `system-observe` - For health monitoring (agent, watchdog)
- `home` - Optional, for CLI convenience
- `removable-media` - Optional, for external config/logs

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

**Outbound Only**:
- Port 8883 (MQTT/TLS)
- Port 443 (HTTPS)

**No Inbound Ports**: App does not listen on external network

**Internal API**: Port 8000 only accessible within snap

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
- Standard snap packaging
- ctrlX App Store compatible
- Follows ctrlX security model (snap confinement)
- Works within ctrlX network environment

### 10.2 Future Integration (Roadmap)

🔄 **Planned**:
- ctrlX Data Layer integration
- ctrlX web UI integration
- ctrlX Identity Management
- ctrlX diagnostics/logbook integration
- ctrlX license management

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

- Ubuntu Core 24 (base snap)
- Snapd (snap runtime)
- Network stack (Linux kernel)
- Certificate store (ca-certificates)

### 12.2 External Dependencies

- Cloud platform (Cumulocity/AWS/Azure)
- Internet connectivity
- DNS resolution
- NTP for time synchronization (recommended)

### 12.3 No Dependencies On

- Local MQTT broker (built-in client)
- Database server (embedded SQLite if needed)
- Web server (built-in for API)
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

1. **No ctrlX Data Layer**: Direct integration not implemented
2. **No Web UI**: Configuration via CLI only
3. **Single Device**: One device identity per installation
4. **No Hardware Integration**: No direct PLC/motion control access

### 16.2 Workarounds

1. Use MQTT for data exchange with other apps
2. Use SSH/terminal for configuration
3. Install multiple snaps for multiple identities (not recommended)
4. Use MQTT or HTTP for hardware integration

---

## 17. Version History

- **v1.7.1** (Feb 2026): Initial ctrlX AUTOMATION release

---

**Document prepared for**: ctrlX AUTOMATION App Validation  
**Contact**: info@thin-edge.io  
**Source**: https://github.com/thin-edge/thin-edge.io
