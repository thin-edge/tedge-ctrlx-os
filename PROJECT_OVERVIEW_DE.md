# thin-edge.io für ctrlX AUTOMATION - Projektübersicht

## Verzeichnisstruktur

```
thin-edge-io-app/
├── snap/
│   └── snapcraft.yaml          # Snap-Konfiguration mit allen Komponenten
│
├── configs/
│   ├── package-manifest.json   # CTRLX Package-Manifest (inkl. Proxy & Scopes)
│   ├── caddyfile               # Reverse-Proxy mit ctrlX Auth-Integration
│   └── build-info.txt          # Build-Metadaten
│
├── package-assets/
│   ├── package-manifest.json   # CTRLX Package-Manifest
│   ├── portlist-description.json        # Port-Konfiguration
│   ├── unixsocket-description.json      # Unix-Socket-Beschreibung
│   ├── slotplug-description.json        # Snap-Interface-Konfiguration
│   ├── fossinfo.json           # FOSS-Komponenten-Informationen
│   ├── foss-offer.txt          # FOSS-Quelltextangebot
│   ├── i18n/                   # Internationalisierung
│   ├── icons/                  # App-Icons
│   └── proxy/                  # Proxy-Konfigurationsdateien
│
├── web-server-rust/             # Konfigurations-Webserver (Rust/Actix-Web)
│   └── src/main.rs             # RBAC mit ctrlX-Rollenintegration
│
├── bridge-service-rust/         # ctrlX Data Layer Bridge + Log-Upload-Manager
│   └── src/                    # tedge-datalayer-bridge, tedge-log-upload-manager
│
├── web/www/                     # Web-UI (HTML/JS/CSS)
│   └── index.html, app.js, styles.css
│
├── scripts/                     # Alle Wrapper- und Hilfsskripte
│   ├── setup-config.sh         # Konfigurations-Hilfsskript
│   ├── mosquitto-wrapper.sh    # Mosquitto MQTT Broker Wrapper
│   ├── connect-wrapper.sh      # Snap-aware tedge connect/disconnect
│   ├── watchdog-wrapper.sh     # Health-Monitoring Wrapper
│   ├── webserver-wrapper.sh    # Webserver Starter
│   ├── tedge-service-wrapper.sh # Allgemeiner Service-Wrapper
│   ├── manage-device-id.sh     # Geräte-ID Verwaltung
│   ├── log-plugins/            # Log-Plugin-Skripte
│   ├── config-plugins/         # Config-Plugin-Skripte
│   └── sm-plugins/             # Software-Management-Plugins
│
├── docs/
│   ├── architecture-overview.md         # Architektur-Übersicht (für CTRLX-Validierung)
│   ├── auth-integration.md     # ctrlX Authentifizierungs-Integration
│   ├── manual.md               # Benutzerhandbuch
│   ├── release-notes.md        # Release-Notizen
│   └── test-setup-description.md        # Test-Setup-Beschreibung
│
├── datalayer-mappings.json      # Data Layer Pfad-Mappings
├── tedge-web-config.json        # Webserver-Konfiguration
├── setup-and-build-all.sh      # Automatisiertes Setup & Build Skript
├── .vscode/
│   └── tasks.json              # VS Code Build-Tasks
│
├── README.md                   # Haupt-Dokumentation
├── .gitignore                  # Git-Ignore-Datei
└── .editorconfig               # Editor-Konfiguration
```

## Kernkomponenten

### thin-edge.io Services
1. **tedge** - Hauptkonfigurationstool (CLI)
2. **tedge-agent** - Gerätemanagement-Agent
3. **tedge-mapper-c8y/aws/az** - Protokoll-Übersetzer (c8y/aws/azure)
4. **tedge-watchdog** - Health-Monitoring-Service (als Wrapper-Skript)
5. **mosquitto** - Lokaler MQTT-Broker

### Eigene Services (Rust)
1. **webserver** (`web-server-rust`) - Konfigurations-Web-UI mit RBAC
   - Rollenbasierte Zugriffskontrolle (Admin / Editor / Viewer)
   - ctrlX Auth-Header-Integration (`X-WEBAUTH-USER`, `X-WEBAUTH-ROLE`)
   - REST-API unter Port 8888
