/* eslint-disable no-undef, quotes, no-unused-vars */

// thin-edge.io Configuration UI
// ── i18n ─────────────────────────────────────────────────────────────

// thin-edge.io Configuration UI

// ── i18n ─────────────────────────────────────────────────────────────
const I18N = {
  de: {
    // Header
    "header.color": "Farbe",
    "header.new_tab": "⧉ New Tab",
    "header.title": "thin-edge.io Konfigurationsoberfläche",
    "header.lang_de": "DE",
    "header.lang_en": "EN",
    // Nav / Sections
    "section.status": "Verbindungsstatus",
    "section.cloud": "Cloud-Konfiguration",
    "section.device": "Geräte Zertifikat",
    "section.device_config": "Gerätekonfiguration",
    "section.connect": "Gerät verbinden",
    "connect.mqtt_port_label": "MQTT Port",
    "connect.port_core": "Core MQTT (8883)",
    "connect.port_service": "MQTT Service (9883)",
    "connect.port_applied": (p) => `Port ${p} gesetzt`,
    "connect.port_reconnect_hint":
      "Einstellung gespeichert – bitte 'Neu verbinden' ausführen damit die Änderung wirksam wird.",
    "connect.port_err": "Fehler beim Setzen des Ports",
    "connect.mapping_topic_label": "Mapping Topic",
    "connect.mapping_topic_hint":
      "Topic für Test-Nachrichten über MQTT Service (Port 9883)",
    "section.logs": "Logs & Diagnose",
    "section.licensing": "ctrlX Lizenzierung",
    "section.sysinfo": "Systeminformationen",
    "licensing.loading": "Lizenzinformationen werden geladen...",
    "licensing.refresh": "Aktualisieren",
    "licensing.manage": "Lizenzen verwalten",
    "licensing.col.name": "Name",
    "licensing.col.status": "Status",
    "licensing.col.validUntil": "Gültig bis",
    "licensing.col.quantity": "Anzahl",
    // Status
    "status.services": "Dienste",
    "status.mappers": "Mapper",
    "status.clouds": "Cloud-Verbindungen",
    "status.clouds": "Cloud",
    "status.mappers": "Tedge Mapper",
    "status.loading": "⚪ Lädt...",
    "status.running": "🟢 Läuft",
    "status.stopped": "🔴 Gestoppt",
    "status.inactive": "⚫ Inaktiv",
    "status.unknown": "⚪ Unbekannt",
    "status.legend.running": "Läuft",
    "status.legend.stopped": "Gestoppt",
    "status.legend.inactive": "Inaktiv",
    "status.legend.unknown": "Unbekannt",
    "status.refresh": "Aktualisieren",
    // Cloud config
    "cloud.save": "Speichern",
    "cloud.save_short": "Speichern",
    "cloud.c8y_mapper": "Cumulocity IoT Mapper aktivieren",
    "cloud.aws_mapper": "AWS IoT Mapper aktivieren",
    "cloud.az_mapper": "Azure IoT Mapper aktivieren",
    // Device
    "device.id": "Geräte-ID:",
    "device.name": "Gerätename:",
    "device.name_hint":
      "Wird als CN beim Erstellen des Gerätezertifikats verwendet",
    "device.id_hint": "Eindeutiger Bezeichner (nur Admin kann ändern)",
    "device.id_hint_ro":
      "Eindeutiger Bezeichner (nur Lesen – Admin erforderlich)",
    "device.cert_status": "Zertifikatsstatus:",
    "device.upload_status": "Upload-Status:",
    "device.save": "Speichern",
    "device.renew_cert": "Erneuern",
    "device.update_cert": "Aktualisieren",
    "device.create_cert": "Erstellen",
    "device.upload_cert": "Hochladen",
    "device.cert_unknown": "⚪ Unbekannt",
    "device.not_uploaded": "⚪ Noch nicht hochgeladen",
    "device.cert_active": "🟢 Aktiv",
    "device.cert_missing": "🔴 Fehlt",
    "device.cert_details": "Zertifikatsdetails",
    "device.c8y_user": "Cumulocity Benutzername:",
    "device.c8y_pass": "Passwort:",
    "device.upload_btn": "Zertifikat hochladen",
    "device.cancel": "Abbrechen",
    "device.creds_title": "Cumulocity-Zugangsdaten",
    // Connect
    "connect.desc_c8y":
      "Verbindet das Gerät mit Cumulocity IoT. Output erscheint im Log-Viewer unten.",
    "connect.desc_aws":
      "Verbindet das Gerät mit AWS IoT. Output erscheint im Log-Viewer unten.",
    "connect.desc_az":
      "Verbindet das Gerät mit Azure IoT Hub. Output erscheint im Log-Viewer unten.",
    "connect.btn": "Verbinden",
    "connect.reconnect": "Neu verbinden",
    "connect.disconnect": "Trennen",
    "connect.setup": "Setup ↗",
    "connect.test_title": "Testnachrichten",
    "connect.test_desc":
      "Publiziert eine Testnachricht via tedge mqtt pub auf den lokalen Broker. Output erscheint im Log-Viewer unten.",
    "connect.test_meas": "Test Measurement",
    "connect.test_event": "Test Event",
    "connect.test_alarm": "Test Alarm",
    // Logs
    "logs.service": "Dienst",
    "logs.level": "Log-Level",
    "logs.apply": "Level anwenden",
    "logs.load": "Logs laden",
    "logs.copy": "Kopieren",
    "logs.copied": "Logs in Zwischenablage kopiert",
    "logs.placeholder": 'Klicke „Logs laden" um die letzten Einträge zu laden.',
    // Tedge Config
    "section.tedgeconfig": "Tedge Konfiguration",
    "tedgeconfig.load": "Konfiguration laden",
    "tedgeconfig.copy": "Kopieren",
    "tedgeconfig.placeholder":
      'Auf "Konfiguration laden" klicken, um die aktuelle Konfiguration anzuzeigen.',
    "tedgeconfig.loading": "Lade Konfiguration…",
    "tedgeconfig.error": (msg) => `Fehler beim Laden der Konfiguration: ${msg}`,
    "tedgeconfig.copied": "Konfiguration in Zwischenablage kopiert",
    // Sysinfo
    "sysinfo.version": "Version:",
    "sysinfo.build": "Build:",
    "sysinfo.snap": "Snap:",
    "sysinfo.arch": "Architektur:",
    // Footer
    "footer.text": "thin-edge.io IoT Edge Framework",
    // JS notifications
    "notify.status_error": "Keine Berechtigung zum Anzeigen des Status",
    "notify.status_load_err": "Servicestatus konnte nicht geladen werden",
    "notify.config_error": "Keine Berechtigung zum Anzeigen der Konfiguration",
    "notify.config_load_err": "Konfiguration konnte nicht geladen werden",
    "notify.c8y_saved": "Cumulocity-Konfiguration gespeichert",
    "notify.c8y_save_err":
      "Cumulocity-Konfiguration konnte nicht gespeichert werden",
    "notify.aws_saved": "AWS-Konfiguration gespeichert",
    "notify.aws_save_err": "AWS-Konfiguration konnte nicht gespeichert werden",
    "notify.az_saved": "Azure-Konfiguration gespeichert",
    "notify.az_save_err": "Azure-Konfiguration konnte nicht gespeichert werden",
    "notify.dev_saved": "Gerätekonfiguration gespeichert",
    "notify.dev_save_err":
      "Gerätekonfiguration konnte nicht gespeichert werden",
    "notify.refreshing": "Status wird aktualisiert...",
    "notify.restart_confirm":
      "Thin-edge.io-Dienste wirklich neu starten? Hierfür sind Admin-Rechte erforderlich.",
    "notify.restart_svc": (s) => `Service "${s}" wirklich neu starten?`,
    "notify.restart_link_title": "Neu starten",
    "notify.restarting": "Dienste werden neu gestartet...",
    "notify.restart_err": "Dienste konnten nicht neu gestartet werden",
    "notify.no_perm_status": "Keine Berechtigung für diesen Vorgang",
    "notify.cert_cn_required": "Bitte Certificate Common Name eingeben",
    "notify.cert_upload_user": "Bitte Cumulocity-Benutzername eingeben",
    "notify.cert_upload_pass": "Bitte Passwort eingeben",
    "notify.uploading": "Hochladen...",
    "notify.cert_uploaded": "Zertifikat zu Cumulocity hochgeladen",
    "notify.cert_upload_fail": "Zertifikat-Upload fehlgeschlagen",
    "notify.upload_error": "Upload-Fehler",
    "notify.admin_required": "Admin-Rechte erforderlich",
    "notify.connect_ok": (name) => `Mit ${name} verbunden`,
    "notify.connect_fail": (name) => `Verbindung zu ${name} fehlgeschlagen`,
    "notify.connect_error": "Verbindungsfehler",
    "notify.disconnect_ok": (name) => `Von ${name} getrennt`,
    "notify.disconnect_fail": (name) => `Trennen von ${name} fehlgeschlagen`,
    "notify.disconnect_error": "Trennfehler",
    "notify.reconnect_ok": (name) => `Mit ${name} neu verbunden`,
    "notify.reconnect_fail": (name) =>
      `Neu verbinden mit ${name} fehlgeschlagen`,
    "notify.reconnect_error": "Neu-Verbindungsfehler",
    "notify.test_sent": (label) => `${label} gesendet`,
    "notify.test_fail": (label) => `${label} fehlgeschlagen`,
    "notify.test_error": "Fehler beim Senden",
    "notify.cert_details_ok": "Zertifikatsdetails im Log-Viewer geladen",
    "notify.cert_details_err": "Fehler beim Laden der Zertifikatsdetails",
    "notify.no_perm_device":
      "Keine Berechtigung zum Anzeigen der Geräteinformationen",
    // Confirm dialogs
    "confirm.connect": (name) =>
      `Mit ${name} verbinden?\n\nDies stellt die Cloud-Verbindung her.`,
    "confirm.disconnect": (name) =>
      `Von ${name} trennen?\n\nDies trennt die Cloud-Verbindung.`,
    "confirm.reconnect": (name) =>
      `Mit ${name} neu verbinden?\n\nDies trennt die Verbindung und stellt sie neu her.`,
    "confirm.cert_create": (cn) =>
      `Zertifikat erstellen mit Common Name "${cn}"?\n\nDies startet thin-edge.io-Dienste neu.`,
    "confirm.cert_renew": (cn) =>
      `Zertifikat erneuern mit Common Name "${cn}"?\n\n⚠️ Das bestehende Zertifikat wird ersetzt!\nDanach muss das Zertifikat erneut hochgeladen werden.\n\nDies startet thin-edge.io-Dienste neu.`,
    "confirm.cert_upload": (user) =>
      `Zertifikat zu Cumulocity IoT hochladen?\n\nDas Gerätezertifikat wird unter dem Benutzer "${user}" in Cumulocity registriert.`,
    // Log viewer
    "logs.loading": (svc) => `Lade Logs für ${svc}...`,
    "logs.no_perm": "Keine Berechtigung zum Anzeigen der Logs.",
    "logs.empty": "(Keine Log-Einträge gefunden)",
    "logs.load_error": (msg) => `Fehler beim Laden der Logs: ${msg}`,
    "logs.level_set": (svc, lvl) =>
      `Log-Level für "${svc}" auf "${lvl}" gesetzt. Dienst wird neu gestartet.`,
    "logs.level_err": "Fehler beim Setzen des Log-Levels",
    "logs.no_perm_level": "Keine Berechtigung zum Ändern des Log-Levels",
    // cert upload status
    "cert.uploaded_to": (cloud, time) => `🟢 Hochgeladen zu ${cloud}${time}`,
    // cert create verb
    "cert.created": (cn) => `Zertifikat erstellt mit CN: ${cn}`,
    "cert.renewed": (cn) => `Zertifikat erneuert mit CN: ${cn}`,
    "cert.create_err": "Fehler beim Erstellen des Zertifikats",
    // Datalayer section
    "section.datalayer": "ctrlX Datenpunkte (Datalayer)",
    // Snap Config Editor
    "section.snapconfig": "Snap Konfigurationsdateien",
    "snapconfig.file": "Datei",
    "snapconfig.load": "Laden",
    "snapconfig.save": "Speichern",
    "snapconfig.copy": "Kopieren",
    "snapconfig.placeholder": 'Datei auswählen und „Laden" klicken.',
    "snapconfig.saved": "Datei gespeichert.",
    "snapconfig.save_err": "Fehler beim Speichern der Datei.",
    "snapconfig.load_err": "Fehler beim Laden der Datei.",
    "datalayer.refresh": "Aktualisieren",
    "datalayer.connection_settings": "Verbindungseinstellungen",
    "datalayer.enabled": "Aktiviert",
    "datalayer.base_url": "Basis-URL:",
    "datalayer.poll_interval": "Poll-Intervall (ms):",
    "datalayer.username": "Benutzername:",
    "datalayer.password": "Passwort:",
    "datalayer.accept_invalid_certs": "Ungültige TLS-Zertifikate akzeptieren",
    "datalayer.node_browser": "Knoten-Browser",
    "datalayer.browse_placeholder": "z.B. plc/app/Application",
    "datalayer.browser_hint": 'Pfad eingeben und „Durchsuchen" klicken.',
    "datalayer.mappings_title": "Datenpunkt-Mappings",
    "datalayer.add_mapping_btn": "+ Mapping",
    "datalayer.path": "Datalayer-Pfad",
    "datalayer.transform": "Transform",
    "datalayer.unit": "Einheit (optional)",
    "datalayer.topic": "tedge MQTT Topic",
    "datalayer.field": "Feldname",
    "datalayer.auto_hint": "Automatisch aus Pfad",
    "datalayer.password_hint":
      "Nur für Basis-Auth. Wenn Token verwendet wird, kann dieses Feld leer bleiben.",
    "datalayer.no_mappings": "Keine Mappings konfiguriert.",
    "datalayer.status_noauth": "🟡 Verbunden – kein Token / Auth-Fehler",
    "datalayer.status_unreachable": "Nicht erreichbar",
    "datalayer.token_static": "Statisches Token (Optional)",
    "datalayer.token_hint":
      "Falls leer, wird das aktuelle Anmelde-Token verwendet.",
    "datalayer.confirm_delete": "Möchten Sie dieses Mapping wirklich löschen?",
    "datalayer.delete_title": "Mapping löschen",
    "datalayer.direction": "Richtung",
    "datalayer.dir_dl_to_tedge": "Datalayer ➔ tedge (Lesen)",
    "datalayer.dir_tedge_to_dl": "tedge ➔ Datalayer (Schreiben)",
    "datalayer.col_direction": "Richtung",
    "datalayer.add_mapping_title": "Mapping hinzufügen",
    "datalayer.edit_mapping_title": "Mapping bearbeiten",
    "common.delete": "Löschen",
    "notify.dl_config_err": "Fehler beim Speichern der Datalayer-Konfiguration",
    "notify.dl_mapping_added": "Mapping hinzugefügt",
    "notify.dl_mapping_add_err": "Fehler beim Hinzufügen des Mappings",
    "notify.dl_mapping_deleted": "Mapping gelöscht",
    "notify.dl_mapping_del_err": "Fehler beim Löschen des Mappings",
    "notify.dl_path_required": "Bitte Datalayer-Pfad und tedge-Topic eingeben",
    "notify.dl_mappings_disabled":
      "Alle Mappings wurden deaktiviert, da der MQTT Service (Port 9883) aktiviert wurde. Bitte Topics auf 'c8y/mqtt/out/...' anpassen.",
    "notify.dl_mappings_reenabled":
      "Alle Mappings wurden wieder aktiviert (Core MQTT Port 8883).",
    "notify.dl_topic_te_warning":
      "Dieses Mapping verwendet ein 'te/'-Topic. Beim MQTT Service muss stattdessen 'c8y/mqtt/out/...' verwendet werden.",
    "datalayer.topic_hint_core": "z.B. te/device/main///m/meinWert",
    "datalayer.topic_hint_service": "z.B. c8y/mqtt/out/meinTopic",
  },
  en: {
    // Header
    "header.color": "Color",
    "header.new_tab": "⧉ New Tab",
    "header.title": "thin-edge.io Configuration Interface",
    "header.lang_de": "DE",
    "header.lang_en": "EN",
    // Nav / Sections
    "section.status": "Connection Status",
    "section.cloud": "Cloud Configuration",
    "section.device": "Device Certificate",
    "section.device_config": "Device Configuration",
    "section.connect": "Connect Device",
    "connect.mqtt_port_label": "MQTT Port",
    "connect.port_core": "Core MQTT (8883)",
    "connect.port_service": "MQTT Service (9883)",
    "connect.port_applied": (p) => `Port ${p} applied`,
    "connect.port_reconnect_hint":
      "Setting saved – please click 'Reconnect' for the change to take effect.",
    "connect.port_err": "Error setting MQTT port",
    "connect.mapping_topic_label": "Mapping Topic",
    "connect.mapping_topic_hint":
      "Topic for test messages via MQTT Service (Port 9883)",
    "section.logs": "Logs & Diagnostics",
    "section.licensing": "ctrlX Licensing",
    "section.sysinfo": "System Information",
    "licensing.loading": "Loading license information...",
    "licensing.refresh": "Refresh",
    "licensing.manage": "Manage Licenses",
    "licensing.col.name": "Name",
    "licensing.col.status": "Status",
    "licensing.col.validUntil": "Valid Until",
    "licensing.col.quantity": "Qty",
    // Status
    "status.services": "Services",
    "status.mappers": "Mappers",
    "status.clouds": "Cloud Connections",
    "status.clouds": "Cloud",
    "status.mappers": "Tedge Mapper",
    "status.loading": "⚪ Loading...",
    "status.running": "🟢 Running",
    "status.stopped": "🔴 Stopped",
    "status.inactive": "⚫ Inactive",
    "status.unknown": "⚪ Unknown",
    "status.legend.running": "Running",
    "status.legend.stopped": "Stopped",
    "status.legend.inactive": "Inactive",
    "status.legend.unknown": "Unknown",
    "status.refresh": "Refresh",
    // Cloud config
    "cloud.save": "Save",
    "cloud.save_short": "Save",
    "cloud.c8y_mapper": "Enable Cumulocity IoT Mapper",
    "cloud.aws_mapper": "Enable AWS IoT Mapper",
    "cloud.az_mapper": "Enable Azure IoT Mapper",
    // Device
    "device.id": "Device ID:",
    "device.name": "Device Name:",
    "device.name_hint": "Used as CN when creating the device certificate",
    "device.id_hint": "The unique device identifier",
    "device.id_hint_ro":
      "The unique device identifier (read-only – admin only)",
    "device.cert_status": "Certificate Status:",
    "device.upload_status": "Upload Status:",
    "device.save": "Save",
    "device.renew_cert": "Renew",
    "device.update_cert": "Update",
    "device.create_cert": "Create",
    "device.upload_cert": "Upload",
    "device.cert_unknown": "⚪ Unknown",
    "device.not_uploaded": "⚪ Not yet uploaded",
    "device.cert_active": "🟢 Active",
    "device.cert_missing": "🔴 Missing",
    "device.cert_details": "Certificate Details",
    "device.c8y_user": "Cumulocity Username:",
    "device.c8y_pass": "Password:",
    "device.upload_btn": "Upload Certificate",
    "device.cancel": "Cancel",
    "device.creds_title": "Cumulocity Credentials",
    // Connect
    "connect.desc_c8y":
      "Connects the device to Cumulocity IoT. Output appears in the log viewer below.",
    "connect.desc_aws":
      "Connects the device to AWS IoT. Output appears in the log viewer below.",
    "connect.desc_az":
      "Connects the device to Azure IoT Hub. Output appears in the log viewer below.",
    "connect.btn": "Connect",
    "connect.reconnect": "Reconnect",
    "connect.disconnect": "Disconnect",
    "connect.setup": "Setup ↗",
    "connect.test_title": "Test Messages",
    "connect.test_desc":
      "Publishes a test message via tedge mqtt pub to the local broker. Output appears in the log viewer below.",
    "connect.test_meas": "Test Measurement",
    "connect.test_event": "Test Event",
    "connect.test_alarm": "Test Alarm",
    // Logs
    "logs.service": "Service",
    "logs.level": "Log Level",
    "logs.apply": "Apply Level",
    "logs.load": "Load Logs",
    "logs.copy": "Copy",
    "logs.copied": "Logs copied to clipboard",
    "logs.placeholder": 'Click "Load Logs" to load the latest entries.',
    // Sysinfo
    "sysinfo.version": "Version:",
    "sysinfo.build": "Build:",
    "sysinfo.snap": "Snap:",
    "sysinfo.arch": "Architecture:",
    // Footer
    "footer.text": "thin-edge.io IoT Edge Framework",
    // JS notifications
    "notify.status_error": "No permission to view service status",
    "notify.status_load_err": "Could not load service status",
    "notify.config_error": "No permission to view configuration",
    "notify.config_load_err": "Could not load configuration",
    "notify.c8y_saved": "Cumulocity configuration saved",
    "notify.c8y_save_err": "Could not save Cumulocity configuration",
    "notify.aws_saved": "AWS configuration saved",
    "notify.aws_save_err": "Could not save AWS configuration",
    "notify.az_saved": "Azure configuration saved",
    "notify.az_save_err": "Could not save Azure configuration",
    "notify.dev_saved": "Device configuration saved",
    "notify.dev_save_err": "Could not save device configuration",
    "notify.refreshing": "Refreshing status...",
    "notify.restart_confirm":
      "Are you sure you want to restart thin-edge.io services? This requires admin permissions.",
    "notify.restart_svc": (s) => `Restart service "${s}"?`,
    "notify.restart_link_title": "Restart",
    "notify.restarting": "Services are restarting...",
    "notify.restart_err": "Could not restart services",
    "notify.no_perm_status": "Insufficient permissions for this action",
    "notify.cert_cn_required": "Please enter a Certificate Common Name",
    "notify.cert_upload_user": "Please enter a Cumulocity username",
    "notify.cert_upload_pass": "Please enter the password",
    "notify.uploading": "Uploading...",
    "notify.cert_uploaded": "Certificate uploaded to Cumulocity",
    "notify.cert_upload_fail": "Certificate upload failed",
    "notify.upload_error": "Upload error",
    "notify.admin_required": "Admin access required",
    "notify.connect_ok": (name) => `Connected to ${name}`,
    "notify.connect_fail": (name) => `Connection to ${name} failed`,
    "notify.connect_error": "Connection error",
    "notify.disconnect_ok": (name) => `Disconnected from ${name}`,
    "notify.disconnect_fail": (name) => `Disconnect from ${name} failed`,
    "notify.disconnect_error": "Disconnect error",
    "notify.reconnect_ok": (name) => `Reconnected to ${name}`,
    "notify.reconnect_fail": (name) => `Reconnect to ${name} failed`,
    "notify.reconnect_error": "Reconnect error",
    "notify.test_sent": (label) => `${label} sent`,
    "notify.test_fail": (label) => `${label} failed`,
    "notify.test_error": "Error sending message",
    "notify.cert_details_ok": "Certificate details loaded in log viewer",
    "notify.cert_details_err": "Error fetching certificate details",
    "notify.no_perm_device": "No permission to view device ID information",
    // Confirm dialogs
    "confirm.connect": (name) =>
      `Connect to ${name}?\n\nThis will establish the cloud connection.`,
    "confirm.disconnect": (name) =>
      `Disconnect from ${name}?\n\nThis will terminate the cloud connection.`,
    "confirm.reconnect": (name) =>
      `Reconnect to ${name}?\n\nThis will disconnect and re-establish the connection.`,
    "confirm.cert_create": (cn) =>
      `Create certificate with Common Name "${cn}"?\n\nThis will restart thin-edge.io services.`,
    "confirm.cert_renew": (cn) =>
      `Renew certificate with Common Name "${cn}"?\n\n⚠️ The existing certificate will be replaced!\nThe new certificate must be re-uploaded afterwards.\n\nThis will restart thin-edge.io services.`,
    "confirm.cert_upload": (user) =>
      `Upload certificate to Cumulocity IoT?\n\nThe device certificate will be registered under user "${user}" in Cumulocity.`,
    // Log viewer
    "logs.loading": (svc) => `Loading logs for ${svc}...`,
    "logs.no_perm": "No permission to view logs.",
    "logs.empty": "(No log entries found)",
    "logs.load_error": (msg) => `Error loading logs: ${msg}`,
    "logs.level_set": (svc, lvl) =>
      `Log level for "${svc}" set to "${lvl}". Service will be restarted.`,
    "logs.level_err": "Error setting log level",
    "logs.no_perm_level": "No permission to change log level",
    // cert upload status
    "cert.uploaded_to": (cloud, time) => `🟢 Uploaded to ${cloud}${time}`,
    // cert create verb
    "cert.created": (cn) => `Certificate created with CN: ${cn}`,
    "cert.renewed": (cn) => `Certificate renewed with CN: ${cn}`,
    "cert.create_err": "Error creating certificate",
    // Datalayer section
    "section.datalayer": "ctrlX Data Points (Datalayer)",
    // Snap Config Editor
    "section.snapconfig": "Snap Configuration Files",
    // Tedge Config section
    "section.tedgeconfig": "Tedge Configuration",
    "tedgeconfig.load": "Load Configuration",
    "tedgeconfig.copy": "Copy",
    "tedgeconfig.placeholder":
      'Click "Load Configuration" to view all tedge settings.',
    "tedgeconfig.loading": "Loading configuration…",
    "tedgeconfig.error": (msg) => `Error loading configuration: ${msg}`,
    "tedgeconfig.copied": "Configuration copied to clipboard",
    "snapconfig.file": "File",
    "snapconfig.load": "Load",
    "snapconfig.save": "Save",
    "snapconfig.copy": "Copy",
    "snapconfig.placeholder": 'Select a file and click "Load".',
    "snapconfig.saved": "File saved.",
    "snapconfig.save_err": "Error saving file.",
    "snapconfig.load_err": "Error loading file.",
    "datalayer.refresh": "Refresh Status",
    "datalayer.connection_settings": "Connection Settings",
    "datalayer.enabled": "Enabled",
    "datalayer.base_url": "Base URL:",
    "datalayer.poll_interval": "Poll interval (ms):",
    "datalayer.username": "Username:",
    "datalayer.password": "Password:",
    "datalayer.accept_invalid_certs": "Accept invalid TLS certificates",
    "datalayer.node_browser": "Node Browser",
    "datalayer.browse_placeholder": "e.g. plc/app/Application",
    "datalayer.browser_hint": 'Enter a path and click "Browse".',
    "datalayer.mappings_title": "Data Point Mappings",
    "datalayer.add_mapping_btn": "+ Mapping",
    "datalayer.path": "Datalayer Path",
    "datalayer.transform": "Transform",
    "datalayer.unit": "Unit (optional)",
    "datalayer.topic": "tedge MQTT Topic",
    "datalayer.field": "Field Name",
    "datalayer.auto_hint": "Automatically from path",
    "datalayer.password_hint":
      "Just for basic auth. If using token, this can be left empty.",
    "datalayer.no_mappings": "No mappings configured.",
    "datalayer.status_noauth": "🟡 Reachable – missing token / auth error",
    "datalayer.status_unreachable": "Not reachable",
    "datalayer.token_static": "Static Token (Optional)",
    "datalayer.token_hint":
      "If left empty, the current login token will be used.",
    // Transform types
    "datalayer.transform_measurement": "Measurement",
    "datalayer.transform_raw": "Raw",
    "datalayer.transform_event": "Event",
    "datalayer.transform_alarm": "Alarm",
    "datalayer.confirm_delete": "Do you really want to delete this mapping?",
    "datalayer.delete_title": "Delete Mapping",
    "datalayer.direction": "Direction",
    "datalayer.dir_dl_to_tedge": "Datalayer ➔ tedge (Read)",
    "datalayer.dir_tedge_to_dl": "tedge ➔ Datalayer (Write)",
    "datalayer.col_direction": "Direction",
    "datalayer.add_mapping_title": "Add Mapping",
    "datalayer.edit_mapping_title": "Edit Mapping",
    "common.delete": "Delete",
    // Notifications
    "notify.dl_config_err": "Error saving datalayer configuration",
    "notify.dl_mapping_added": "Mapping added",
    "notify.dl_mapping_add_err": "Error adding mapping",
    "notify.dl_mapping_deleted": "Mapping deleted",
    "notify.dl_mapping_del_err": "Error deleting mapping",
    "notify.dl_path_required": "Please enter Datalayer path and tedge topic",
    "notify.dl_mappings_disabled":
      "All mappings have been disabled because MQTT Service (port 9883) was enabled. Please update topics to use 'c8y/mqtt/out/...'.",
    "notify.dl_mappings_reenabled":
      "All mappings re-enabled (Core MQTT port 8883).",
    "notify.dl_topic_te_warning":
      "This mapping uses a 'te/' topic. With MQTT Service, use 'c8y/mqtt/out/...' instead.",
    "datalayer.topic_hint_core": "e.g. te/device/main///m/myValue",
    "datalayer.topic_hint_service": "e.g. c8y/mqtt/out/myTopic",
  },
};
// 1. Token beim Start aus der URL extrahieren
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get("token");
if (tokenFromUrl) {
  sessionStorage.setItem("ctrlx_token", tokenFromUrl);
  // Token aus der URL entfernen für saubere Optik
  window.history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Helper function that calls fetch() and automatically
 * includes the JWT token stored in sessionStorage.
 */
async function fetchWithAuth(url, options = {}) {
  // 1. Token aus sessionStorage holen (wird beim Login/Seitenladen dort gespeichert)
  const token = sessionStorage.getItem("ctrlx_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    // Wir setzen beide Header, um sicherzugehen
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Auth-Token"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

/**
 * Disables the mapper toggle and forces it off if the URL field is empty.
 * Re-enables it when the URL is filled.
 */
function updateMapperToggleState(urlId, toggleId) {
  const urlEl = document.getElementById(urlId);
  const toggleEl = document.getElementById(toggleId);
  if (!urlEl || !toggleEl) return;
  const hasUrl = urlEl.value.trim() !== "";
  toggleEl.disabled = !hasUrl;
  if (!hasUrl) toggleEl.checked = false;
}

const _savedLang = localStorage.getItem("tedge-lang");
let _lang =
  _savedLang || ((navigator.language || "en").startsWith("de") ? "de" : "en");
// Normalise: only 'de' or 'en'
if (_lang !== "de") _lang = "en";

function t(key, ...args) {
  const val = (I18N[_lang] || I18N["en"])[key] ?? I18N["en"][key] ?? key;
  if (typeof val === "function") return val(...args);
  return val;
}

function setLang(lang) {
  _lang = lang === "de" ? "de" : "en";
  localStorage.setItem("tedge-lang", _lang);
  document.documentElement.setAttribute("lang", _lang);
  applyI18n();
  // Update lang toggle buttons
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === _lang);
  });
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
  // Re-translate all status badges (running/stopped/inactive/unknown)
  document.querySelectorAll(".status.running").forEach((el) => {
    el.textContent = "\u25cf";
    el.title = t("status.running");
  });
  document.querySelectorAll(".status.stopped").forEach((el) => {
    el.textContent = "\u25cf";
    el.title = t("status.stopped");
  });
  document.querySelectorAll(".status.inactive").forEach((el) => {
    el.textContent = "\u25cf";
    el.title = t("status.inactive");
  });
  document.querySelectorAll(".status.unknown").forEach((el) => {
    el.textContent = "\u25cf";
    el.title = t("status.unknown");
  });
  // "unknown" from server (can't determine) → same tooltip
  document.querySelectorAll('[id$="-status"].status.unknown').forEach((el) => {
    el.textContent = "\u25cf";
    el.title = t("status.unknown");
  });
  // Log viewer placeholder
  const lv = document.getElementById("log-viewer");
  if (
    (lv && lv.textContent.trim() === "") ||
    (lv &&
      (lv.textContent.includes("Klicke") || lv.textContent.includes("Click")))
  ) {
    lv.textContent = t("logs.placeholder");
  }
  // cert-upload-status: retranslate only if showing the default "not uploaded" text
  const cu = document.getElementById("cert-upload-status");
  if (cu) {
    if (
      cu.textContent.includes("Noch nicht") ||
      cu.textContent.includes("Not yet")
    ) {
      cu.textContent = t("device.not_uploaded");
    }
    // Retranslate uploaded state via data attributes set by updateCertUploadStatusDisplay
    const cloud = cu.dataset.uploadCloud;
    const ts = cu.dataset.uploadTs;
    if (cloud)
      cu.textContent = t(
        "cert.uploaded_to",
        cloud,
        ts ? " (" + new Date(parseInt(ts) * 1000).toLocaleString() + ")" : "",
      );
  }
}
// ─────────────────────────────────────────────────────────────────────

