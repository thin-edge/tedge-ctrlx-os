# scripts/ – Übersicht und Hinweise

Dieses Verzeichnis enthält alle Build-, Test- und Wrapper-Skripte für das thin-edge.io Snap-Projekt.

## Wichtige Skripte (modularer Build)
- setup-env.sh: Prüft/Installiert Rust, Snapcraft, Abhängigkeiten
- build-bridge.sh: Baut und testet die Rust Datalayer Bridge
- build-info.sh: Erstellt build-info.txt
- build-snap.sh: Snap-Build für amd64/arm64
- test-snap.sh: Build-Summary und Snap-Installationshinweise
- clean.sh: Entfernt Build-Artefakte

## Wrapper & Service-Skripte
- tedge-service-wrapper.sh, tedge-wrapper.sh, webserver-wrapper.sh, mosquitto-wrapper.sh: Starten die jeweiligen Dienste im Snap
- manage-device-id.sh: Device-ID-Handling
- setup-directories.sh: Initialisiert Verzeichnisse im Snap
- setup-config.sh: Konfigurations-Setup
- show-build-info.sh: Zeigt Build-Info an

## Hinweise
- Die modularen Build-Skripte ersetzen die alte Logik aus setup-and-build-all.sh.
- Nicht mehr benötigte/alte Build-Skripte wurden entfernt.
- test-snap-tedge.sh und test-snap-tedge.log sind Testartefakte und können bei Bedarf gelöscht werden.
