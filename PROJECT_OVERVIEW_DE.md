# thin-edge.io für ctrlX AUTOMATION - Projektübersicht

## Verzeichnisstruktur

```
thin-edge-io-app/
├── snap/
│   └── snapcraft.yaml          # Snap-Konfiguration mit allen Komponenten
│
├── configs/
│   ├── package-manifest.json   # CTRLX Package-Manifest
│   ├── portlist-description.json        # Port-Konfiguration
│   ├── unixsocket-description.json      # Unix-Socket-Beschreibung
│   ├── slotplug-description.json        # Snap-Interface-Konfiguration
│   ├── fossinfo.json           # FOSS-Komponenten-Informationen
│   └── foss-offer.txt          # FOSS-Quelltextangebot
│
├── scripts/
│   └── setup-config.sh         # Konfigurations-Hilfsskript
│
├── docs/
│   ├── architecture-overview.md         # Architektur-Übersicht (für CTRLX-Validierung)
│   ├── manual.md               # Benutzerhandbuch
│   ├── release-notes.md        # Release-Notizen
│   └── test-setup-description.md        # Test-Setup-Beschreibung
│
├── .vscode/
│   └── tasks.json              # VS Code Build-Tasks
│
├── build-snap-amd64.sh         # Build-Skript für ctrlX COREvirtual
├── build-snap-arm64.sh         # Build-Skript für ctrlX CORE Hardware
├── README.md                   # Haupt-Dokumentation
├── .gitignore                  # Git-Ignore-Datei
└── .editorconfig               # Editor-Konfiguration
```

## Kernkomponenten

### thin-edge.io Services
1. **tedge** - Hauptkonfigurationstool (CLI)
2. **tedge-agent** - Gerätemanagement-Agent
3. **tedge-mapper** - Protokoll-Übersetzer (c8y/aws/azure)
4. **tedge-watchdog** - Health-Monitoring-Service

### Plugins
1. **c8y-firmware-plugin** - Firmware-Updates für Cumulocity
2. **c8y-remote-access-plugin** - Fernzugriff via Cumulocity
3. **tedge-apt-plugin** - APT-Paketverwaltung
4. **tedge-file-config-plugin** - Konfigurationsdatei-Management
5. **tedge-file-log-plugin** - Log-Datei-Management

## Funktionen

✅ **Implementiert:**
- Multi-Cloud-Konnektivität (Cumulocity, AWS, Azure)
- Vollständiges Snap-Packaging für CTRLX
- CTRLX-konforme Metadaten
- Build-Skripte für beide Architekturen (amd64/arm64)
- Umfassende Dokumentation (DE/EN)
- FOSS-Compliance-Dokumentation
- Sicherheitskonfiguration (Strict Confinement)
- Health-Monitoring
- Alle thin-edge.io Komponenten und Plugins

🔄 **Geplant (Roadmap):**
- CTRLX Data Layer Integration
- Web-UI für Konfiguration
- CTRLX Identity Management Integration
- Integration mit CTRLX Diagnostics/Logbook
- CTRLX License Management

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
ssh boschrexroth@<device-ip>

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

### Pflichtdokumente (in configs/ und docs/)
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

### Sicherheit
- Strict Snap Confinement
- TLS-verschlüsselte Verbindungen
- Zertifikatsbasierte Authentifizierung
- Minimale Berechtigungen (network, network-bind, system-observe)

### Netzwerk
- Nur ausgehende Verbindungen (8883, 443)
- Keine eingehenden Ports
- Interne API nur lokal zugänglich

## Technische Details

### Architektur
- **Basis**: Ubuntu Core 24
- **Sprache**: Rust 1.85
- **Konfinement**: Strict
- **Architekturen**: amd64, arm64

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

**1.7.1** - Februar 2026 (Initiales CTRLX Release)

---

**Projekt erstellt für**: ctrlX AUTOMATION  
**Basierend auf**: thin-edge.io v1.7.1  
**Status**: Bereit für CTRLX-Validierung