// ── Color Theme Picker ──────────────────────────────────────────────
// Funktionsdeklarationen (werden gehoisted) damit inline-onclick sie immer findet
function toggleColorPicker(e) {
  if (e) e.stopPropagation();
  var dd = document.getElementById("color-picker-dropdown");
  var btn = document.getElementById("color-picker-btn");
  if (!dd || !btn) return;
  var isOpen = dd.style.display !== "none";
  if (isOpen) {
    dd.style.display = "none";
    return;
  }
  var rect = btn.getBoundingClientRect();
  dd.style.top = rect.bottom + 6 + "px";
  dd.style.right = window.innerWidth - rect.right + "px";
  dd.style.display = "flex";
}

function setColorTheme(color, e) {
  if (e) e.stopPropagation();
  if (color === "green") {
    document.documentElement.removeAttribute("data-color");
  } else {
    document.documentElement.setAttribute("data-color", color);
  }
  localStorage.setItem("tedge-color", color);
  document.querySelectorAll(".color-swatch").forEach(function (s) {
    s.classList.toggle("active", s.dataset.color === color);
  });
  var dd = document.getElementById("color-picker-dropdown");
  if (dd) dd.style.display = "none";
}
// ─────────────────────────────────────────────────────────────────────

// Helper function to handle API responses with permission errors
async function handleApiResponse(response, successMessage, errorMessage) {
  if (response.ok) {
    const data = await response.json();
    if (data.success === false && data.error) {
      showNotification(data.error, "error");
      return false;
    }
    showNotification(successMessage, "success");
    return true;
  } else if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    showNotification(
      data.error || "Insufficient permissions for this action",
      "error",
    );
    return false;
  } else {
    showNotification(errorMessage, "error");
    return false;
  }
}

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const section = tab.closest("section");
    const tabsEl = tab.closest(".tabs");
    // Nur Tabs und Panels innerhalb derselben Sektion deaktivieren
    if (tabsEl)
      tabsEl
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    if (section)
      section
        .querySelectorAll(".cloud-config, .connect-panel")
        .forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    const cloud = tab.dataset.cloud;
    const connect = tab.dataset.connect;
    if (cloud) {
      const el = document.getElementById(cloud + "-config");
      if (el) el.classList.add("active");
    }
    if (connect) {
      const el = document.getElementById(connect + "-connect");
      if (el) el.classList.add("active");
    }
  });
});

