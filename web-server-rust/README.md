# thin-edge.io Web Configuration Server (Rust)

Ein performanter Rust-basierter Webserver für die Konfiguration von thin-edge.io auf ctrlX AUTOMATION Systemen.

## 🚀 Features

- **Unix Socket Support** – Sichere Integration mit ctrlX Reverse Proxy
- **REST API** – Vollständige Konfigurations-API
- **Static File Serving** – HTML/CSS/JS UI (Bootstrap 4 + Cumulocity Design)
- **Zero Dependencies** – Single Binary, kein Python benötigt
- **Performant** – Schneller Start, geringer Memory-Footprint
- **Async** – Basiert auf actix-web und tokio
- **Rollenbasierter Zugriff** – Admin / Viewer über ctrlX Token

## 🏗️ Architektur

### Dependencies

| Crate       | Version | Zweck                      |
| ----------- | ------- | -------------------------- |
| actix-web   | 4.8.0   | Async Web-Framework        |
| actix-files | 0.6.6   | Static File Serving        |
| serde       | 1.0     | Serialisierung             |
| serde_json  | 1.0     | JSON (de)serialization     |
| tokio       | 1.40    | Async Runtime              |
| env_logger  | 0.11    | Logging                    |
| log         | 0.4     | Log-Makros                 |

### Rollen

| Rolle  | Rechte                              |
| ------ | ----------------------------------- |
| admin  | Lesen, Schreiben, Befehle ausführen |
| viewer | Nur Lesen                           |

---

## 📡 API Endpoints

Alle Endpunkte liegen unter `/thin-edge-io/api/`.

### `GET /api/status`
Service-Status abrufen.

```json
{
  "mosquitto": "running",
  "agent":     "running",
  "bridge":    "stopped",
  "c8y":       "stopped",
  "aws":       "stopped",
  "az":        "stopped"
}
```

### `GET /api/config`
Komplette Konfiguration abrufen.

```json
{
  "device": { "id": "48FC8D56-6F25-43B1-8DF6-380342AA3478", "type": "ctrlX-CORE" },
  "c8y":    { "c8y-url": "your-tenant.cumulocity.com", "tenant": "t10452223", "enabled": true },
  "aws":    { "aws-url": "xxxx.iot.us-east-1.amazonaws.com", "region": "us-east-1", "account": "123456789012", "enabled": false },
  "az":     { "azure-url": "your-hub.azure-devices.net", "enabled": false }
}
```

### `POST /api/config/c8y` — Admin
```json
{ "c8y-url": "your-tenant.cumulocity.com", "tenant": "t10452223", "enabled": true }
```

### `POST /api/config/aws` — Admin
```json
{ "aws-url": "xxxx.iot.us-east-1.amazonaws.com", "region": "us-east-1", "account": "123456789012", "enabled": true }
```

### `POST /api/config/az` — Admin
```json
{ "azure-url": "your-hub.azure-devices.net", "enabled": true }
```

### `POST /api/config/device` — Admin
```json
{ "id": "48FC8D56-6F25-43B1-8DF6-380342AA3478", "type": "ctrlX-CORE" }
```

### `GET /api/device-id`
```json
{ "current": "48FC8D56-...", "system_serial": "48FC8D56-...", "has_certificate": true }
```

### `POST /api/device-id` — Admin
```json
{ "device_id": "48FC8D56-6F25-43B1-8DF6-380342AA3478" }
```

### `GET /api/device-id/cert-info`
Zertifikatsdetails via `tedge cert show`. Timeout nach 15 s → HTTP 408.
```json
{ "success": true, "details": "Device certificate: CN=..., not before: ..., not after: ..." }
```

### `POST /api/connect/{cloud}` — Admin
Cloud-Verbindung herstellen (`tedge connect c8y|aws|az`).
```json
{ "success": true, "output": "Checking if ...\nRestart ..." }
```

