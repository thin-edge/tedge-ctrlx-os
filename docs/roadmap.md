# Roadmap — Not Yet Implemented Features

This document describes features of **thin-edge.io** and the **ctrlX AUTOMATION** platform that are not yet implemented or only partially supported in the current app version (2.0.0).

---

## 1. Cumulocity IoT — Unsupported Features

### 1.1 SmartREST over MQTT Service (Port 9883)

**Status**: ⚠️ Partial  
**Affects**: `MQTT Service` mode (Port 9883)

The MQTT Service mode (port 9883) does **not support SmartREST operations**. Incoming cloud commands (e.g. software updates, configuration changes, remote access) are not processed in 9883 mode.

Supported direction: **Device → Cloud** (Telemetry: Measurements, Events, Alarms)  
Not supported: **Cloud → Device** (Operations: Software Updates, Config Management, Remote Access, Shell)

**Workaround**: Use Core MQTT (port 8883) for device management operations.

---

### 1.2 Cumulocity Child Device Support

**Status**: ❌ Not implemented  
**thin-edge.io capability**: available (since v1.0)

thin-edge.io supports registering **child devices** — e.g. connected sensors or downstream devices — under the main device in Cumulocity. These appear as separately manageable devices in the Cumulocity hierarchy.

The current app only publishes data for the **main device** (`te/device/main/`). Child device mappings via the Data Layer Bridge are not supported.

**Relevant for**: multi-sensor setups, fieldbuses, OPC-UA proxying

---

### 1.3 Cumulocity Services (te/device/main/service/)

**Status**: ❌ Not implemented  
**thin-edge.io capability**: available (since v1.3)

thin-edge.io can register individual software components as **Cumulocity Services** (e.g. `te/device/main/service/webserver`), which can then be monitored separately in Cumulocity Device Management.

---

### 1.4 Cumulocity Operations — Shell / Remote Shell

**Status**: ❌ Not implemented  

The `c8y-remote-access-plugin` is included in the snap but is **not started automatically** and is not configurable via the web UI. SSH-based remote access via Cumulocity Cloud Remote Access has not been tested or enabled.

**Prerequisites for implementation**: SSH passthrough interface in the snap, ctrlX permissions for shell access.

---

### 1.5 Cumulocity Firmware Updates (OTA)

**Status**: ❌ Not implemented  

The `c8y-firmware-plugin` is present as a symlink to the `tedge` multicall binary. A firmware update workflow (Download → Verify → Apply → Report) is not integrated into the web UI and has not been tested on ctrlX OS.

---

### 1.6 Cumulocity Software Management (Snap Install/Remove)

**Status**: ⚠️ Read-only  

The `tedge-snap-plugin` reports installed snaps to the Cumulocity Software Inventory (**read-only**). Installing or removing snaps via Cumulocity is **not supported** (would require the `snapd-control` interface with elevated privileges).

---

### 1.7 Cumulocity Configuration Management (Upload/Download)

**Status**: ⚠️ Partial  

`tedge-file-config-plugin` is bundled and the configuration files listed in `tedge-configuration-plugin.toml` can be edited. However, **bidirectional config management** (cloud-initiated push/pull of configuration files) does not have a dedicated workflow view in the web UI.

---

### 1.8 Cumulocity Log File Upload via Cloud Operation

**Status**: ⚠️ Partial  

`tedge-log-upload-manager` handles self-initiated log uploads. Cloud-initiated log upload requests (Cumulocity Operation `c8y_LogfileRequest`) are processed by the service but are not exposed as a separate workflow view in the web UI.

---

## 2. AWS IoT / Azure IoT — Limited Support

### 2.1 AWS IoT Device Shadow

**Status**: ❌ No web UI  
**thin-edge.io capability**: available

`tedge-mapper-aws` supports AWS IoT Device Shadow (reported/desired state). The web UI does not provide a workflow for shadow configuration.

---

### 2.2 Azure IoT Device Twin

**Status**: ❌ No web UI  
**thin-edge.io capability**: available

`tedge-mapper-az` supports Azure IoT Hub Device Twins. The web UI has no view for desired/reported properties.

---

### 2.3 Certificate Upload for AWS / Azure

**Status**: ❌ Not implemented  

The **Upload Status** and certificate upload form in the web UI only supports **Cumulocity IoT**. For AWS IoT and Azure IoT, the device certificate must be registered manually in the respective cloud portal.

---

## 3. ctrlX Data Layer Bridge — Missing Features

### 3.1 Write Direction (tedge → Data Layer)

**Status**: ⚠️ Configurable in UI, backend not implemented  

The bridge logic (`datalayer.rs`) currently **only reads** from the Data Layer (polling). Writing MQTT payloads to Data Layer nodes (direction `tedge_to_dl`) is available as a mapping option in the UI but the corresponding code path is not implemented.

---

### 3.2 Subscribe Instead of Poll

