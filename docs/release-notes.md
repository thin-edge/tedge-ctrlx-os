# Release Notes — thin-edge.io for ctrlX AUTOMATION

---

## Version 0.1.17 — May 2026

### Improvements
- **Service registration**: `tedge-mapper-bridge-c8y` (the internal MQTT bridge sub-service of `tedge-mapper-c8y`) is now registered as a service entity in Cumulocity so it appears in the Services tab.
- **Service status accuracy**: On-demand plugins (`tedge-file-config-plugin`, `c8y-remote-access-plugin`) now report status `unknown` instead of `down` — they are not persistent daemons but are invoked on demand by `tedge-agent`.
- **Flow versions**: ctrlX flow scripts (`c8y/ctrlx-alarms`, `c8y/ctrlx-events`, `c8y/ctrlx-measurements`) now report version `0.1.0` in the Cumulocity software inventory (previously `0.0.0`).
- **Code quality**: Extracted `tedge_config_get()` helper in bridge service; extracted `toggle_mapper()` helper in web server to eliminate three identical snapctl start/stop blocks. No behavior change; 85 fewer lines.

---

## Version 0.1.16 — May 2026

### Changes
- Renamed the datalayer mapping toggle label from `datalayer.enabled` to **"Enable Mapping"** in the web UI (both English and German locale).

---

## Version 0.1.15 — May 2026

### Bug Fixes
- Refactored periodic service registration into a proper background `tokio::spawn` task — no longer blocks startup.
- Fixed `rustfmt` formatting issues in `web-server-rust/src/main.rs` that caused CI build failures.

---

## Version 0.1.14 — May 2026

### Changes
- Translated all German comments, strings, and section headers to English across `web-server-rust/src/main.rs`, `snap/snapcraft.yaml`, and `snap/hooks/install`.

---

## Version 0.1.13 — May 2026

### Bug Fixes
- Increased initial service-registration delay from 15 s to 30 s to avoid a race condition with `tedge-agent` / `tedge-mapper-c8y` startup that wiped retained MQTT registration messages.

---

## Version 0.1.12 — May 2026

### Bug Fixes
- Fixed clippy `single-component-path-imports` lint (`use serde_json` → `use serde_json::json`).
- Extended periodic service registration to cover all 12 snap services (previously only a subset was registered).

---

## Version 0.1.11 — May 2026

### Bug Fixes
- Fixed `rustfmt` and `clippy` CI failures introduced in 0.1.10; no functional changes.

---

## Version 0.1.10 — May 2026

### New Features
- Added **journald log types** for all snap services: `tedge-agent::journald`, `tedge-mapper-c8y::journald`, `tedge-mapper-aws::journald`, `tedge-mapper-az::journald`, `tedge-datalayer-bridge::journald`, `mosquitto::journald`, `webserver::journald`, `tedge-watchdog::journald`.
- Periodic service re-registration (every 5 minutes) so services remain visible in the Cumulocity Services tab after `tedge-agent` or `tedge-mapper-c8y` restart.

---

## Version 0.1.9 — May 2026

### Bug Fixes
- Registered log plugins in `usr/share/tedge/log-plugins` so custom log types are correctly discovered by `tedge-agent`.

---

## Version 0.1.8 — May 2026

### Bug Fixes
- Fixed Settings tile not being clickable in ctrlX OS sidebar.

---

## Version 0.1.7 — May 2026

### New Features
- Added **Home screen tile** to the ctrlX OS sidebar.
- Fixed Settings tile display and link in ctrlX OS.

---

## Version 0.1.6 — May 2026

### Bug Fixes
- Shortened log type names in the Cumulocity log upload dropdown to avoid truncation.

---

## Version 0.1.5 — May 2026

### Bug Fixes
- Fixed: health status for all services was not published in the `post-refresh` snap hook, causing stale service states after snap updates.

---

## Version 0.1.4 — May 2026

### Bug Fixes
- Fixed button styling issues in the web UI.
- Fixed MQTT port toggle (8883 ↔ 9883).
- Fixed log retrieval via `journalctl` for snap-confined services.
- Replaced blocking `std::process::Command` with `tokio::process::Command` in all async web-server handlers to prevent 408 timeouts under load.

---

## Version 0.1.1 — May 2026

### Bug Fixes
- Fixed: services registered without `"type": "service"` field did not appear in the Cumulocity Services tab. All service entity registrations now include the required field.

---

## Version 0.1.0 — May 2026

First formal release of the `ctrlx-cumulocity-thin-edge-io` snap.

Packages **thin-edge.io v2.0.0** for Bosch Rexroth ctrlX CORE and ctrlX COREvirtual.

---

### What's Included

#### Core Services (thin-edge.io v2.0.0)
- `mosquitto` — local MQTT broker (127.0.0.1:1883)
- `tedge-agent` — device management agent
- `tedge-mapper-c8y` / `tedge-mapper-aws` / `tedge-mapper-az` — cloud protocol mappers
- `tedge-watchdog` — service health monitoring and automatic recovery