// Load status on page load
window.addEventListener("DOMContentLoaded", () => {
  // Token aus der URL extrahieren (ctrlX übergibt dies oft als ?token=...)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (token) {
    sessionStorage.setItem("ctrlx_token", token);
    // Optional: Token aus der URL entfernen für eine sauberere Adressleiste
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Only load the first visible section (status) on startup.
  // All other sections load their data lazily when the user opens them.
  loadStatus();

  // URL → Toggle: sofort deaktivieren wenn URL-Feld geleert wird
  ["c8y-url", "aws-url", "az-url"].forEach((urlId) => {
    const toggleId = urlId.replace("-url", "-enabled");
    const el = document.getElementById(urlId);
    if (el)
      el.addEventListener("input", () =>
        updateMapperToggleState(urlId, toggleId),
      );
  });

  // Auto-refresh service status every 30 seconds (only if section is open)
  setInterval(() => {
    const sec = document.getElementById("sec-status");
    if (sec && !sec.classList.contains("collapsed")) loadStatus();
  }, 30000);
});

// Load service status

async function loadStatus() {
  try {
    const response = await fetchWithAuth("api/status");

    if (response.status === 403) {
      showNotification(t("notify.status_error"), "error");
      return;
    }

    const data = await response.json();

    updateStatusBadge("mqtt-status", data.mosquitto || "unknown");
    updateStatusBadge("agent-status", data.agent || "unknown");
    updateStatusBadge("bridge-status", data.bridge || "unknown");
    updateStatusBadge("watchdog-status", data.watchdog || "unknown");
    updateStatusBadge("webserver-status", data.webserver || "unknown");
    updateStatusBadge(
      "log-upload-status",
      data.log_upload_manager || "unknown",
    );
    updateStatusBadge("mapper-c8y-status", data.mapper_c8y || "unknown");
    updateStatusBadge("mapper-aws-status", data.mapper_aws || "unknown");
    updateStatusBadge("mapper-az-status", data.mapper_az || "unknown");
    // Mapper-Status ergänzen
    updateStatusBadge("c8y-mapper-status", data.c8y || "unknown");
    updateStatusBadge("aws-mapper-status", data.aws || "unknown");
    updateStatusBadge("az-mapper-status", data.az || "unknown");
    updateStatusBadge("c8y-status", data.c8y || "unknown");
    updateStatusBadge("aws-status", data.aws || "unknown");
    updateStatusBadge("az-status", data.az || "unknown");
  } catch (error) {
    console.error("Error loading status:", error);
    showNotification(t("notify.status_load_err"), "error");
  }
}