**Status**: ❌ Not implemented  

The bridge polls Data Layer nodes periodically (default: 5000 ms). A **subscribe-based** architecture (value-change push from the Data Layer) would be significantly more efficient but is not yet implemented.

---

### 3.3 Multiple Data Layer Instances

**Status**: ❌ Not supported  

Only a single Data Layer base URL can be configured. Multiple Data Layer sources (e.g. external ctrlX CORE devices) are not supported.

---

### 3.4 Event-Based Mapping (Threshold / Filter)

**Status**: ❌ Not implemented  

Currently, measurements are published on **every** poll cycle regardless of whether the value has changed. Events and alarms are only published on value change. There is no configurable threshold filter (e.g. "only publish if value > X" or "only on change > 5%").

---

### 3.5 Batching / Aggregation

**Status**: ❌ Not implemented  

Each mapping value is published as an individual MQTT message. No batching of multiple measurements into a single message, and no time-window aggregation (Min/Max/Avg).

---

## 4. Web UI — Missing Features

### 4.1 Alarm Management View

**Status**: ❌ No web UI  

thin-edge.io can receive and forward alarms (via the Data Layer Bridge with transform `alarm`). However, there is no **alarm overview** in the web UI — no active alarm list, acknowledgement workflow, or alarm history log.

---

### 4.2 Audit Log / Activity Log

**Status**: ❌ Not implemented  

No logging of web UI actions (who pressed Connect, which configuration was saved, when). Only the system logs of individual services are accessible.

---

### 4.3 Internationalization — Incomplete

**Status**: ⚠️ Partial  

The i18n files (`meta/i18n/`) contain translations for German and English. Newer UI elements (Data Layer, Licensing, Payload Preview) are not yet fully translated into both languages. Some `data-i18n` keys are still missing.

---

### 4.4 MQTT Test Messages — No Cloud Confirmation

**Status**: ⚠️ Partial  

Test messages (Measurement, Event, Alarm) are published to MQTT via the REST API. There is no **delivery confirmation** from the cloud — only local publish success is reported.

---

### 4.5 Cloud Operation Queue View

**Status**: ❌ No web UI  

thin-edge.io internally manages a queue for incoming cloud operations. The status of pending, active, or failed operations is not visible in the web UI.

---

### 4.6 Simultaneous Multi-Cloud

**Status**: ⚠️ Limited  

Multiple mappers (c8y + aws + az) can theoretically be active at the same time. However, the web UI is designed for **one primary cloud provider**. There is no multi-cloud status overview or synchronized configuration.

---

## 5. Platform / Snap

### 5.1 TPM / Hardware Security Module

**Status**: ❌ Not implemented  

thin-edge.io supports PKCS#11 for HSM/TPM-based key storage (`tedge-p11-server` is included in the snap). Integration with ctrlX OS Secure Boot / TPM is not implemented.

---

### 5.2 Automatic Cloud Platform Detection

**Status**: ❌ Not implemented  

There is no automatic detection of the configured cloud platform at snap startup. The user must manually configure the active connection.

---

### 5.3 Offline Buffering / Store-and-Forward

**Status**: ❌ Not configurable  

thin-edge.io includes a built-in offline buffer module that queues messages during cloud connectivity loss. In the current app this functionality is neither configurable nor controllable via the web UI.

---

## Summary

| Feature | Category | Status |
|---------|----------|--------|
| SmartREST / Cloud→Device operations over port 9883 | Cumulocity | ⚠️ Not supported |
| Child Devices | Cumulocity | ❌ |
| Cumulocity Services | Cumulocity | ❌ |
| Remote Shell (c8y-remote-access-plugin) | Cumulocity | ❌ |
| Firmware OTA | Cumulocity | ⚠️ Plugin present, no UI |
| Snap install/remove via Cumulocity | Cumulocity | ⚠️ Read-only |
| Config management workflow | Cumulocity | ⚠️ Partial |
| Cloud-initiated log upload | Cumulocity | ⚠️ Partial |
| AWS Device Shadow | AWS IoT | ❌ No UI |
| Azure Device Twin | Azure IoT | ❌ No UI |
| Certificate upload for AWS/Azure | AWS/Azure | ❌ |
| Write direction (tedge→Data Layer) | Data Layer | ⚠️ UI present, no backend |
| Subscribe instead of poll | Data Layer | ❌ |
| Threshold/filter mapping | Data Layer | ❌ |
| Batching/aggregation | Data Layer | ❌ |
| Alarm management view | Web UI | ❌ |
| Audit log | Web UI | ❌ |
| Full i18n coverage | Web UI | ⚠️ Partial |
| Operation queue view | Web UI | ❌ |
| TPM/HSM (PKCS#11) | Platform | ❌ |
| Configurable offline buffering | Platform | ❌ |

**Legend**: ✅ Implemented · ⚠️ Partial / with limitations · ❌ Not implemented