#### Plugins
- `c8y-remote-access-plugin` — Cumulocity Remote Access (SSH/VNC via Cloud Remote Access); auto-registered at snap startup
- `c8y-firmware-plugin` — Cumulocity firmware management
- `tedge-file-config-plugin` — remote configuration file management
- `tedge-snap-plugin` — reports installed snaps to Cumulocity software inventory (read-only)

#### Custom Services
- `webserver` — Actix-Web REST API + web UI at `/thin-edge-io/`; ctrlX Bearer Token authentication with RBAC (rwx / rw / r scopes)
- `tedge-datalayer-bridge` — polls ctrlX Data Layer nodes and publishes measurements/events/alarms to MQTT
- `tedge-log-upload-manager` — coordinates log file uploads to cloud platforms

---

### Web UI

Full-featured browser-based configuration dashboard accessible via ctrlX sidebar:

| Section | Key Features |
|---------|-------------|
| Connection Status | Live service and cloud bridge state |
| Cloud Configuration | Cumulocity IoT / AWS IoT / Azure IoT endpoints + mapper toggles |
| Device & Certificate | Self-signed or CA-signed cert mode; Renew + Upload Certificate (C8y) |
| Connect Device | Connect/Reconnect/Disconnect per cloud; MQTT port toggle (8883 / 9883) |
| Logs & Diagnostics | Live log viewer per service, log level control, diagnostics upload |
| Tedge Configuration | `tedge config list` / `--all` / `--doc`, `tedge bridge inspect c8y` |
| Flows | Script-based MQTT processing pipeline editor (flow.toml + .js files) |
| Snap Configuration Files | In-browser editor for tedge.toml, mosquitto.conf, inventory.json, etc. |
| ctrlX Data Points (Datalayer) | Datalayer bridge config, node browser, mapping form (datalayer + flow mode) |
| ctrlX Licensing | License capability table from ctrlX License Manager API |
| System Information | Snap version, build number, architecture |

---

### ctrlX Data Layer Bridge

- Polls Data Layer nodes at configurable interval (default 5 000 ms)
- Supports transform types: `raw`, `measurement`, `event`, `alarm`
- Automatic `externalId` injection for `c8y/mqtt/out/` topics (Cumulocity MQTT Service, port 9883)
- Automatic UTC timestamp (`"time"`) in measurement payloads
- Multiple mappings per MQTT topic (identified by UUID)
- **Flow mode** for mappings: routes Data Layer values through a thin-edge.io flow script before publishing

---

### ctrlX Flows

New section for managing thin-edge.io **flow scripts**:
- Per-mapper flow directories (`c8y`, `aws`, `az`)
- File editor for `.js`, `.toml`, `.toml.template` files
- Archive / restore flows
- Full REST API (`GET/POST/DELETE /api/flows/...`)

---

### Security
- Strict snap confinement — no root privileges required
- All web UI access via ctrlX Bearer Token (passed by Caddyfile reverse proxy)
- RBAC scopes: `thin-edge-io.rwx` (admin), `thin-edge-io.rw` (editor), `thin-edge-io.r` (viewer)
- All cloud connections use TLS 1.2+; certificate-based device authentication (X.509)
- Local MQTT broker bound to 127.0.0.1:1883 only
- Web server bound to 127.0.0.1:8888 only (proxied via ctrlX Caddy)
- ctrlX license acquired and periodically re-checked via Unix socket; warning banner shown when license is missing

---

### Known Limitations

See [roadmap.md](roadmap.md) for the full list of not-yet-implemented features.

Notable limitations in this release:
- MQTT Service mode (port 9883): device → cloud telemetry only; cloud → device operations (software update, config management, remote access) require Core MQTT (port 8883)
- Cumulocity snap install/remove not supported (read-only software inventory)
- Certificate upload only implemented for Cumulocity IoT (not AWS / Azure)
- Data Layer write direction (`tedge → Datalayer`) not yet implemented in bridge

---

### Bug Fixes (since internal versions)

- Fixed `mqtt.client.port` incorrectly set to 8883/9883 — install hook now always resets to 1883
- Fixed mapping lookup by UUID instead of topic string (multiple mappings per topic now work correctly)
- Fixed `reload_config()` overwriting runtime values (`device_external_id`, `mqtt_service_enabled`) on each poll cycle
- Fixed missing `#action-buttons-self` in web UI — Upload Certificate and Renew buttons now visible in self-signed mode
- Fixed ctrlX Data Layer browse returning 404 when path is empty

---

### Upgrade Notes

This is the first formal release. No upgrade path from earlier internal/development builds.

**Re-install note**: If a previous installation incorrectly set `mqtt.client.port` to 8883 or 9883, the install hook resets it to 1883 automatically.