// Update status badge
function updateStatusBadge(elementId, status) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.className = "status " + status;
  element.textContent = "\u25cf"; // ●
  element.style.fontSize = "26px";
  element.style.lineHeight = "1";
  const labels = {
    running: t("status.running"),
    stopped: t("status.stopped"),
    inactive: t("status.inactive"),
    unknown: t("status.unknown"),
  };
  element.title = labels[status] || t("status.unknown");
}

// Load configuration
function updateCertUploadStatusDisplay(certUpload) {
  const el = document.getElementById("cert-upload-status");
  if (!el) return;
  if (certUpload && certUpload.uploaded) {
    const cloud = certUpload.cloud ? certUpload.cloud.toUpperCase() : "Cloud";
    let timeStr = "";
    if (certUpload.timestamp) {
      const ts = parseInt(certUpload.timestamp, 10);
      if (!isNaN(ts))
        timeStr = " (" + new Date(ts * 1000).toLocaleString() + ")";
    }
    el.textContent = t("cert.uploaded_to", cloud, timeStr);
    el.style.color = "var(--brand-primary, #53cd61)";
    el.dataset.uploadCloud = cloud;
    el.dataset.uploadTs = certUpload.timestamp || "";
  } else {
    el.textContent = t("device.not_uploaded");
    el.style.color = "";
    delete el.dataset.uploadCloud;
    delete el.dataset.uploadTs;
  }
}

async function loadConfiguration() {
  try {
    const response = await fetchWithAuth("api/config");

    if (response.status === 403) {
      showNotification(t("notify.config_error"), "error");
      return;
    }

    const config = await response.json();

    // Populate form fields
    if (config.device) {
      // Only set device-id if not already filled by loadDeviceIdInfo (which uses live cert data)
      const deviceIdField = document.getElementById("device-id");
      if (deviceIdField && !deviceIdField.value && config.device.id) {
        deviceIdField.value = config.device.id;
      }
      // Pre-fill device name (cert CN) from saved config if not already set by loadDeviceIdInfo
      const cnField = document.getElementById("cert-common-name");
      if (cnField && !cnField.value && config.device.name) {
        cnField.value = config.device.name;
      }
    }

    if (config.c8y) {
      document.getElementById("c8y-url").value = config.c8y["c8y-url"] || "";
      document.getElementById("c8y-tenant").value = config.c8y.tenant || "";
    }

    if (config.aws) {
      document.getElementById("aws-url").value = config.aws["aws-url"] || "";
    }

    if (config.az) {
      document.getElementById("az-url").value = config.az["azure-url"] || "";
    }

    // Mapper-Toggles aus dem tatsächlichen Service-Zustand setzen (nicht aus JSON-Config)
    // so dass der Toggle immer den echten Laufzustand widerspiegelt
    try {
      const statusResp = await fetchWithAuth("api/status");
      if (statusResp.ok) {
        const status = await statusResp.json();
        const isRunning = (s) => s === "running" || s === "active";
        document.getElementById("c8y-enabled").checked = isRunning(
          status.mapper_c8y,
        );
        document.getElementById("aws-enabled").checked = isRunning(
          status.mapper_aws,
        );
        document.getElementById("az-enabled").checked = isRunning(
          status.mapper_az,
        );
      }
    } catch (_) {
      // Fallback auf JSON-Config wenn Status-API nicht erreichbar
      if (config.c8y)
        document.getElementById("c8y-enabled").checked =
          config.c8y.enabled || false;
      if (config.aws)
        document.getElementById("aws-enabled").checked =
          config.aws.enabled || false;
      if (config.az)
        document.getElementById("az-enabled").checked =
          config.az.enabled || false;
    }

    // Toggle deaktivieren wenn URL-Feld leer ist (kein Mapper ohne URL möglich)
    updateMapperToggleState("c8y-url", "c8y-enabled");
    updateMapperToggleState("aws-url", "aws-enabled");
    updateMapperToggleState("az-url", "az-enabled");

    updateCertUploadStatusDisplay(config.cert_upload || null);
  } catch (error) {
    console.error("Error loading configuration:", error);
    showNotification(t("notify.config_load_err"), "error");
  }
}

// Save Cumulocity configuration
async function saveC8yConfig() {
  const config = {
    "c8y-url": document.getElementById("c8y-url").value,
    tenant: document.getElementById("c8y-tenant").value,
    enabled: document.getElementById("c8y-enabled").checked,
  };

  try {
    const response = await fetchWithAuth("api/config/c8y", {
      method: "POST",
      body: JSON.stringify(config),
    });

    await handleApiResponse(
      response,
      t("notify.c8y_saved"),
      t("notify.c8y_save_err"),
    );
  } catch (error) {
    console.error("Error saving C8y config:", error);
    showNotification(t("notify.c8y_save_err"), "error");
  }
}

// Save AWS configuration
async function saveAwsConfig() {
  const config = {
    "aws-url": document.getElementById("aws-url").value,
    enabled: document.getElementById("aws-enabled").checked,
  };

  try {
    const response = await fetchWithAuth("api/config/aws", {
      method: "POST",
      body: JSON.stringify(config),
    });

    await handleApiResponse(
      response,
      t("notify.aws_saved"),
      t("notify.aws_save_err"),
    );
  } catch (error) {
    console.error("Error saving AWS config:", error);
    showNotification(t("notify.aws_save_err"), "error");
  }
}

// Save Azure configuration
async function saveAzConfig() {
  const config = {
    "azure-url": document.getElementById("az-url").value,
    enabled: document.getElementById("az-enabled").checked,
  };

  try {
    const response = await fetchWithAuth("api/config/az", {
      method: "POST",
      body: JSON.stringify(config),
    });

    await handleApiResponse(
      response,
      t("notify.az_saved"),
      t("notify.az_save_err"),
    );
  } catch (error) {
    console.error("Error saving Azure config:", error);
    showNotification(t("notify.az_save_err"), "error");
  }
}

// Save device configuration
async function saveDeviceConfig() {
  const config = {
    id: document.getElementById("device-id").value,
    name: (document.getElementById("cert-common-name") || {}).value || "",
  };

  try {
    const response = await fetchWithAuth("api/config/device", {
      method: "POST",
      body: JSON.stringify(config),
    });

    await handleApiResponse(
      response,
      t("notify.dev_saved"),
      t("notify.dev_save_err"),
    );
  } catch (error) {
    console.error("Error saving device config:", error);
    showNotification(t("notify.dev_save_err"), "error");
  }
}

// Refresh status
function refreshStatus() {
  showNotification(t("notify.refreshing"), "info");
  loadStatus();
}

// Load logs from API
async function loadLogs() {
  const service = document.getElementById("log-service-select").value;
  const viewer = document.getElementById("log-viewer");
  viewer.textContent = t("logs.loading", service);
  try {
    const response = await fetchWithAuth(
      `api/logs?service=${encodeURIComponent(service)}&lines=100`,
    );
    if (response.status === 403) {
      viewer.textContent = t("logs.no_perm");
      return;
    }
    const data = await response.json();
    if (data.lines && data.lines.length > 0) {
      viewer.textContent = data.lines.join("\n");
    } else {
      viewer.textContent = t("logs.empty");
    }
    viewer.scrollTop = viewer.scrollHeight;
  } catch (error) {
    viewer.textContent = t("logs.load_error", error.message);
  }
}

// Fetch all log levels from system.toml and update the dropdown for the currently selected service
async function updateLogLevelDropdown() {
  const service = document.getElementById("log-service-select").value;
  try {
    const response = await fetchWithAuth("api/log-level");
    if (!response.ok) return;
    const data = await response.json();
    if (data.levels && data.levels[service]) {
      const levelSelect = document.getElementById("log-level-select");
      levelSelect.value = data.levels[service];
    } else {
      // No entry in system.toml for this service → default is info
      document.getElementById("log-level-select").value = "info";
    }
  } catch (_) {
    // silently ignore – dropdown keeps its current value
  }
}

// Apply log level for selected service
async function applyLogLevel() {
  const service = document.getElementById("log-service-select").value;
  const level = document.getElementById("log-level-select").value;
  try {
    const response = await fetchWithAuth("api/log-level", {
      method: "POST",
      body: JSON.stringify({ service, level }),
    });
    if (response.status === 403) {
      showNotification(t("logs.no_perm_level"), "error");
      return;
    }
    const data = await response.json();
    if (data.success) {
      showNotification(t("logs.level_set", service, level), "success");
    } else {
      showNotification(data.error || t("logs.level_err"), "error");
    }
  } catch (error) {
    showNotification("Error: " + error.message, "error");
  }
}

// Load tedge config list
async function loadTedgeConfig() {
  const viewer = document.getElementById("tedge-config-viewer");
  if (!viewer) return;
  viewer.textContent = t("tedgeconfig.loading");
  try {
    const response = await fetchWithAuth("api/tedge-config-list");
    if (response.status === 403) {
      viewer.textContent = t("tedgeconfig.error", "Keine Berechtigung");
      return;
    }
    const data = await response.json();
    if (data.output) {
      viewer.textContent = data.output;
    } else {
      viewer.textContent = t(
        "tedgeconfig.error",
        data.error || "Unbekannter Fehler",
      );
    }
  } catch (error) {
    viewer.textContent = t("tedgeconfig.error", error.message);
  }
}

function copyTedgeConfig() {
  const viewer = document.getElementById("tedge-config-viewer");
  if (!viewer || !viewer.textContent) return;
  navigator.clipboard
    .writeText(viewer.textContent)
    .then(() => {
      showNotification(t("tedgeconfig.copied"), "success");
    })
    .catch(() => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(viewer);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      showNotification(t("tedgeconfig.copied"), "success");
    });
}

function copyLogs() {
  const viewer = document.getElementById("log-viewer");
  if (!viewer.textContent) return;
  navigator.clipboard
    .writeText(viewer.textContent)
    .then(() => {
      showNotification(t("logs.copied") || "Logs copied", "success");
    })
    .catch(() => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(viewer);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      showNotification(t("logs.copied") || "Logs copied", "success");
    });
}

// Restart a single snap service
async function restartService(service) {
  if (!confirm(t("notify.restart_svc", service))) return;
  try {
    const res = await fetchWithAuth("api/restart-service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service }),
    });
    const data = await res.json();
    if (data.success) {
      showNotification(t("notify.restarting"), "info");
      setTimeout(loadStatus, 3500);
    } else {
      showNotification(data.error || t("notify.restart_err"), "error");
    }
  } catch (e) {
    showNotification(t("notify.restart_err") + ": " + e.message, "error");
  }
}

// Restart services
async function restartServices() {
  if (!confirm(t("notify.restart_confirm"))) {
    return;
  }

  try {
    const response = await fetchWithAuth("api/restart", {
      method: "POST",
    });

    const success = await handleApiResponse(
      response,
      t("notify.restarting"),
      t("notify.restart_err"),
    );

    if (success) {
      setTimeout(loadStatus, 5000);
    }
  } catch (error) {
    console.error("Error restarting services:", error);
    showNotification(t("notify.restart_err"), "error");
  }
}