2. **tedge-datalayer-bridge** (`bridge-service-rust`) - ctrlX Data Layer Integration
   - Bridget MQTT-Telemetriedaten in den ctrlX Data Layer
3. **tedge-log-upload-manager** (`bridge-service-rust`) - Log-Upload-Verwaltung
   - Koordiniert Log-Datei-Uploads an Cloud-Plattformen

### Plugins
1. **c8y-firmware-plugin** - Firmware-Updates für Cumulocity
2. **c8y-remote-access-plugin** - Fernzugriff via Cumulocity
3. **tedge-apt-plugin** - APT-Paketverwaltung
4. **tedge-file-config-plugin** - Konfigurationsdatei-Management
5. **tedge-file-log-plugin** - Log-Datei-Management

## Funktionen

✅ **Implementiert:**
- Multi-Cloud-Konnektivität (Cumulocity, AWS, Azure)
- Vollständiges Snap-Packaging für ctrlX (Strict Confinement)
- ctrlX Auth-Integration via Caddyfile Reverse Proxy mit Scope-basiertem Rollen-Mapping
- Rollenbasierte Zugriffskontrolle im Webserver (Admin/Editor/Viewer)
- ctrlX Data Layer Integration (`tedge-datalayer-bridge`)
- Konfigurations-Web-UI (Rust/Actix-Web + HTML/JS)
- Log-Upload-Manager
- CTRLX-konforme Metadaten (package-manifest, portlist, slotplug, fossinfo)
- Build-Skripte für beide Architekturen (amd64/arm64)
- Umfassende Dokumentation (DE/EN, inkl. Auth-Integration)
- FOSS-Compliance-Dokumentation
- Health-Monitoring
- Geräte-ID-Verwaltung via Hardware-Serial
- Snap-aware connect/disconnect/reconnect-Wrapper

🔄 **Noch ausstehend / Roadmap:**
- CTRLX License Management Integration
- Vertiefte ctrlX Diagnostics/Logbook-Integration

## Build-Prozess

### Automatischer Setup und Build (Empfohlen)

Das automatisierte Skript installiert alle Abhängigkeiten und baut beide Architekturen:

```bash
./setup-and-build-all.sh
```

Das Skript führt aus:
- Rust-Toolchain installieren (falls nicht vorhanden)
- Snapcraft installieren (falls nicht vorhanden)
- Build-Abhängigkeiten installieren
- Snap für amd64 bauen (ctrlX COREvirtual)
- Snap für arm64 bauen (ctrlX CORE Hardware)

**Hinweis**: Der erste Build dauert 15-30 Minuten, da alle Rust-Dependencies heruntergeladen und kompiliert werden.

### Manuelle Installation (Fortgeschritten)

#### Voraussetzungen
```bash
# Rust-Toolchain installieren
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.85

# Snapcraft installieren
sudo snap install snapcraft --classic

# Build-Abhängigkeiten installieren
sudo apt-get install pkg-config libssl-dev libsqlite3-dev
```

#### Build-Befehle

### Build für ctrlX COREvirtual (amd64)
```bash
cd thin-edge-io-app
./build-snap-amd64.sh
```

### Build für ctrlX CORE Hardware (arm64)
```bash
cd thin-edge-io-app
./build-snap-arm64.sh
```

#### Build-Ausgabe

Nach erfolgreichem Build befinden sich die Snap-Dateien im aktuellen Verzeichnis:
- `thin-edge-io_1.7.1_amd64.snap` - Für ctrlX COREvirtual
- `thin-edge-io_1.7.1_arm64.snap` - Für ctrlX CORE Hardware

### Über VS Code
1. Terminal → Run Build Task
2. Auswählen: "build snap amd64" oder "build snap arm64"

## Installation

1. Snap-Datei herunterladen oder bauen
2. CTRLX CORE Web-Interface öffnen
3. Settings → Apps → Service Mode
4. Install from file
5. Snap-Datei auswählen
6. Zurück zu Operation Mode

## Konfiguration