### `POST /api/restart` — Admin
Thin-edge-Services neu starten.

### `GET /api/logs?service={name}&lines={n}`
Logs via `journalctl` abrufen.

| Parameter | Standard      | Beschreibung                  |
| --------- | ------------- | ----------------------------- |
| `service` | `tedge-agent` | Servicename                   |
| `lines`   | `100`         | Anzahl der letzten Log-Zeilen |

Verfügbare Services: `tedge-agent`, `tedge-mapper-c8y`, `tedge-mapper-aws`, `tedge-mapper-az`, `mosquitto`, `webserver`

### `GET /api/log-level?service={name}`
Aktuellen Log-Level eines Services abrufen.

### `POST /api/log-level` — Admin
```json
{ "service": "tedge-agent", "level": "debug" }
```

### `GET /api/me`
```json
{ "user": "boschrexroth", "role": "admin" }
```

### `GET /login?token={jwt}`
Token-Login (Redirect auf Hauptseite mit Session-Cookie).

---

## 🗂️ Dateistruktur

```
web-server-rust/
├── Cargo.toml
├── src/
│   └── main.rs         # Webserver-Implementierung (~1460 Zeilen)
├── www/
│   ├── index.html      # Haupt-UI
│   ├── app.js          # Frontend-Logik
│   ├── styles.css      # Bootstrap 4 + Cumulocity-Palette
│   └── icon.svg        # App-Icon
└── README.md
```

---

## 🔧 Entwicklung

### Lokaler Build
```bash
cd web-server-rust
cargo build --release
```

### Lokaler Test
```bash
# Server startet auf http://localhost:8888
cargo run
```

### Snap bauen
```bash
./build-snap-amd64.sh   # amd64
./build-snap-arm64.sh   # arm64 (Cross-Compile)
```

---

## 📦 Snap Integration

```yaml
apps:
  webserver:
    command: scripts/webserver-wrapper.sh
    daemon: simple
    restart-condition: always
    plugs: [network, network-bind, log-observe]

parts:
  webserver:
    plugin: nil
    source: ./web-server-rust
    build-packages: [pkg-config, gcc-aarch64-linux-gnu]
```

---

## 🌐 Ports

Die Thin-Edge benötigt folgende Ports um mit den unterschiedlichen Cloud Providern zu kommunizieren, da hier unter Umständen eine Portweiterleitung von Nöten ist.

| Cloud      | Port            |
| ---------- | --------------- |
| Cumulocity | 443, 8883, 9883 |
| Amazon AWS | 8883            |
| Azure      | 8883            |

---

## 🔒 Sicherheit

- **Unix Socket Only** – Nicht direkt von außen erreichbar
- **ctrlX Reverse Proxy** – JWT-Token-basierte Authentifizierung
- **Rollenbasierter Zugriff** – Viewer kann nur lesen, Admin kann konfigurieren und verbinden
- **Timeout-Schutz** – Alle externen Prozessaufrufe mit 15 s Timeout

---

## 📊 Performance

| Metrik         | Wert             |
| -------------- | ---------------- |
| Binary-Größe   | ~4 MB (stripped) |
| Startup Zeit   | < 100 ms         |
| Memory (idle)  | ~8 MB            |
| Memory (aktiv) | ~12 MB           |

---

## 🧪 Testing

```bash
cargo test
RUST_LOG=debug cargo run

curl http://localhost:8888/api/status
curl http://localhost:8888/api/config
curl http://localhost:8888/api/me
curl http://localhost:8888/api/device-id
```

---

## 📝 Logging

```bash
RUST_LOG=debug   # Ausführliches Logging
RUST_LOG=info    # Standard (default)
RUST_LOG=warn    # Nur Warnungen
RUST_LOG=error   # Nur Fehler
```

Logs in Snap-Umgebung:
```bash
snap logs thin-edge-io.webserver -f
```

---

## 📄 Lizenz

Apache-2.0 (wie thin-edge.io)