// Show notification (Bootstrap alert + Cumulocity palette)
function showNotification(message, type = "info") {
  const typeClass =
    type === "error"
      ? "alert-danger"
      : type === "success"
        ? "alert-success"
        : type === "warning"
          ? "alert-warning"
          : "alert-info";

  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  el.className = `alert ${typeClass} alert-dismissible`;
  el.setAttribute("role", "alert");
  el.innerHTML = `${message} <button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;
  el.querySelector(".close").addEventListener("click", () => el.remove());
  container.appendChild(el);

  // Trigger transition in next frame
  requestAnimationFrame(() => el.classList.add("show"));

  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3000);
}

// Device ID Management Functions

// Load device ID information
async function loadDeviceIdInfo() {
  try {
    const response = await fetchWithAuth("api/device-id");
    if (!response.ok) {
      if (response.status === 403)
        showNotification(t("notify.no_perm_device"), "error");
      return;
    }
    const data = await response.json();

    // Fill device-id field: always show hardware UUID (system_serial)
    const deviceIdField = document.getElementById("device-id");
    if (deviceIdField) {
      deviceIdField.value = (data.system_serial || "").replace(/^ctrlx-/i, "");
      deviceIdField.placeholder = "Hardware UUID";
    }

    // Pre-fill cert-common-name from current cert CN
    const cnField = document.getElementById("cert-common-name");
    if (cnField && !cnField.value) {
      const cert =
        data.current &&
        data.current !== "not-set" &&
        !data.current.startsWith("No certificate")
          ? data.current
          : "";
      const raw = cert || data.system_serial || "";
      cnField.value = raw.replace(/^ctrlx-/i, "");
      cnField.placeholder =
        (data.system_serial || "").replace(/^ctrlx-/i, "") || "e.g. ctrlx-001";
    }

    // Certificate status + button highlight + inline cert details
    window._certExists = !!data.has_certificate;
    const certStatus = document.getElementById("cert-status");
    const createBtn = document.getElementById("btn-set-device-id");
    if (data.has_certificate) {
      if (certStatus) {
        certStatus.className = "cert-status success";
        certStatus.textContent = t("device.cert_active");
      }
      if (createBtn) {
        createBtn.className = "btn btn-warning btn-sm";
        createBtn.disabled = false;
        createBtn.textContent = t("device.update_cert");
      }
      loadCertDetailsInline();
    } else {
      if (certStatus) {
        certStatus.className = "cert-status error";
        certStatus.textContent = t("device.cert_missing");
      }
      if (createBtn) {
        createBtn.className = "btn btn-warning btn-sm";
        createBtn.disabled = false;
        createBtn.textContent = t("device.create_cert");
      }
      const inline = document.getElementById("cert-details-inline");
      if (inline) inline.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading device ID info:", error);
  }
}

// Check current user role and enable/disable admin-only fields
async function applyRoleRestrictions() {
  try {
    const response = await fetchWithAuth("api/me");
    if (!response.ok) return;
    const data = await response.json();
    const isAdmin = data.role === "admin";

    const deviceIdField = document.getElementById("device-id");
    if (deviceIdField) {
      deviceIdField.readOnly = !isAdmin;
      deviceIdField.style.background = isAdmin
        ? ""
        : "var(--c8y-palette-gray-90,#2a2a3e)";
      deviceIdField.style.cursor = isAdmin ? "" : "not-allowed";
      deviceIdField.style.opacity = isAdmin ? "" : "0.7";
    }
    const hint = document.getElementById("device-id-hint");
    if (hint)
      hint.textContent = isAdmin ? t("device.id_hint") : t("device.id_hint_ro");

    const saveBtn = document.getElementById("btn-save-device");
    if (saveBtn) saveBtn.disabled = !isAdmin;
    const setBtn = document.getElementById("btn-set-device-id");
    if (setBtn) {
      // Button nur aktiv wenn Admin
      setBtn.disabled = !isAdmin;
    }
  } catch (e) {
    console.error("Could not check role", e);
  }
}

// Erstellt oder erneuert das Gerätezertifikat
function manageCertificate() {
  setDeviceId();
}

// Set device ID
async function setDeviceId() {
  const commonName =
    (document.getElementById("cert-common-name") || {}).value?.trim() ||
    document.getElementById("device-id")?.value?.trim();

  if (!commonName) {
    showNotification(t("notify.cert_cn_required"), "error");
    return;
  }

  const confirmMsg = window._certExists
    ? t("confirm.cert_renew", commonName)
    : t("confirm.cert_create", commonName);
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const response = await fetchWithAuth("api/device-id", {
      method: "POST",
      body: JSON.stringify({ device_id: commonName }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const msg = window._certExists
          ? t("cert.renewed", commonName)
          : t("cert.created", commonName);
        showNotification(msg, "success");
        setTimeout(() => {
          loadDeviceIdInfo();
          loadStatus();
        }, 2000);
      } else {
        showNotification(data.error || t("cert.create_err"), "error");
      }
    } else if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      showNotification(data.error || t("notify.admin_required"), "error");
    } else {
      const data = await response.json().catch(() => ({}));
      showNotification(data.error || t("cert.create_err"), "error");
    }
  } catch (error) {
    console.error("Error creating certificate:", error);
    showNotification(t("cert.create_err"), "error");
  }
}

// Load cert details into inline panel
async function loadCertDetailsInline() {
  const inline = document.getElementById("cert-details-inline");
  const pre = document.getElementById("cert-details-pre");
  if (!inline || !pre) return;
  try {
    const response = await fetchWithAuth("api/device-id/cert-info");
    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (_) {}
    if (data.details) {
      pre.textContent = data.details;
      inline.style.display = "flex";
      inline.style.flexDirection = "column";

      // Update cert-status indicator based on cert-info result
      const certStatus = document.getElementById("cert-status");
      if (certStatus) {
        const isValid = data.success && /status:\s*valid/i.test(data.details);
        const isExpired = /status:\s*expired/i.test(data.details);
        if (isValid) {
          certStatus.className = "cert-status success";
          certStatus.textContent = t("device.cert_active");
        } else if (isExpired) {
          certStatus.className = "cert-status error";
          certStatus.textContent = t("device.cert_expired") || "⚠ Expired";
        } else if (data.details && !data.success) {
          certStatus.className = "cert-status error";
          certStatus.textContent = t("device.cert_missing");
        }
      }
    }
  } catch (_) {}
}

// MQTT Port Toggle (c8y: 8883 = Core, 9883 = MQTT Service)
async function onMqttPortToggle(checked, save = true) {
  const port = checked ? 9883 : 8883;
  // show/hide mapping topic field
  const wrap = document.getElementById("c8y-mapping-topic-wrap");
  if (wrap) wrap.style.display = checked ? "block" : "none";

  const label8883 = document.getElementById("c8y-port-label-8883");
  const label9883 = document.getElementById("c8y-port-label-9883");
  const status = document.getElementById("c8y-port-status");
  const activeStyle =
    "font-size: 13px; font-weight: 600; color: var(--brand-primary);";
  const inactiveStyle = "font-size: 13px; color: var(--c8y-palette-gray-40);";
  if (label8883)
    label8883.style.cssText = checked ? inactiveStyle : activeStyle;
  if (label9883)
    label9883.style.cssText = checked ? activeStyle : inactiveStyle;
  if (status)
    status.textContent = checked
      ? t("connect.port_applied", 9883)
      : t("connect.port_applied", 8883);

  // Nur speichern wenn der Benutzer den Schalter betätigt hat (save=true)
  if (!save) return;

  if (status) status.textContent = "…";

  // 1. Alle Datalayer-Mappings deaktivieren wenn auf 9883 umgeschaltet wird,
  //    oder wieder aktivieren wenn zurück auf 8883.
  if (typeof _dlMappings !== "undefined" && _dlMappings.length > 0) {
    const shouldEnable = !checked; // 8883 → einschalten, 9883 → ausschalten
    const updated = _dlMappings.map((m) => ({ ...m, enabled: shouldEnable }));
    try {
      const mr = await fetchWithAuth("api/datalayer/mappings", {
        method: "POST",
        body: JSON.stringify({ mappings: updated }),
      });
      if (mr.ok) {
        _dlMappings = updated;
        if (typeof renderDatalayerMappings === "function")
          renderDatalayerMappings();
        setTimeout(() => {
          showNotification(
            checked
              ? t("notify.dl_mappings_disabled")
              : t("notify.dl_mappings_reenabled"),
            checked ? "warning" : "success",
          );
        }, 600);
      }
    } catch (_) {}
  }

  try {
    const r = await fetchWithAuth("api/set-mqtt-port", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port }),
    });
    const data = await r.json();
    if (data.success) {
      if (status) status.textContent = t("connect.port_applied", port);
      showNotification(t("connect.port_applied", port), "success");
      setTimeout(
        () => showNotification(t("connect.port_reconnect_hint"), "warning"),
        800,
      );
    } else {
      if (status)
        status.textContent = "⚠ " + (data.error || t("connect.port_err"));
      showNotification(data.error || t("connect.port_err"), "error");
    }
  } catch (e) {
    if (status) status.textContent = "⚠ " + t("connect.port_err");
    showNotification(t("connect.port_err"), "error");
  }
}

async function loadC8yMqttPort() {
  // Read c8y.mqtt_service.enabled from tedge config list
  // Fallback: mqttServiceEnabled from datalayer config (if tedge binary not available)
  try {
    const r = await fetchWithAuth("api/tedge-config-list");
    if (r.ok) {
      const data = await r.json();
      if (data.output && !data.output.startsWith("[tedge nicht")) {
        const match = data.output.match(
          /c8y\.mqtt_service\.enabled\s*=\s*(\S+)/,
        );
        const toggle = document.getElementById("c8y-mqtt-port-toggle");
        if (toggle) {
          const enabled = match ? match[1].trim() === "true" : false;
          toggle.checked = enabled;
          onMqttPortToggle(enabled, false);
          return;
        }
      }
    }
  } catch (_) {}
  // Fallback: read mqttServiceEnabled from datalayer config
  try {
    const r2 = await fetchWithAuth("api/datalayer/config");
    if (r2.ok) {
      const cfg = await r2.json();
      const enabled = cfg.mqttServiceEnabled === true;
      const toggle = document.getElementById("c8y-mqtt-port-toggle");
      if (toggle) {
        toggle.checked = enabled;
        onMqttPortToggle(enabled, false);
      }
    }
  } catch (_) {}
}

// Connect cloud via tedge connect <cloud>
async function connectCloud(cloud) {
  const names = { c8y: "Cumulocity IoT", aws: "AWS IoT", az: "Azure IoT" };
  const name = names[cloud] || cloud;
  if (!confirm(t("confirm.connect", name))) return;

  const viewer = document.getElementById("log-viewer");
  if (viewer) viewer.textContent = `Connecting to ${name}...`;

  try {
    const response = await fetchWithAuth(`api/connect/${cloud}`, {
      method: "POST",
    });
    const data = await response.json();

    if (viewer) {
      viewer.textContent = data.output || data.error || "(no output)";
      const sec = document.getElementById("sec-logs");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
    } else if (data.success) {
      showNotification(t("notify.connect_ok", name), "success");
      setTimeout(() => loadStatus(), 2000);
    } else {
      showNotification(t("notify.connect_fail", name), "error");
    }
  } catch (error) {
    console.error("Error connecting cloud:", error);
    showNotification(t("notify.connect_error"), "error");
  }
}

async function disconnectCloud(cloud) {
  const names = { c8y: "Cumulocity IoT", aws: "AWS IoT", az: "Azure IoT" };
  const name = names[cloud] || cloud;
  if (!confirm(t("confirm.disconnect", name))) return;

  const viewer = document.getElementById("log-viewer");
  if (viewer) viewer.textContent = `Disconnecting from ${name}...`;

  try {
    const response = await fetchWithAuth(`api/disconnect/${cloud}`, {
      method: "POST",
    });
    const data = await response.json();

    if (viewer) {
      viewer.textContent = data.output || data.error || "(no output)";
      const sec = document.getElementById("sec-logs");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
    } else if (data.success) {
      showNotification(t("notify.disconnect_ok", name), "success");
      setTimeout(() => loadStatus(), 2000);
    } else {
      showNotification(t("notify.disconnect_fail", name), "error");
    }
  } catch (error) {
    console.error("Error disconnecting cloud:", error);
    showNotification(t("notify.disconnect_error"), "error");
  }
}

async function reconnectCloud(cloud) {
  const names = { c8y: "Cumulocity IoT", aws: "AWS IoT", az: "Azure IoT" };
  const name = names[cloud] || cloud;
  if (!confirm(t("confirm.reconnect", name))) return;

  const viewer = document.getElementById("log-viewer");
  if (viewer) viewer.textContent = `Reconnecting to ${name}...`;

  try {
    const response = await fetchWithAuth(`api/reconnect/${cloud}`, {
      method: "POST",
    });
    const data = await response.json();

    if (viewer) {
      viewer.textContent = data.output || data.error || "(no output)";
      const sec = document.getElementById("sec-logs");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
    } else if (data.success) {
      showNotification(t("notify.reconnect_ok", name), "success");
      setTimeout(() => loadStatus(), 2000);
    } else {
      showNotification(t("notify.reconnect_fail", name), "error");
    }
  } catch (error) {
    console.error("Error reconnecting cloud:", error);
    showNotification(t("notify.reconnect_error"), "error");
  }
}

async function sendTestMessage(type) {
  const labels = {
    measurement: t("connect.test_meas"),
    event: t("connect.test_event"),
    alarm: t("connect.test_alarm"),
  };
  const label = labels[type] || type;

  // Mapping Topic nur mitschicken wenn Port 9883 aktiv
  const toggle = document.getElementById("c8y-mqtt-port-toggle");
  const mappingTopic =
    toggle && toggle.checked
      ? document.getElementById("c8y-mapping-topic")?.value.trim() || ""
      : "";

  const viewer = document.getElementById("log-viewer");
  if (viewer) viewer.textContent = `Sending ${label}...`;

  try {
    const body = { type };
    if (mappingTopic) body.topic = mappingTopic;

    const response = await fetchWithAuth("api/test-message", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (viewer) {
      viewer.textContent = data.output || data.error || "(no output)";
      const sec = document.getElementById("sec-logs");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
    } else if (data.success) {
      showNotification(t("notify.test_sent", label), "success");
    } else {
      showNotification(t("notify.test_fail", label), "error");
    }
  } catch (error) {
    console.error("Error sending test message:", error);
    showNotification(t("notify.test_error"), "error");
  }
}

function toggleCertUploadForm() {
  const form = document.getElementById("cert-upload-form");
  if (!form) return;
  const visible = form.style.display !== "none";
  form.style.display = visible ? "none" : "block";
  if (!visible) {
    const userEl = document.getElementById("c8y-upload-user");
    if (userEl) userEl.focus();
  } else {
    document.getElementById("c8y-upload-pass").value = "";
  }
}

async function submitCertUpload() {
  const username =
    (document.getElementById("c8y-upload-user") || {}).value || "";
  const password =
    (document.getElementById("c8y-upload-pass") || {}).value || "";

  if (!username) {
    showNotification(t("notify.cert_upload_user"), "error");
    return;
  }
  if (!password) {
    showNotification(t("notify.cert_upload_pass"), "error");
    return;
  }

  if (!confirm(t("confirm.cert_upload", username))) return;

  const btn = document.querySelector("#cert-upload-form .btn-primary");
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("notify.uploading");
  }

  const viewer = document.getElementById("log-viewer");
  if (viewer) viewer.textContent = "Uploading certificate to Cumulocity...";

  try {
    const response = await fetchWithAuth("api/cert/upload/c8y", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (viewer) {
      viewer.textContent = data.output || data.error || "(no output)";
      const sec = document.getElementById("sec-logs");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    }

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
    } else if (data.success) {
      showNotification(t("notify.cert_uploaded"), "success");
      document.getElementById("c8y-upload-pass").value = "";
      updateCertUploadStatusDisplay({
        uploaded: true,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        cloud: "c8y",
      });
      toggleCertUploadForm();
    } else {
      showNotification(t("notify.cert_upload_fail"), "error");
    }
  } catch (error) {
    console.error("Error uploading certificate:", error);
    showNotification(t("notify.upload_error"), "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t("device.upload_btn");
    }
  }
}

// Speichert die Datalayer-Konfiguration über die API
async function saveDatalayerConfig() {
  try {
    // IDs korrigieren (siehe Hinweis unten) und Werte holen
    const enabled =
      document.getElementById("datalayer-enabled")?.checked || false;
    const baseUrl = document.getElementById("datalayer-base-url")?.value || "";
    const username = document.getElementById("datalayer-username")?.value || "";
    const password = document.getElementById("datalayer-password")?.value || "";
    const acceptInvalidCerts =
      document.getElementById("datalayer-accept-invalid-certs")?.checked ||
      false;

    // WICHTIG: Hier muss parseInt() verwendet werden, um aus dem String "5000" die Zahl 5000 zu machen
    const pollIntervalStr =
      document.getElementById("datalayer-poll-interval")?.value || "5000";
    const pollIntervalMs = parseInt(pollIntervalStr, 10);

    const config = {
      enabled: enabled,
      base_url: baseUrl,
      poll_interval_ms: pollIntervalMs,
      username: username,
      password: password,
      accept_invalid_certs: acceptInvalidCerts,
    };

    const response = await fetchWithAuth("api/datalayer/config", {
      // Pfad inkl. /api/
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      showNotification(t("notify.dev_saved"), "success");
    } else {
      showNotification(t("notify.dl_config_err"), "error");
    }
  } catch (err) {
    showNotification(t("notify.dl_config_err"), "error");
    console.error("Fehler beim Speichern:", err);
  }
}

// (toggleColorPicker und setColorTheme sind am Dateianfang als hoisted Deklarationen definiert)

function applyColorTheme() {
  var color = localStorage.getItem("tedge-color") || "green";
  if (color !== "green")
    document.documentElement.setAttribute("data-color", color);
  document.querySelectorAll(".color-swatch").forEach(function (s) {
    s.classList.toggle("active", s.dataset.color === color);
  });
}

document.addEventListener("click", function (e) {
  var dd = document.getElementById("color-picker-dropdown");
  var wrap = document.getElementById("color-picker-wrap");
  if (dd && dd.style.display !== "none") {
    if (!wrap || !wrap.contains(e.target)) {
      dd.style.display = "none";
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  setLang(_lang); // apply i18n on load
  applyColorTheme();
  initCollapsibleSections();
});

function initCollapsibleSections() {
  // Map section IDs to their lazy-load functions.
  // Called once when the section is first opened.
  const lazyLoaders = {
    "sec-status": () => {
      loadStatus();
    },
    "sec-cloud": () => {
      loadConfiguration();
      loadC8yMqttPort();
    },
    "sec-device": () => {
      loadDeviceIdInfo();
      applyRoleRestrictions();
      loadCertDetailsInline();
    },
    "sec-device-config": () => {
      loadInventoryConfig();
    },
    "sec-actions": () => {
      loadC8yMqttPort();
    },
    "sec-logs": () => {
      updateLogLevelDropdown();
    },
    "sec-tedge-config": () => {
      loadTedgeConfig();
    },
    "sec-snap-config": () => {
      /* manual load on button click */
    },
    "sec-datalayer": () => {
      loadDatalayerStatus();
      loadDatalayerConfig();
      loadDatalayerMappings();
    },
    "sec-sysinfo": () => {
      loadBuildInfo();
    },
  };

  document.querySelectorAll(".card").forEach((section, index) => {
    const h2 = section.querySelector(":scope > h2");
    if (!h2) return;

    // Add chevron icon
    const icon = document.createElement("span");
    icon.className = "collapse-icon";
    icon.textContent = "▾";
    h2.appendChild(icon);

    // Wrap all siblings after h2 in card-body
    const body = document.createElement("div");
    body.className = "card-body";
    const siblings = Array.from(section.children).filter((c) => c !== h2);
    siblings.forEach((c) => body.appendChild(c));
    section.appendChild(body);

    // Collapse all except first
    if (index > 0) section.classList.add("collapsed");

    let loaded = index === 0; // first section already loaded via DOMContentLoaded

    // Toggle on h2 click + lazy load
    h2.addEventListener("click", () => {
      const wasCollapsed = section.classList.contains("collapsed");
      section.classList.toggle("collapsed");
      if (wasCollapsed && !loaded) {
        loaded = true;
        const loader = lazyLoaders[section.id];
        if (loader) loader();
      }
    });
  });
}

async function loadBuildInfo() {
  try {
    const response = await fetchWithAuth("api/build-info");
    if (!response.ok) return;
    const data = await response.json();
    const el = (id) => document.getElementById(id);
    if (el("tedge-version") && data.version)
      el("tedge-version").textContent = data.version;
    if (el("build-number") && data.build)
      el("build-number").textContent = data.build;
    if (el("snap-name") && data.snap_name)
      el("snap-name").textContent = data.snap_name;
    if (el("arch") && data.architecture)
      el("arch").textContent = data.architecture;
  } catch (e) {
    console.warn("Could not load build info:", e);
  }
}

// ── ctrlX Datalayer ──────────────────────────────────────────────────────────

let _dlMappings = []; // In-Memory Kopie der Mappings

/** 1. Initialisierung beim Laden */
function _initDatalayerUI() {
  loadDatalayerStatus();
  loadDatalayerConfig();
  loadDatalayerMappings();

  // Formular initial verstecken
  const section = document.getElementById("datalayer-mapping-section");
  if (section) section.style.display = "none";

  // Ein kleiner Delay stellt sicher, dass alle statischen Elemente
  setTimeout(() => {
    applyI18n();
  }, 150);
}

/** 2. Status laden (Abgestimmt auf deine i18n mit Emojis) */
async function loadDatalayerStatus() {
  const dotSvc = document.getElementById("datalayer-dot-service");
  const text = document.getElementById("datalayer-status-text");

  if (!dotSvc || !text) return;

  // Hilfsfunktion: Setzt Text und sorgt dafür, dass die Sprache umschaltbar bleibt
  const setStatus = (key) => {
    text.textContent = t(key);
    text.setAttribute("data-i18n", key);
  };

  // Start-Zustand: ⚪ | ⚪ Loading...
  dotSvc.textContent = "⚪";
  setStatus("status.loading");

  try {
    const r = await fetchWithAuth("api/datalayer/status");

    // Authentifizierungs-Fehler (Dienst läuft, aber Login falsch)
    if (r.status === 401 || r.status === 403) {
      dotSvc.textContent = "🟢";
      // Hier müsstest du evtl. noch 'status.noauth' ("🟡 Auth Error") in der i18n anlegen!
      setStatus("datalayer.status_noauth");
      return;
    }

    if (!r.ok) {
      // Webserver liefert Fehler: 🔴 | ⚪ Unknown
      dotSvc.textContent = "🔴";
      setStatus("status.unknown");
      return;
    }

    const d = await r.json();

    if (!d.enabled) {
      // Schalter ist aus -> Verbindung ist deaktiviert
      dotSvc.textContent = "⚫"; // Dienst-Punkt schwarz oder grau
      setStatus("status.inactive"); // "⚫ Verbindung deaktiviert"
    } else {
      // Dienst läuft
      dotSvc.textContent = "🟢";

      if (d.connected) {
        // Verbindung zum Datalayer steht
        text.textContent = `${t("status.running")} (${d.active_mappings}/${d.mapping_count} Mappings)`;
        text.removeAttribute("data-i18n");
      } else {
        // Dienst da, aber keine Verbindung
        setStatus("status.stopped"); // "🔴 Getrennt"
      }
    }
  } catch (e) {
    // Komplettabsturz (Rust-Backend weg): 🔴 | ⚪ Unknown
    dotSvc.textContent = "🔴";
    setStatus("status.unknown");
  }
}
async function loadDatalayerConfig() {
  try {
    const r = await fetchWithAuth("api/datalayer/config");
    if (!r.ok) return;
    const config = await r.json();

    if (document.getElementById("datalayer-enabled"))
      document.getElementById("datalayer-enabled").checked =
        config.enabled || false;
    if (document.getElementById("datalayer-base-url"))
      document.getElementById("datalayer-base-url").value =
        config.baseUrl || config.base_url || "";
    if (document.getElementById("datalayer-username"))
      document.getElementById("datalayer-username").value =
        config.username || "";
    if (document.getElementById("datalayer-poll-interval"))
      document.getElementById("datalayer-poll-interval").value =
        config.pollIntervalMs || config.poll_interval_ms || "5000";
    if (document.getElementById("datalayer-accept-invalid-certs"))
      document.getElementById("datalayer-accept-invalid-certs").checked =
        config.acceptInvalidCerts || config.accept_invalid_certs || false;
  } catch (e) {
    console.error("Fehler beim Laden der Datalayer-Konfig:", e);
  }
}

// ─── Snap Config Editor ──────────────────────────────────────────────────────

async function loadSnapConfigFile() {
  const select = document.getElementById("snapconfig-file-select");
  const editor = document.getElementById("snapconfig-editor");
  const hint = document.getElementById("snapconfig-path-hint");
  if (!select || !editor) return;

  const file = select.value;
  try {
    const r = await fetchWithAuth(
      `api/snapconfig?file=${encodeURIComponent(file)}`,
    );
    const data = await r.json();
    if (hint) hint.textContent = data.path || "";
    if (data.error && !data.content) {
      editor.value = `[Fehler: ${data.error}]`;
    } else {
      editor.value = data.content || "";
    }
  } catch (e) {
    showNotification(t("snapconfig.load_err"), "error");
    console.error("Fehler beim Laden:", e);
  }
}

async function saveSnapConfigFile() {
  const select = document.getElementById("snapconfig-file-select");
  const editor = document.getElementById("snapconfig-editor");
  if (!select || !editor) return;

  const file = select.value;
  const content = editor.value;
  try {
    const r = await fetchWithAuth("api/snapconfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, content }),
    });
    const data = await r.json();
    if (data.success) {
      showNotification(t("snapconfig.saved"), "success");
    } else {
      showNotification(data.error || t("snapconfig.save_err"), "error");
    }
  } catch (e) {
    showNotification(t("snapconfig.save_err"), "error");
    console.error("Fehler beim Speichern:", e);
  }
}

function copySnapConfigContent() {
  const editor = document.getElementById("snapconfig-editor");
  if (!editor || !editor.value) return;
  navigator.clipboard.writeText(editor.value).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = editor.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

// ─── Snap Config Editor Ende ─────────────────────────────────────────────────

// ─── Device Configuration (Inventory Editor) ─────────────────────────────────

function _setInvField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function _getInvField(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function loadInventoryConfig() {
  const status = document.getElementById("inventory-status");
  if (status) status.textContent = "Loading…";
  try {
    const r = await fetchWithAuth("api/inventory");
    const data = await r.json();

    let inv = {};
    try {
      inv = JSON.parse(data.content || "{}");
    } catch {}

    // c8y_Hardware
    const hw = inv.c8y_Hardware || {};
    _setInvField("inv-hw-model", hw.model || "");
    _setInvField("inv-hw-serial", hw.serialNumber || "");
    _setInvField("inv-hw-revision", hw.revision || "");

    // c8y_Firmware
    const fw = inv.c8y_Firmware || {};
    _setInvField("inv-fw-name", fw.name || "Linux");
    _setInvField("inv-fw-version", fw.version || "");
    _setInvField("inv-fw-url", fw.url || "");

    // c8y_Position
    const pos = inv.c8y_Position || {};
    _setInvField("inv-pos-lat", pos.lat != null ? String(pos.lat) : "");
    _setInvField("inv-pos-lng", pos.lng != null ? String(pos.lng) : "");
    _setInvField("inv-pos-alt", pos.alt != null ? String(pos.alt) : "");

    // c8y_Network → c8y_LAN
    const lan = (inv.c8y_Network || {}).c8y_LAN || {};
    _setInvField("inv-net-iface", lan.name || "");
    _setInvField("inv-net-ip", lan.ip || "");
    _setInvField("inv-net-mac", lan.mac || "");

    // ctrlX_Info
    const cx = inv.ctrlX_Info || {};
    _setInvField("inv-ctrlx-type", cx.device_type || "");
    _setInvField("inv-ctrlx-mfr", cx.manufacturer || "");

    // c8y_SoftwareList (read-only)
    const swPre = document.getElementById("inv-software-list");
    if (swPre) {
      const sw = inv.c8y_SoftwareList || [];
      swPre.textContent = sw.length
        ? sw.map((s) => `${s.name}  ${s.version}  ${s.url || ""}`).join("\n")
        : "—";
    }

    if (status) status.textContent = data.error ? `⚠ ${data.error}` : "";
  } catch (e) {
    showNotification("Failed to load inventory.json", "error");
    if (status) status.textContent = "";
  }
}

async function saveAndPublishInventory() {
  const status = document.getElementById("inventory-status");
  if (status) status.textContent = "Saving…";

  // Collect c8y_SoftwareList from existing (read-only)
  let softwareList = [];
  try {
    const r = await fetchWithAuth("api/inventory");
    const data = await r.json();
    const inv = JSON.parse(data.content || "{}");
    softwareList = inv.c8y_SoftwareList || [];
  } catch {}

  const payload = {
    c8y_Hardware: {
      model: _getInvField("inv-hw-model"),
      serialNumber: _getInvField("inv-hw-serial"),
      revision: _getInvField("inv-hw-revision"),
    },
    c8y_Firmware: {
      name: _getInvField("inv-fw-name"),
      version: _getInvField("inv-fw-version"),
      url: _getInvField("inv-fw-url"),
    },
    c8y_Position: {
      lat: parseFloat(_getInvField("inv-pos-lat")) || 0,
      lng: parseFloat(_getInvField("inv-pos-lng")) || 0,
      alt: parseFloat(_getInvField("inv-pos-alt")) || 0,
    },
    c8y_Network: {
      c8y_LAN: {
        name: _getInvField("inv-net-iface"),
        ip: _getInvField("inv-net-ip"),
        mac: _getInvField("inv-net-mac"),
        enabled: 1,
      },
    },
    ctrlX_Info: {
      device_type: _getInvField("inv-ctrlx-type"),
      manufacturer: _getInvField("inv-ctrlx-mfr"),
    },
    c8y_SoftwareList: softwareList,
  };

  try {
    const r = await fetchWithAuth("api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: JSON.stringify(payload, null, 2) }),
    });
    const data = await r.json();
    if (data.success) {
      const count = (data.published || []).length;
      const errs = (data.errors || []).length;
      if (errs > 0) {
        showNotification(
          `Saved. Published ${count} fragments, ${errs} failed.`,
          "warn",
        );
        if (status) status.textContent = `⚠ ${errs} publish errors`;
      } else {
        showNotification(
          `Saved & published ${count} inventory fragments.`,
          "success",
        );
        if (status) status.textContent = `✓ ${count} fragments published`;
      }
    } else {
      showNotification(data.error || "Save failed", "error");
      if (status) status.textContent = `✗ ${data.error || "Error"}`;
    }
  } catch (e) {
    showNotification("Save & publish failed", "error");
    if (status) status.textContent = "";
  }
}

// ─── Device Configuration Ende ───────────────────────────────────────────────

/** 3. Mapping aus dem Browser vorbereiten (Add to mapping) */
function prepareMapping(path) {
  const section = document.getElementById("datalayer-mapping-section");
  if (section) section.style.display = "block";

  const pathInput = document.getElementById("datalayer-mapping-path");
  const fieldInput = document.getElementById("datalayer-mapping-field");
  const unitInput = document.getElementById("datalayer-mapping-unit");
  applyI18n();

  pathInput.value = path;
  document.getElementById("datalayer-mapping-id").value = "";
  const titleEl = document.getElementById("mapping-form-title");
  if (titleEl) titleEl.textContent = t("datalayer.add_mapping_title");

  const lastPart = path.split("/").pop();
  fieldInput.value = lastPart;
  unitInput.value = "";

  updateTopicPrefix();
  pathInput.scrollIntoView({ behavior: "smooth" });
}

/** Liefert true wenn c8y.mqtt_service (Port 9883) aktiv ist */
function isMqttServiceActive() {
  const toggle = document.getElementById("c8y-mqtt-port-toggle");
  return toggle ? toggle.checked : false;
}

/** 4. Topic automatisch basierend auf Transform setzen */
function updateTopicPrefix() {
  const direction = document.getElementById(
    "datalayer-mapping-direction",
  ).value;
  const transform = document.getElementById(
    "datalayer-mapping-transform",
  ).value;
  const topicInput = document.getElementById("datalayer-mapping-topic");
  const path = document.getElementById("datalayer-mapping-path").value;
  const topicHint = document.getElementById("datalayer-mapping-topic-hint");

  const lastPart = path.split("/").pop() || "value";

  if (isMqttServiceActive()) {
    // MQTT Service (9883): c8y/mqtt/out/ Präfix erzwingen
    const prefix = "c8y/mqtt/out/";
    let topic = prefix;
    if (direction === "tedge_to_dl") {
      topic += "cmd/" + lastPart;
    } else {
      topic += lastPart;
    }
    topicInput.value = topic;
    if (topicHint) {
      topicHint.textContent = t("datalayer.topic_hint_service");
      topicHint.style.color = "var(--c8y-palette-status-warning, #e8760d)";
    }
  } else {
    // Core MQTT (8883): te/ Präfix
    let topic = "te/device/main///";
    if (direction === "tedge_to_dl") {
      topic += "cmd/plc/" + lastPart;
    } else {
      if (transform === "measurement") topic += "m/" + lastPart;
      else if (transform === "event") topic += "e/" + lastPart;
      else if (transform === "alarm") topic += "a/" + lastPart;
      else topic += "m/" + lastPart;
    }
    topicInput.value = topic;
    if (topicHint) {
      topicHint.textContent = t("datalayer.topic_hint_core");
      topicHint.style.color = "var(--c8y-palette-gray-40)";
    }
  }
}

/** 4b. Ein bestehendes Mapping zum Bearbeiten ins Formular laden */
function editDatalayerMapping(id) {
  const mapping = _dlMappings.find((m) => m.id === id);
  if (!mapping) return;

  const section = document.getElementById("datalayer-mapping-section");
  if (section) section.style.display = "block";

  document.getElementById("datalayer-mapping-id").value = mapping.id;
  document.getElementById("datalayer-mapping-path").value =
    mapping.path || mapping.datalayer_path || "";
  const existingTopic = mapping.topic || mapping.tedge_topic || "";
  let loadedTopic = existingTopic;
  // Im MQTT-Service-Modus: Präfix sicherstellen
  if (
    isMqttServiceActive() &&
    loadedTopic &&
    !loadedTopic.startsWith("c8y/mqtt/out/")
  ) {
    setTimeout(
      () => showNotification(t("notify.dl_topic_te_warning"), "warning"),
      200,
    );
  }
  document.getElementById("datalayer-mapping-topic").value = loadedTopic;
  document.getElementById("datalayer-mapping-direction").value =
    mapping.direction || "dl_to_tedge";

  const transformSelect = document.getElementById(
    "datalayer-mapping-transform",
  );
  if (transformSelect) {
    const tVal = (mapping.transform || "Measurement").toLowerCase();
    Array.from(transformSelect.options).forEach((opt) => {
      if (opt.value.toLowerCase() === tVal) opt.selected = true;
    });
  }

  document.getElementById("datalayer-mapping-field").value =
    mapping.field_name || "";
  document.getElementById("datalayer-mapping-unit").value = mapping.unit || "";

  const titleEl = document.getElementById("mapping-form-title");
  if (titleEl) titleEl.textContent = t("datalayer.edit_mapping_title");

  // Delete-Button nur anzeigen, wenn Mapping existiert (id vorhanden)
  const delBtn = document.getElementById("delete-mapping-btn");
  if (delBtn) delBtn.style.display = id ? "inline-block" : "none";
  section.scrollIntoView({ behavior: "smooth" });

  // Speichere aktuelle Mapping-ID für Delete
  window._currentMappingId = id;
  // Löscht das aktuell geladene Mapping aus dem Edit-Formular
  async function deleteCurrentMapping() {
    const id = window._currentMappingId;
    if (!id) return;
    if (!confirm(t("datalayer.confirm_delete") || "Mapping löschen?")) return;
    try {
      const r = await fetchWithAuth(
        `api/datalayer/mappings/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const d = await r.json();
      if (d.success) {
        showNotification(t("notify.dl_mapping_deleted"), "success");
        cancelMapping();
        loadDatalayerMappings();
        loadDatalayerStatus();
      } else {
        showNotification(d.error || t("notify.dl_mapping_del_err"), "error");
      }
    } catch (e) {
      showNotification(t("notify.dl_mapping_del_err"), "error");
    }
  }
}