### Schnellstart
```bash
# Via SSH verbinden
ssh -p 8022 rexroot@<device-ip>

# Cumulocity konfigurieren
thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com
thin-edge-io.tedge config set device.id your-device-id

# Zertifikat erstellen
thin-edge-io.tedge cert create --device-id your-device-id

# Verbinden
thin-edge-io.tedge connect c8y
```

### Interaktive Konfiguration
```bash
./scripts/setup-config.sh
```

## Status prüfen

```bash
# Service-Status
snap services thin-edge-io

# Logs ansehen
snap logs thin-edge-io.tedge-agent -f

# Verbindung testen
thin-edge-io.tedge connect c8y --test

# Konfiguration anzeigen
thin-edge-io.tedge config list
```

## CTRLX-Validierung

Die App ist vorbereitet für die CTRLX-Validierung mit:

### Pflichtdokumente (in package-assets/ und docs/)
✅ snapcraft.yaml  
✅ package-manifest.json  
✅ portlist-description.json  
✅ unixsocket-description.json  
✅ slotplug-description.json  
✅ fossinfo.json  
✅ foss-offer.txt  
✅ manual.md (Benutzerhandbuch)  
✅ release-notes.md  
✅ test-setup-description.md  
✅ architecture-overview.md  
✅ auth-integration.md  

### Sicherheit
- Strict Snap Confinement
- TLS-verschlüsselte Verbindungen
- Zertifikatsbasierte Authentifizierung
- Rollenbasierte Zugriffskontrolle via ctrlX Auth (Admin/Editor/Viewer)
- Minimale Berechtigungen (network, network-bind, system-observe, log-observe)
- Caddyfile Reverse Proxy mit Bearer-Token-Validierung

### Netzwerk
- Nur ausgehende Cloud-Verbindungen (8883, 443)
- Webserver intern auf Port 8888 (via Caddyfile nach außen als `/thin-edge-io`)
- Interne MQTT-Kommunikation nur lokal

## Technische Details

### Architektur
- **Basis**: Ubuntu Core 22 (core22)
- **Sprache**: Rust 1.85
- **Web-UI**: HTML5 / Vanilla JS
- **Konfinement**: Strict
- **Architekturen**: amd64, arm64

### Snap-Services (Übersicht)
| Service | Typ | Beschreibung |
|---|---|---|
| `setup-directories` | oneshot | Verzeichnis-Initialisierung beim Start |
| `mosquitto` | daemon | Lokaler MQTT-Broker |
| `tedge-agent` | daemon | Gerätemanagement-Agent |
| `tedge-mapper-c8y/aws/az` | daemon | Cloud-Protokoll-Übersetzer |
| `tedge-watchdog` | daemon | Health-Monitoring |
| `tedge-datalayer-bridge` | daemon | ctrlX Data Layer Bridge |
| `tedge-log-upload-manager` | daemon | Log-Upload-Koordinator |
| `webserver` | daemon | Konfigurations-Web-UI (Port 8888) |
| `tedge` | CLI | Hauptkonfigurationstool |
| `tedge-connect` | CLI | Snap-aware connect/disconnect |
| `manage-device-id` | CLI | Geräte-ID Verwaltung |

### Ressourcen
- **RAM**: 50-100 MB (normal), bis 150 MB (Peak)
- **CPU**: <5% (idle), bis 20% (aktiv)
- **Storage**: ~100 MB App, ~50 MB Daten
- **Netzwerk**: <10 KB/s (durchschnittlich)

### Cloud-Plattformen
- ✅ Cumulocity IoT
- ✅ AWS IoT Core
- ✅ Azure IoT Hub

## Support

- **Dokumentation**: https://thin-edge.github.io/thin-edge.io/
- **GitHub**: https://github.com/thin-edge/thin-edge.io
- **Discord**: https://discord.com/invite/sVX3B8nj5d
- **Email**: info@thin-edge.io

## Lizenz

- **App**: Apache 2.0
- **thin-edge.io**: Apache 2.0
- **Abhängigkeiten**: Verschiedene OSI-genehmigte Lizenzen (siehe fossinfo.json)

## Version

**1.7.1** - März 2026

---

**Projekt erstellt für**: ctrlX AUTOMATION  
**Basierend auf**: thin-edge.io v1.7.1  
**Status**: Bereit für CTRLX-Validierung