/** 5. Mapping speichern (Neu oder Edit) */
async function saveNewMapping() {
  const idInput = document.getElementById("datalayer-mapping-id").value;
  const isEdit = !!idInput;

  // Topic holen und abschließenden Slash entfernen, falls vorhanden
  let topicRaw = document
    .getElementById("datalayer-mapping-topic")
    .value.trim();
  if (topicRaw.endsWith("/")) {
    topicRaw = topicRaw.replace(/\/+$/, "");
  }

  // Im MQTT-Service-Modus (9883) sicherstellen dass c8y/mqtt/out/ vorangestellt ist
  if (isMqttServiceActive()) {
    const prefix = "c8y/mqtt/out/";
    if (!topicRaw.startsWith(prefix)) {
      // Altes te/-Topic oder sonstiges: Präfix voranstellen
      const bare = topicRaw.replace(
        /^(te\/[^/]*\/[^/]*\/[^/]*\/[^/]*\/[^/]*\/|c8y\/[^/]*\/[^/]*\/)/,
        "",
      );
      topicRaw = prefix + (bare || topicRaw.replace(/\//g, "_"));
      document.getElementById("datalayer-mapping-topic").value = topicRaw;
      showNotification(
        `Topic auf "${topicRaw}" korrigiert (MQTT Service erfordert c8y/mqtt/out/ Präfix)`,
        "warning",
      );
    }
  }

  const body = {
    id: idInput,
    path: document.getElementById("datalayer-mapping-path").value.trim(),
    topic: topicRaw,
    direction: document.getElementById("datalayer-mapping-direction").value,
    transform: document.getElementById("datalayer-mapping-transform").value,
    field_name:
      document.getElementById("datalayer-mapping-field").value.trim() || null,
    unit:
      document.getElementById("datalayer-mapping-unit").value.trim() || null,
    enabled: true,
  };

  if (!body.path || !body.topic) {
    showNotification(t("notify.dl_path_required"), "warning");
    return;
  }

  try {
    let r, d;
    if (isEdit) {
      // Update bestehendes Mapping
      r = await fetchWithAuth(
        `api/datalayer/mappings/${encodeURIComponent(idInput)}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );
    } else {
      // Neues Mapping anlegen
      r = await fetchWithAuth("api/datalayer/mappings/add", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
    d = await r.json();

    if (d.success) {
      const msg = isEdit
        ? "Mapping erfolgreich aktualisiert"
        : t("notify.dl_mapping_added");
      showNotification(msg, "success");

      cancelMapping();
      loadDatalayerMappings();
      loadDatalayerStatus();
    } else {
      showNotification(d.error || t("notify.dl_mapping_add_err"), "error");
    }
  } catch (e) {
    showNotification(t("notify.dl_mapping_add_err"), "error");
  }
}

/** 6. Mapping-Formular abbrechen / leeren */
function cancelMapping() {
  const section = document.getElementById("datalayer-mapping-section");
  if (section) section.style.display = "none";

  [
    "datalayer-mapping-id",
    "datalayer-mapping-path",
    "datalayer-mapping-topic",
    "datalayer-mapping-field",
    "datalayer-mapping-unit",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // Delete-Button wieder ausblenden
  const delBtn = document.getElementById("delete-mapping-btn");
  if (delBtn) delBtn.style.display = "none";
  window._currentMappingId = null;
}

/** 7. Tabelle rendern */
function renderDatalayerMappings() {
  const tbody = document.getElementById("datalayer-mapping-table-body");
  if (!tbody) return;

  if (_dlMappings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="node-empty-hint" style="text-align:center; padding:20px;">${t("datalayer.no_mappings")}</td></tr>`;
    return;
  }

  const mqttServiceActive = isMqttServiceActive();
  tbody.innerHTML = "";
  _dlMappings.forEach((m) => {
    const p = m.path || m.datalayer_path || "";
    const t_topic = m.topic || m.tedge_topic || "";
    const trans = m.transform || "Measurement";
    const fieldName = m.field_name || "";
    const isWrite = m.direction === "tedge_to_dl";
    const dirIcon = isWrite ? "fa-arrow-left" : "fa-arrow-right";
    const dirTitle = isWrite
      ? t("datalayer.dir_tedge_to_dl")
      : t("datalayer.dir_dl_to_tedge");
    const dirColor = isWrite ? "#FD8200" : "var(--brand-primary)";

    // Transform label color
    let labelClass = "label-info";
    const transLower = trans.toLowerCase();
    if (transLower === "measurement") labelClass = "label-success";
    if (transLower === "alarm") labelClass = "label-warning";
    if (transLower === "raw") labelClass = "label-default";

    // Topic compatibility
    const topicIncompatible = mqttServiceActive && t_topic.startsWith("te/");
    const topicColor = topicIncompatible
      ? "var(--c8y-palette-status-warning, #e8760d)"
      : "inherit";
    const topicWarning = topicIncompatible
      ? `<i class="fa-solid fa-triangle-exclamation" style="color:#e8760d; margin-right:4px; font-size:11px;" title="Topic inkompatibel mit MQTT Service"></i>`
      : "";

    // Datalayer path: show last segment bold, rest grayed
    const pathParts = p.split("/").filter(Boolean);
    const pathLast = pathParts.pop() || p;
    const pathPrefix = pathParts.length > 0 ? pathParts.join("/") + "/" : "";
    const pathHtml = `<span style="color:var(--c8y-palette-gray-40);font-size:11px;">${pathPrefix}</span><strong>${pathLast}</strong>`;

    // Combined transform + field
    const fieldHtml = fieldName
      ? `<span class="label ${labelClass}" style="font-size:10px;">${trans.toUpperCase()}</span> <span style="font-size:12px;">${fieldName}</span>`
      : `<span class="label ${labelClass}" style="font-size:10px;">${trans.toUpperCase()}</span>`;

    const tr = document.createElement("tr");
    tr.className = "mapping-row";
    tr.style.cursor = "pointer";
    tr.title = "Klicken zum Bearbeiten";
    tr.addEventListener("click", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("input[type=checkbox]")
      )
        return;
      editDatalayerMapping(m.id);
    });

    tr.innerHTML = `
      <td class="cell-path" title="${p}" style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${pathHtml}</td>
      <td class="cell-topic text-truncate" title="${t_topic}" style="color:${topicColor}; max-width:200px;">${topicWarning}${t_topic}</td>
      <td class="text-center" title="${dirTitle}" style="font-size:16px; color:${dirColor}; width:32px;">
        <i class="fa-solid ${dirIcon}"></i>
      </td>
      <td style="white-space:nowrap;">${fieldHtml}</td>
      <td class="text-center" style="width:52px;">
        <label class="tedge-switch">
          <input type="checkbox" ${m.enabled ? "checked" : ""} onchange="toggleDatalayerMapping('${m.id}', this.checked)">
          <span class="tedge-switch-slider"></span>
        </label>
      </td>
      <td class="text-right" style="width:36px;">
        <button class="btn btn-dot text-danger" title="Löschen" onclick="event.stopPropagation(); deleteDatalayerMapping('${m.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (typeof applyI18n === "function") applyI18n();
}

/** 8. Mapping löschen */
async function deleteDatalayerMapping(id) {
  if (!confirm(t("datalayer.confirm_delete") || "Mapping löschen?")) return;

  try {
    const r = await fetchWithAuth(
      `api/datalayer/mappings/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    const d = await r.json();

    if (d.success) {
      showNotification(t("notify.dl_mapping_deleted"), "success");
      _dlMappings = _dlMappings.filter((m) => m.id !== id);
      renderDatalayerMappings();
      loadDatalayerStatus();
    } else {
      showNotification(d.error || t("notify.dl_mapping_del_err"), "error");
    }
  } catch (e) {
    showNotification(t("notify.dl_mapping_del_err"), "error");
  }
}

/** 9. Mapping umschalten (Aktiv/Inaktiv) */
async function toggleDatalayerMapping(id, enabled) {
  const updated = _dlMappings.map((m) => (m.id === id ? { ...m, enabled } : m));
  try {
    const r = await fetchWithAuth("api/datalayer/mappings", {
      method: "POST",
      body: JSON.stringify({ mappings: updated }),
    });
    if (r.ok) {
      _dlMappings = updated;
      renderDatalayerMappings();
      loadDatalayerStatus();
    }
  } catch (e) {
    console.warn("Toggle failed", e);
  }
}

/** 10. Mappings vom Server laden */
async function loadDatalayerMappings() {
  try {
    const r = await fetchWithAuth("api/datalayer/mappings");
    if (!r.ok) return;
    const d = await r.json();
    _dlMappings = d.mappings || [];
    renderDatalayerMappings();
  } catch (e) {
    console.error("Load Mappings Error:", e);
  }
}

/** 11. Datalayer Browsing */
async function browseDatalayer() {
  const pathInput = document.getElementById("datalayer-browse-path");
  const listBox = document.getElementById("datalayer-node-list");
  let path = pathInput.value.trim();

  if (!path.startsWith("/")) path = "/" + path;
  if (path === "/") path = "";

  listBox.innerHTML = `<div class="node-empty-hint">${t("status.loading")}</div>`;

  try {
    const r = await fetchWithAuth(
      `api/datalayer/browse?path=${encodeURIComponent(path)}`,
    );
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Browse failed");
    const nodeList = data.value || [];
    const formattedNodes = nodeList.map((name) => ({
      path: (path.endsWith("/") ? path : path + "/") + name,
    }));

    renderNodeList(formattedNodes);
  } catch (e) {
    listBox.innerHTML = `<div class="node-empty-hint text-danger">Fehler: ${e.message}</div>`;
  }
}

/** 12. Eine Ebene nach oben navigieren */
function datalayerUp() {
  const input = document.getElementById("datalayer-browse-path");
  let path = input.value.trim();
  if (!path || path === "/") return;

  const parts = path.split("/").filter((p) => p.length > 0);
  parts.pop();
  input.value = "/" + parts.join("/");
  browseDatalayer();
}

/** 13. Knoten-Liste in die Box rendern */
function renderNodeList(nodes) {
  const listBox = document.getElementById("datalayer-node-list");
  if (!nodes || nodes.length === 0) {
    listBox.innerHTML = `<div class="node-empty-hint">Keine Unterknoten gefunden.</div>`;
    return;
  }

  listBox.innerHTML = nodes
    .map((node) => {
      const fullPath = node.path;
      return `
            <div class="node-item">
                <span class="node-name" onclick="document.getElementById('datalayer-browse-path').value='${fullPath}'; browseDatalayer();">
                    ${fullPath.split("/").pop()}
                </span>
                <button class="btn-add-mapping" onclick="prepareMapping('${fullPath}')">Add</button>
            </div>
        `;
    })
    .join("");
}

// ── ctrlX Licensing ──────────────────────────────────────────────────────────

async function loadLicenses() {
  const loading = document.getElementById("licensing-loading");
  const table = document.getElementById("licensing-table");
  const tbody = document.getElementById("licensing-table-body");
  const errDiv = document.getElementById("licensing-error");

  if (loading) loading.style.display = "";
  if (table) table.style.display = "none";
  if (errDiv) errDiv.style.display = "none";

  try {
    const resp = await fetch("/thin-edge-io/api/licenses", {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    console.log("[licenses] raw response:", JSON.stringify(data));
    const licenses = Array.isArray(data)
      ? data
      : data.licenses || data.items || data.value || data.data || [];

    if (loading) loading.style.display = "none";

    if (licenses.length === 0) {
      if (errDiv) {
        errDiv.textContent = "No licenses found.";
        errDiv.style.display = "";
      }
      return;
    }

    tbody.innerHTML = licenses
      .map((lic) => {
        const name = lic.name || lic.appName || lic.title || "-";
        // ctrlX capabilities API: finalExpirationDate or isPermanent
        const validUntil = lic.isPermanent
          ? "Permanent"
          : lic.finalExpirationDate ||
            lic.endDate ||
            lic.validUntil ||
            lic.expiry ||
            lic.expirationDate ||
            "-";
        const qty = lic.count ?? lic.quantity ?? "-";
        // ctrlX capabilities: no explicit status field — active if present in list
        const active = lic.status
          ? lic.status === "valid" || lic.status === "active"
          : true;
        const statusColor = active
          ? "var(--c8y-brand-success, #27ae60)"
          : "var(--c8y-brand-danger, #e74c3c)";
        const statusLabel = lic.status || (active ? "active" : "inactive");
        return `<tr style="border-bottom:1px solid var(--c8y-palette-gray-80,#333)">
          <td style="padding:6px 8px">${name}</td>
          <td style="padding:6px 8px"><span style="color:${statusColor}">${statusLabel}</span></td>
          <td style="padding:6px 8px">${validUntil}</td>
          <td style="padding:6px 8px">${qty}</td>
        </tr>`;
      })
      .join("");

    if (table) table.style.display = "";
  } catch (e) {
    if (loading) loading.style.display = "none";
    if (errDiv) {
      errDiv.textContent = `Could not load license information: ${e.message}`;
      errDiv.style.display = "";
    }
  }
}
