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
    // Nav items
    "nav.setup": "Setup",
    "nav.edge": "Edge",
    "nav.status": "Status",
    "nav.service_control": "Service Control",
    "nav.certificate": "Zertifikat",
    "nav.connect": "Verbinden",
    "nav.logs": "Logs",
    "nav.tedge_config": "Tedge Config",
    "nav.device": "Geräte Konfig",
    "nav.snap_config": "Snap Config",
    "nav.datalayer": "Datalayer",
    "nav.licensing": "Lizenzierung",
    "nav.flows": "Flows",
    // Nav / Sections
    "section.status": "Verbindungsstatus",
    "section.service_control": "Service Control",
    "service.col.service": "Service",
    "service.col.status": "Status",
    "service.col.actions": "Aktionen",
    "section.cloud": "Cloud-Konfiguration",
    "section.cloud_col": "Cloud",
    "section.device_col": "Gerät & Zertifikat",
    "section.actions_col": "Aktionen",
    "section.cert_col": "Zertifikat",
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
    // Flows
    "section.flows": "Flows (JavaScript-Transformationen)",
    "flows.flow_label": "Flow",
    "flows.active_label": "Aktive Flows",
    "flows.archived_label": "Archivierte Flows",
    "flows.mapper_label": "Mapper",
    "flows.refresh": "Aktualisieren",
    "flows.upload_btn": "Flow hochladen (.toml)",
    "flows.new_btn": "Neu",
    "flows.loading": "Flows werden geladen...",
    "flows.empty": "Keine Flows vorhanden.",
    "flows.archived_empty": "Keine archivierten Flows.",
    "flows.restore_flow_btn": "Flow wiederherstellen",
    "flows.archive_flow_btn": "Flow archivieren",
    "datalayer.flow_select_label": "Flow auswählen",
    "datalayer.flow_select_placeholder": "— Flow auswählen —",
    "flows.editor_placeholder":
      'Flow in der Liste auswählen oder "Neu" klicken.',
    "flows.editor_placeholder_toml": "# TOML flow configuration",
    "flows.col.name": "Dateiname",
    "flows.col.actions": "Aktionen",
    "flows.btn_view": "Anzeigen",
    "flows.btn_delete": "Löschen",
    "flows.editor_close": "Schließen",
    "flows.editor_save": "Speichern",
    "flows.confirm_delete": (name) => `Flow "${name}" wirklich löschen?`,
    "flows.deleted": (name) => `Flow "${name}" gelöscht`,
    "flows.saved": (name) => `Flow "${name}" gespeichert`,
    "flows.upload_ok": (name) => `Flow "${name}" hochgeladen`,
    "flows.err_load": "Fehler beim Laden der Flows",
    "flows.err_save": "Fehler beim Speichern des Flows",
    "flows.err_delete": "Fehler beim Löschen des Flows",
    "flows.err_no_name": "Bitte Flow-Name eingeben",
    "flows.create_btn": "Erstellen",
    "flows.cancel_btn": "Abbrechen",
    "flows.delete_file_btn": "Datei löschen",
    "flows.delete_flow_btn": "Flow löschen",
    "flows.add_file_btn": "+ Datei",
    "flows.new_file_for": "Neue Datei in",
    "flows.new_file_hint": "Erlaubte Endungen: .js · .toml · .toml.template",
    "flows.confirm_delete_flow": (name) =>
      `Flow "${name}" und alle Dateien löschen?`,
    "flows.err_invalid_ext": "Erlaubte Endungen: .js, .toml, .toml.template",
    // Status
    "status.services": "Dienste",
    "status.mappers": "Mapper",
    "status.connection": "Verbindung",
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
    "cloud.configure_edge": "Konfigurieren",
    "cloud.download_ca_cert": "CA-Zertifikat herunterladen",
    "cloud.upload_self_cert": "Upload Certificate",
    "cloud.reset": "Zurücksetzen",
    "cloud.external_device_id": "Externe Geräte-ID",
    "cloud.job_log": "Job-Log",
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
    "device.mode_ca": "CA-Zertifikat",
    "device.mode_self": "Self-Signed",
    "device.ca_name": "Externe Geräte-ID:",
    "device.ca_name_hint":
      "Wird als CN für das CA-signierte Gerätezertifikat verwendet",
    "device.ca_otp": "Einmalpasswort:",
    "device.ca_otp_hint": "Einmalpasswort der CA für die Geräteregistrierung",
    "device.ca_request": "Zertifikat anfordern",
    "device.ca_waiting": "Warte auf Cloud-Freigabe…",
    "device.ca_starting": "Zertifikatsanfrage wird gestartet…",
    "device.ca_reg_hint":
      "Geräteregistrierung noch nicht gestartet. Bitte zuerst das Gerät registrieren:",
    "device.ca_reg_url_missing": "(zuerst C8Y-URL konfigurieren)",
    "device.cert_status": "Zertifikatsstatus:",
    "device.upload_status": "Upload-Status:",
    "device.save": "Speichern",
    "device.renew_cert": "Erneuern",
    "device.update_cert": "Aktualisieren",
    "device.create_cert": "Erstellen",
    "device.upload_cert": "Hochladen",
    "device.cert_unknown": "⚪ Unbekannt",
    "device.not_uploaded": "⚪ Noch nicht hochgeladen",
    "device.download_status": "Download Status:",
    "device.not_downloaded": "⚪ Noch nicht heruntergeladen",
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
    // Logs
    "logs.service": "Dienst",
    "logs.level": "Log-Level",
    "logs.apply": "Level anwenden",
    "logs.load": "Logs laden",
    "logs.copy": "Kopieren",
    "logs.copied": "Logs in Zwischenablage kopiert",
    "logs.diag_upload": "Diag Upload",
    "logs.diag_uploading": "Sammeln...",
    "logs.diag_upload_started":
      "Diagnose wird gesammelt und zu Cumulocity hochgeladen",
    "logs.diag_upload_error": "Diag-Upload fehlgeschlagen",
    "logs.placeholder": 'Klicke „Logs laden" um die letzten Einträge zu laden.',
    // Tedge
    "section.tedgeconfig": "Tedge",
    "nav.tedge_config": "Tedge",
    "tedgeconfig.load": "Laden",
    "tedgeconfig.copy": "Kopieren",
    "tedgeconfig.placeholder": 'Auf "Laden" klicken…',
    "tedgeconfig.loading": "Lade…",
    "tedgeconfig.error": (msg) => `Fehler: ${msg}`,
    "tedgeconfig.copied": "In Zwischenablage kopiert",
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
    "notify.ca_otp_required": "Bitte Einmalpasswort eingeben",
    "notify.ca_cert_requested": "Zertifikat erfolgreich heruntergeladen",
    "notify.ca_timeout":
      "Zeitüberschreitung: Keine Cloud-Freigabe innerhalb von 10 Minuten",
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
    // Mapping Mode
    "mappingmode.label": "Mapping-Modus",
    "mappingmode.col_label": "Mapping-Typ",
    "mappingmode.bridge": "ctrlX Datalayer Mapping",
    "mappingmode.flows": "Tedge Flow Mapping",
    "mappingmode.conflict": "⚠ Konflikt – beide aktiv",
    "mappingmode.warning":
      "⚠ Beide Modi sind aktiv — Daten werden doppelt an Cumulocity gesendet!",
    "mappingmode.hint":
      "ctrlX Datalayer Mapping: Datalayer → MQTT direkt · Tedge Flow Mapping: Datalayer → te/… → Flows → c8y/…",
    "mappingmode.applied": "Modus gespeichert.",
    "mappingmode.error": "Fehler beim Speichern des Modus.",
    "datalayer.topic_out": "tedge MQTT Topic - out",
    "datalayer.topic_in": "tedge MQTT Flow Topic - in",
    "datalayer.cloud_mapping_hint":
      "Stelle bitte sicher, dass ein entsprechendes Data Mapping in der Cloud konfiguriert ist – sei es durch Data Preparation, den Dynamic Mapper, einen Microservice oder ein anderes Mapping-Tool deiner Wahl.",
    // Snap Config Editor
    "section.snapconfig": "Konfigurationsdateien",
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
    "datalayer.enabled": "Mapping aktiviert",
    "datalayer.base_url": "Basis-URL:",
    "datalayer.poll_interval": "Poll-Intervall (ms):",
    "datalayer.username": "Benutzername:",
    "datalayer.password": "Passwort:",
    "datalayer.accept_invalid_certs": "Ungültige TLS-Zertifikate akzeptieren",
    "datalayer.node_browser": "Datalayer Knoten-Browser",
    "datalayer.browse_placeholder": "z.B. plc/app/Application",
    "datalayer.browser_hint": 'Pfad eingeben und „Durchsuchen" klicken.',
    "datalayer.browse_not_configured":
      "Datalayer Bridge ist deaktiviert oder keine Base-URL konfiguriert.",
    "datalayer.browse_error": "Fehler beim Laden:",
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
    "datalayer.payload_preview": "Datalayer Output",
  },
  en: {
    // Header
    "header.color": "Color",
    "header.new_tab": "⧉ New Tab",
    "header.title": "thin-edge.io Configuration Interface",
    "header.lang_de": "DE",
    "header.lang_en": "EN",
    // Nav items
    "nav.setup": "Setup",
    "nav.edge": "Edge",
    "nav.status": "Status",
    "nav.service_control": "Service Control",
    "nav.certificate": "Certificate",
    "nav.connect": "Connect",
    "nav.logs": "Logs",
    "nav.tedge_config": "Tedge",
    "nav.device": "Device Config",
    "nav.snap_config": "Snap Config",
    "nav.datalayer": "Datalayer",
    "nav.licensing": "Licensing",
    "nav.flows": "Flows",
    // Nav / Sections
    "section.status": "Connection Status",
    "section.service_control": "Service Control",
    "service.col.service": "Service",
    "service.col.status": "Status",
    "service.col.actions": "Actions",
    "section.cloud": "Cloud Configuration",
    "section.cloud_col": "Cloud",
    "section.device_col": "Device & Certificate",
    "section.actions_col": "Actions",
    "section.cert_col": "Certificate",
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
    // Flows
    "section.flows": "Flows (JavaScript Transformations)",
    "flows.flow_label": "Flow",
    "flows.active_label": "Active Flows",
    "flows.archived_label": "Archived Flows",
    "flows.mapper_label": "Mapper",
    "flows.refresh": "Refresh",
    "flows.upload_btn": "Upload Flow (.toml)",
    "flows.new_btn": "New",
    "flows.loading": "Loading flows...",
    "flows.empty": "No flows configured.",
    "flows.archived_empty": "No archived flows.",
    "flows.restore_flow_btn": "Restore flow",
    "flows.archive_flow_btn": "Archive flow",
    "datalayer.flow_select_label": "Select flow",
    "datalayer.flow_select_placeholder": "— Select flow —",
    "flows.editor_placeholder": 'Select a flow from the list or click "New".',
    "flows.editor_placeholder_toml": "# TOML flow configuration",
    "flows.col.name": "Filename",
    "flows.col.actions": "Actions",
    "flows.btn_view": "View",
    "flows.btn_delete": "Delete",
    "flows.editor_close": "Close",
    "flows.editor_save": "Save",
    "flows.confirm_delete": (name) => `Delete flow "${name}"?`,
    "flows.deleted": (name) => `Flow "${name}" deleted`,
    "flows.saved": (name) => `Flow "${name}" saved`,
    "flows.upload_ok": (name) => `Flow "${name}" uploaded`,
    "flows.err_load": "Error loading flows",
    "flows.err_save": "Error saving flow",
    "flows.err_delete": "Error deleting flow",
    "flows.err_no_name": "Please enter a flow name",
    "flows.create_btn": "Create",
    "flows.cancel_btn": "Cancel",
    "flows.delete_file_btn": "Delete File",
    "flows.delete_flow_btn": "Delete Flow",
    "flows.add_file_btn": "+ Add File",
    "flows.new_file_for": "New file in",
    "flows.new_file_hint": "Allowed extensions: .js · .toml · .toml.template",
    "flows.confirm_delete_flow": (name) =>
      `Delete flow "${name}" and all its files?`,
    "flows.err_invalid_ext": "Allowed extensions: .js, .toml, .toml.template",
    "status.services": "Services",
    "status.mappers": "Mappers",
    "status.connection": "Connection",
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
    "cloud.configure_edge": "Configure",
    "cloud.download_ca_cert": "Download CA-certificate",
    "cloud.upload_self_cert": "Upload Certificate",
    "cloud.reset": "Reset",
    "cloud.external_device_id": "External device id",
    "cloud.job_log": "Job Log",
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
    "device.mode_ca": "CA-Certificate",
    "device.mode_self": "Self-Signed",
    "device.ca_name": "External Device ID:",
    "device.ca_name_hint": "Used as CN for the CA-signed device certificate",
    "device.ca_otp": "One-Time Password:",
    "device.ca_otp_hint":
      "One-time password provided by the CA for device registration",
    "device.ca_request": "Request Certificate",
    "device.ca_waiting": "Waiting for cloud approval…",
    "device.ca_starting": "Starting certificate request…",
    "device.ca_reg_hint":
      "Device registration not yet started. Please register the device first:",
    "device.ca_reg_url_missing": "(configure C8Y URL first)",
    "device.cert_status": "Certificate Status:",
    "device.upload_status": "Upload Status:",
    "device.save": "Save",
    "device.renew_cert": "Renew",
    "device.update_cert": "Update",
    "device.create_cert": "Create",
    "device.upload_cert": "Upload",
    "device.cert_unknown": "⚪ Unknown",
    "device.not_uploaded": "⚪ Not yet uploaded",
    "device.download_status": "Download Status:",
    "device.not_downloaded": "⚪ Not yet downloaded",
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
    // Logs
    "logs.service": "Service",
    "logs.level": "Log Level",
    "logs.apply": "Apply Level",
    "logs.load": "Load Logs",
    "logs.copy": "Copy",
    "logs.copied": "Logs copied to clipboard",
    "logs.diag_upload": "Diag Upload",
    "logs.diag_uploading": "Collecting...",
    "logs.diag_upload_started":
      "Diagnostic collection started \u2014 file will be uploaded to Cumulocity",
    "logs.diag_upload_error": "Diag upload failed",
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
    "notify.ca_otp_required": "Please enter the one-time password",
    "notify.ca_cert_requested": "Certificate downloaded successfully",
    "notify.ca_timeout": "Timeout: No cloud approval within 10 minutes",
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
    // Mapping Mode
    "mappingmode.label": "Mapping Mode",
    "mappingmode.col_label": "Mapping Type",
    "mappingmode.bridge": "ctrlX Datalayer Mapping",
    "mappingmode.flows": "Tedge Flow Mapping",
    "mappingmode.conflict": "⚠ Conflict – both active",
    "mappingmode.warning":
      "⚠ Both modes are active — data will be sent twice to Cumulocity!",
    "mappingmode.hint":
      "ctrlX Datalayer Mapping: Datalayer → MQTT direct · Tedge Flow Mapping: Datalayer → te/… → Flows → c8y/…",
    "mappingmode.applied": "Mode saved.",
    "mappingmode.error": "Error saving mode.",
    "datalayer.topic_out": "tedge MQTT Topic - out",
    "datalayer.topic_in": "tedge MQTT Flow Topic - in",
    "datalayer.cloud_mapping_hint":
      "Please ensure that you have data mapping in place in the Cloud, using either Data Preparation, the Dynamic Mapper, a Microservice, or any other mapping tool.",
    // Snap Config Editor
    "section.snapconfig": "Configuration Files",
    // Tedge section
    "section.tedgeconfig": "Tedge",
    "nav.tedge_config": "Tedge",
    "tedgeconfig.load": "Load",
    "tedgeconfig.copy": "Copy",
    "tedgeconfig.placeholder": 'Click "Load"…',
    "tedgeconfig.loading": "Loading…",
    "tedgeconfig.error": (msg) => `Error: ${msg}`,
    "tedgeconfig.copied": "Copied to clipboard",
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
    "datalayer.enabled": "Enable Mapping",
    "datalayer.base_url": "Base URL:",
    "datalayer.poll_interval": "Poll interval (ms):",
    "datalayer.username": "Username:",
    "datalayer.password": "Password:",
    "datalayer.accept_invalid_certs": "Accept invalid TLS certificates",
    "datalayer.node_browser": "Datalayer Node Browser",
    "datalayer.browse_placeholder": "e.g. plc/app/Application",
    "datalayer.browser_hint": 'Enter a path and click "Browse".',
    "datalayer.browse_not_configured":
      "Datalayer Bridge is disabled or no Base URL configured.",
    "datalayer.browse_error": "Error loading:",
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
    "datalayer.payload_preview": "Datalayer Output",
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
// 1. Extract token from URL on startup
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get("token");
if (tokenFromUrl) {
  sessionStorage.setItem("ctrlx_token", tokenFromUrl);
  // Remove token from URL for a clean address bar appearance
  window.history.replaceState({}, document.title, window.location.pathname);
}

// 2. Enforce authentication: redirect to ctrlX login if no token is present.
//    Skip this check during local development (localhost / 127.0.0.1).
(function enforceAuth() {
  const isLocalDev = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  );
  if (isLocalDev) return;
  const storedToken = sessionStorage.getItem("ctrlx_token");
  if (!storedToken && !tokenFromUrl) {
    // No valid token — redirect to the ctrlX root, which will trigger the
    // platform's own login redirect for unauthenticated users.
    window.location.replace("/");
  }
})();

/**
 * Helper function that calls fetch() and automatically
 * includes the JWT token stored in sessionStorage.
 */
async function fetchWithAuth(url, options = {}) {
  // 1. Retrieve token from sessionStorage (stored there on login/page load)
  const token = sessionStorage.getItem("ctrlx_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    // Set both headers to be safe
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
        .querySelectorAll(".cloud-config")
        .forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    const cloud = tab.dataset.cloud;
    if (cloud) {
      const el = document.getElementById(cloud + "-config");
      if (el) el.classList.add("active");
    }
  });
});

// Load status on page load
window.addEventListener("DOMContentLoaded", () => {
  // Extract token from URL (ctrlX often passes it as ?token=...)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (token) {
    sessionStorage.setItem("ctrlx_token", token);
    // Optional: remove token from URL for a cleaner address bar
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Only load the first visible section (status) on startup.
  // All other sections load their data lazily when the user opens them.
  loadStatus();
  loadServiceControl();
  loadDatalayerStatus();
  checkLicenseStatus();

  // Apply persisted certificate mode (default: CA)
  _applyCertMode(getCertMode());

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
    if (sec && !sec.classList.contains("collapsed")) {
      loadStatus();
      loadServiceControl();
      loadDatalayerStatus();
    }
  }, 30000);
});

// Load service status

// ── Service Control ────────────────────────────────────────────────────────

const SERVICE_CONTROL_LIST = [
  { key: "mosquitto", svc: "mosquitto", label: "MQTT Broker (mosquitto)" },
  { key: "agent", svc: "tedge-agent", label: "Tedge Agent" },
  {
    key: "bridge",
    svc: "tedge-datalayer-bridge",
    label: "ctrlXDatalayer Bridge",
  },
  { key: "watchdog", svc: "tedge-watchdog", label: "Watchdog" },
  {
    key: "log_upload_manager",
    svc: "tedge-log-upload-manager",
    label: "Log Manager",
  },
  { key: "mapper_c8y", svc: "tedge-mapper-c8y", label: "Mapper C8Y" },
  { key: "mapper_aws", svc: "tedge-mapper-aws", label: "Mapper AWS" },
  { key: "mapper_az", svc: "tedge-mapper-az", label: "Mapper Azure" },
];

async function loadServiceControl() {
  const tbody = document.getElementById("service-control-tbody");
  if (!tbody) return;

  try {
    const r = await fetchWithAuth("api/status");
    if (!r.ok) throw new Error("Status load failed");
    const data = await r.json();

    tbody.innerHTML = "";
    SERVICE_CONTROL_LIST.forEach(({ key, svc, label }) => {
      const status = data[key] || "unknown";
      const isRunning = status === "running";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding:8px 12px; font-size:13px;">${label}</td>
        <td style="padding:8px 12px;">
          <span style="font-size:12px; color:var(--c8y-palette-gray-40);">${t("status." + status) || status}</span>
        </td>
        <td style="padding:8px 12px;">
          <button class="btn btn-outline-secondary btn-sm" onclick="serviceAction('start','${svc}')"
            ${isRunning ? "disabled" : ""} title="Start">▶</button>
          <button class="btn btn-outline-secondary btn-sm" onclick="serviceAction('stop','${svc}')"
            ${!isRunning ? "disabled" : ""} title="Stop">■</button>
          <button class="btn btn-outline-secondary btn-sm" onclick="serviceAction('restart','${svc}')"
            ${!isRunning ? "disabled" : ""} title="Restart">↺</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--c8y-brand-danger,#e74c3c);padding:16px;">${e.message}</td></tr>`;
  }
}

async function serviceAction(action, svc) {
  const endpointMap = {
    start: "start-service",
    stop: "stop-service",
    restart: "restart-service",
  };
  const endpoint = endpointMap[action];
  if (!endpoint) return;
  try {
    const r = await fetchWithAuth(`api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: svc }),
    });
    const d = await r.json();
    if (d.success) {
      showNotification(`${action} ${svc}: OK`, "success");
    } else {
      showNotification(`${action} ${svc}: ${d.error || "failed"}`, "error");
    }
  } catch (e) {
    showNotification(`${action} ${svc}: ${e.message}`, "error");
  }
  setTimeout(() => {
    loadStatus();
    loadServiceControl();
  }, 1500);
}

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
    // Cloud + Datalayer: text-only status in merged table
    const setStatusText = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t("status." + (data[key] || "unknown")) || "";
    };
    setStatusText("c8y-status-text", "c8y");
    setStatusText("aws-status-text", "aws");
    setStatusText("az-status-text", "az");
  } catch (error) {
    console.error("Error loading status:", error);
    showNotification(t("notify.status_load_err"), "error");
  }
}

// ── Certificate mode (CA vs Self-Signed) ────────────────────────────────────

// Persist mode in localStorage so it survives page reloads
const CERT_MODE_KEY = "certMode";

function getCertMode() {
  return localStorage.getItem(CERT_MODE_KEY) || "ca";
}

function syncCertName() {
  const src = document.getElementById("cert-ca-name");
  const dst = document.getElementById("cert-common-name");
  if (src && dst) dst.value = src.value;
}

function setCertMode(mode) {
  localStorage.setItem(CERT_MODE_KEY, mode);
  _applyCertMode(mode);
}

function _applyCertMode(mode) {
  const caFields = document.getElementById("cert-ca-fields");
  const selfFields = document.getElementById("cert-self-fields");
  const caStatusRow = document.getElementById("cert-ca-status-row");
  const actionsCa = document.getElementById("action-buttons-ca");
  const actionsSelf = document.getElementById("action-buttons-self");
  const toggle = document.getElementById("cert-mode-toggle");
  const labelCa = document.getElementById("cert-mode-label-ca");
  const labelSelf = document.getElementById("cert-mode-label-self");
  const activeStyle =
    "font-size:13px; font-weight:600; color:var(--brand-primary);";
  const inactiveStyle = "font-size:13px; color:var(--c8y-palette-gray-40);";

  if (mode === "ca") {
    if (toggle) toggle.checked = false;
    if (labelCa) labelCa.style.cssText = activeStyle;
    if (labelSelf) labelSelf.style.cssText = inactiveStyle;
    if (caFields) caFields.style.display = "";
    if (selfFields) selfFields.style.display = "none";
    if (caStatusRow) caStatusRow.style.display = "";
    if (actionsCa) actionsCa.style.display = "flex";
    if (actionsSelf) actionsSelf.style.display = "none";
    _syncCaStatus();
    _updateCaRegHint();
  } else {
    if (toggle) toggle.checked = true;
    if (labelCa) labelCa.style.cssText = inactiveStyle;
    if (labelSelf) labelSelf.style.cssText = activeStyle;
    if (caFields) caFields.style.display = "none";
    if (selfFields) selfFields.style.display = "";
    if (caStatusRow) caStatusRow.style.display = "none";
    if (actionsCa) actionsCa.style.display = "none";
    if (actionsSelf) actionsSelf.style.display = "flex";
    syncCertName();
  }
}

function _syncCaStatus() {
  const src = document.getElementById("cert-status");
  const dst = document.getElementById("cert-ca-status");
  if (!src || !dst) return;
  dst.className = src.className;
  dst.textContent = src.textContent;
  _updateOtpVisibility();
}

// Hide the OTP field when the certificate is active.
// Uses cert-ca-status (the CA-mode indicator) so this works reliably regardless
// of when the self-signed cert-status element is updated.
function _updateOtpVisibility() {
  const certCaStatus = document.getElementById("cert-ca-status");
  const otpGroup = document.querySelector("#cert-ca-fields .form-group");
  if (!otpGroup) return;

  const certActive = certCaStatus && certCaStatus.classList.contains("success");

  otpGroup.style.display = certActive ? "none" : "";
}

function updateCaDownloadStatusDisplay(timestamp) {
  const el = document.getElementById("cert-ca-download-status");
  if (!el) return;
  if (timestamp) {
    const ts = parseInt(timestamp, 10);
    const timeStr = !isNaN(ts)
      ? " (" + new Date(ts * 1000).toLocaleString() + ")"
      : "";
    el.textContent = "🟢 Downloaded" + timeStr;
    el.style.color = "var(--brand-primary, #53cd61)";
  } else {
    el.textContent = t("device.not_downloaded");
    el.style.color = "";
  }
  _updateOtpVisibility();
}

function onCaNameInput() {
  _updateCaRegHint();
}

function _updateCaRegHint() {
  const nameInput = document.getElementById("cert-ca-name");
  const hint = document.getElementById("cert-ca-reg-hint");
  const link = document.getElementById("cert-ca-reg-link");
  if (!nameInput || !hint || !link) return;

  const name = nameInput.value.trim();
  const certStatus = document.getElementById("cert-status");
  const isActive = certStatus && certStatus.classList.contains("success");

  if (name && !isActive) {
    const c8yUrl = (document.getElementById("c8y-url") || {}).value || "";
    const base = c8yUrl.replace(/\/+$/, "");
    // Only allow https:// URLs to prevent javascript: XSS via href
    let regUrl = "#";
    if (base) {
      try {
        const normalized = base.startsWith("http") ? base : "https://" + base;
        const parsed = new URL(normalized);
        if (parsed.protocol === "https:") {
          regUrl =
            parsed.origin +
            "/apps/devicemanagement/index.html#/deviceregistration";
        }
      } catch (_) {
        // invalid URL – keep regUrl as "#"
      }
    }
    link.href = regUrl;
    link.textContent =
      regUrl !== "#"
        ? regUrl
        : t("device.ca_reg_url_missing") || "(configure C8Y URL first)";
    hint.style.display = "";
  } else {
    hint.style.display = "none";
  }
}

async function requestCaCert() {
  const nameInput = document.getElementById("cert-ca-name");
  const otpInput = document.getElementById("cert-ca-otp");
  const name = (nameInput || {}).value?.trim();
  const otp = (otpInput || {}).value?.trim();

  if (!name) {
    showNotification(t("notify.cert_cn_required"), "error");
    return;
  }
  if (!otp) {
    showNotification(t("notify.ca_otp_required"), "error");
    return;
  }

  const btn = document.getElementById("btn-ca-request");
  const statusEl = document.getElementById("cert-ca-status");

  function setWaiting(msg) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "";
      const spinnerEl = document.createElement("span");
      spinnerEl.className = "ca-spinner";
      spinnerEl.setAttribute("aria-hidden", "true");
      btn.appendChild(spinnerEl);
      btn.appendChild(
        document.createTextNode(" " + (msg || t("device.ca_waiting"))),
      );
    }
    if (statusEl) {
      statusEl.textContent = msg || t("device.ca_waiting");
      statusEl.className = "text-muted";
    }
  }

  function resetBtn() {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t("device.ca_request");
    }
  }

  setWaiting(t("device.ca_starting"));

  let jobId = null;
  try {
    const response = await fetchWithAuth("api/device-id/ca-request", {
      method: "POST",
      body: JSON.stringify({ device_name: name, otp }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 403) {
      showNotification(data.error || t("notify.admin_required"), "error");
      resetBtn();
      return;
    }
    if (!data.success) {
      showNotification(data.error || t("cert.create_err"), "error");
      resetBtn();
      return;
    }

    jobId = data.job_id;
  } catch (e) {
    showNotification(
      t("cert.create_err") || t("notify.cert_upload_fail"),
      "error",
    );
    resetBtn();
    return;
  }

  if (!jobId) {
    // Should not happen – but treat as success for forward-compatibility
    showNotification(t("notify.ca_cert_requested"), "success");
    if (otpInput) otpInput.value = "";
    resetBtn();
    setTimeout(() => {
      loadDeviceIdInfo();
      loadCertDetailsInline();
    }, 2000);
    return;
  }

  // Poll for job completion (max ~10 min, every 5 s)
  setWaiting(t("device.ca_waiting"));
  let attempts = 0;
  const maxAttempts = 120; // 120 × 5 s = 600 s = 10 min
  const pollInterval = 5000;

  const poll = setInterval(async () => {
    attempts++;
    try {
      const r = await fetchWithAuth("api/device-id/ca-request/" + jobId);
      const d = await r.json().catch(() => ({}));

      if (d.status === "success") {
        clearInterval(poll);
        showNotification(t("notify.ca_cert_requested"), "success");
        if (otpInput) otpInput.value = "";
        resetBtn();
        updateCaDownloadStatusDisplay(String(Math.floor(Date.now() / 1000)));
        setTimeout(() => {
          loadDeviceIdInfo();
          loadCertDetailsInline();
        }, 1000);
      } else if (d.status === "error") {
        clearInterval(poll);
        showNotification(d.message || t("cert.create_err"), "error");
        resetBtn();
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.className = "";
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        showNotification(t("notify.ca_timeout"), "error");
        resetBtn();
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.className = "";
        }
      }
      // status === "pending" → keep polling
    } catch (_) {
      // network hiccup – keep polling
    }
  }, pollInterval);
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
    }

    if (config.aws) {
      document.getElementById("aws-url").value = config.aws["aws-url"] || "";
    }

    if (config.az) {
      document.getElementById("az-url").value = config.az["azure-url"] || "";
    }

    // Set mapper toggles from the actual service state (not from JSON config)
    // so the toggle always reflects the actual runtime state
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

    // Disable toggle if URL field is empty (no mapper without URL is possible)
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
function saveActiveCloudTab() {
  const active = document.querySelector("#sec-cloud .tab.active");
  const cloud = active ? active.dataset.cloud : "c8y";
  if (cloud === "aws") saveAwsConfig();
  else if (cloud === "az") saveAzConfig();
  else saveC8yConfig();
}

async function saveC8yConfig() {
  const config = {
    "c8y-url": document.getElementById("c8y-url").value,
    enabled: !!document.getElementById("c8y-url").value.trim(),
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
    enabled: !!document.getElementById("aws-url").value.trim(),
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
    enabled: !!document.getElementById("az-url").value.trim(),
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
  loadDatalayerStatus();
  loadServiceControl();
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

// Tedge command blocks: toggle accordion
function toggleTedgeCmd(id) {
  const pre = document.getElementById(id);
  const chevron = document.getElementById(id + "-chevron");
  if (!pre) return;
  const isOpen = pre.classList.toggle("open");
  if (chevron) chevron.classList.toggle("open", isOpen);
}

// Load command selected from the dropdown
async function loadTedgeCmdFromSelect() {
  const sel = document.getElementById("tedge-cmd-select");
  if (!sel) return;
  loadTedgeCmd("tedge-cmd-output", sel.value);
}

// Load output for a tedge command block
async function loadTedgeCmd(id, endpoint) {
  const pre = document.getElementById(id);
  if (!pre) return;
  pre.textContent = t("tedgeconfig.loading");
  try {
    const response = await fetchWithAuth(endpoint);
    if (response.status === 403) {
      pre.textContent = t("tedgeconfig.error", "Keine Berechtigung");
      return;
    }
    const data = await response.json();
    pre.textContent =
      data.output || t("tedgeconfig.error", data.error || "Unbekannter Fehler");
  } catch (err) {
    pre.textContent = t("tedgeconfig.error", err.message);
  }
}

function copyTedgeCmd(id) {
  const pre = document.getElementById(id);
  if (!pre || !pre.textContent) return;
  navigator.clipboard
    .writeText(pre.textContent)
    .then(() => showNotification(t("tedgeconfig.copied"), "success"))
    .catch(() => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(pre);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      showNotification(t("tedgeconfig.copied"), "success");
    });
}

// Legacy aliases (kept for backwards compatibility)
function loadTedgeConfig() {
  loadTedgeCmd("tedge-cmd-output", "api/tedge-config-list");
}
function copyTedgeConfig() {
  copyTedgeCmd("tedge-cmd-output");
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

async function runDiagUpload() {
  const btn = document.getElementById("diag-upload-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("logs.diag_uploading") || "Collecting...";
  }
  try {
    const res = await fetchWithAuth("api/diag-upload", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      showNotification(
        t("logs.diag_upload_started") ||
          "Diagnostic collection started — file will be uploaded to Cumulocity",
        "success",
      );
    } else {
      showNotification(
        json.error || t("logs.diag_upload_error") || "Diag upload failed",
        "error",
      );
    }
  } catch (e) {
    showNotification(
      t("logs.diag_upload_error") || "Diag upload failed",
      "error",
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t("logs.diag_upload") || "Diag Upload";
    }
  }
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
  // Use DOM methods to prevent XSS – never insert message via innerHTML
  const msgNode = document.createTextNode(message);
  const btnClose = document.createElement("button");
  btnClose.type = "button";
  btnClose.className = "close";
  btnClose.setAttribute("aria-label", "Close");
  btnClose.innerHTML = '<span aria-hidden="true">&times;</span>';
  btnClose.addEventListener("click", () => el.remove());
  el.appendChild(msgNode);
  el.appendChild(btnClose);
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

    // Pre-fill cert-common-name (self-signed) and cert-ca-name (CA) from current cert CN
    const cnField = document.getElementById("cert-common-name");
    const caNameField = document.getElementById("cert-ca-name");
    const cert =
      data.current &&
      data.current !== "not-set" &&
      !data.current.startsWith("No certificate")
        ? data.current
        : "";
    const raw = cert || data.system_serial || "";
    const nameWithoutPrefix = raw.replace(/^ctrlx-/i, "");
    const placeholder =
      (data.system_serial || "").replace(/^ctrlx-/i, "") || "device-name";
    if (cnField && !cnField.value) {
      cnField.value = nameWithoutPrefix;
      cnField.placeholder = placeholder || "e.g. ctrlx-001";
    }
    if (caNameField && !caNameField.value) {
      caNameField.value = nameWithoutPrefix ? "ctrlx-" + nameWithoutPrefix : "";
      caNameField.placeholder = placeholder
        ? "ctrlx-" + placeholder
        : "ctrlx-device-name";
    }
    syncCertName();

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
    // Keep CA status row in sync
    _syncCaStatus();
    _updateCaRegHint();
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

// Creates or renews the device certificate
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
        _syncCaStatus();
        _updateCaRegHint();
      }

      // Derive CA download status from cert details:
      // If cert is valid and CA-signed (issuer differs from subject), mark as downloaded.
      // Use the "Valid from" date as the download timestamp.
      if (data.success && data.details) {
        const issuerMatch = data.details.match(/Issuer:\s*(.+)/i);
        const subjectMatch = data.details.match(/Subject:\s*(.+)/i);
        const isSelfSigned =
          issuerMatch &&
          subjectMatch &&
          issuerMatch[1].trim() === subjectMatch[1].trim();
        if (!isSelfSigned && /status:\s*(valid|expired)/i.test(data.details)) {
          const fromMatch = data.details.match(/Valid from:\s*(.+)/i);
          let ts = null;
          if (fromMatch) {
            const d = new Date(fromMatch[1].trim());
            if (!isNaN(d.getTime()))
              ts = String(Math.floor(d.getTime() / 1000));
          }
          updateCaDownloadStatusDisplay(ts || "1");
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

  // Only save if the user has actually toggled the switch (save=true)
  if (!save) return;

  if (status) status.textContent = "…";

  // 1. Disable all datalayer mappings when switching to 9883,
  //    or re-enable when switching back to 8883.
  //    or re-enable when switching back to 8883.
  if (typeof _dlMappings !== "undefined" && _dlMappings.length > 0) {
    const shouldEnable = !checked; // 8883 → enable, 9883 → disable
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
          _mqttServiceEnabled = enabled;
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
      _mqttServiceEnabled = enabled;
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

// Saves the datalayer configuration via the API
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

// (toggleColorPicker and setColorTheme are declared as hoisted declarations at the top of the file)

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
  // Exposed globally so showNav() can trigger them too.
  window._sectionLazyLoaders = {
    "sec-status": () => {
      loadStatus();
      loadServiceControl();
    },
    "sec-cloud": () => {
      loadConfiguration();
      loadC8yMqttPort();
      _applyCertMode(getCertMode());
      loadDeviceIdInfo();
      applyRoleRestrictions();
      loadCertDetailsInline();
    },
    "sec-device": () => {
      /* merged into sec-cloud */
    },
    "sec-device-config": () => {
      loadInventoryConfig();
    },
    "sec-actions": () => {},
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
      // Ensure port toggle is set before updateTopicPrefix() is called
      loadC8yMqttPort().then(() => updateTopicPrefix());
    },
    "sec-sysinfo": () => {
      loadBuildInfo();
    },
    "sec-licensing": () => {
      loadLicenses();
    },
    "sec-flows": () => {
      loadFlows();
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

    // Toggle on h2 click — reload data every time the section is expanded
    h2.addEventListener("click", () => {
      const wasCollapsed = section.classList.contains("collapsed");
      section.classList.toggle("collapsed");
      if (wasCollapsed) {
        const loader = window._sectionLazyLoaders[section.id];
        if (loader) loader();
      }
      // Show/hide the header Save button together with the cloud config section.
      // Track the user's explicit expand/collapse so showNav() does not
      // auto-show the button on navigation / initial load.
      if (section.id === "sec-cloud") {
        const isNowExpanded = !section.classList.contains("collapsed");
        window._cloudConfigExpanded = isNowExpanded;
        const saveBtn = document.getElementById("header-save-btn");
        if (saveBtn) saveBtn.style.display = isNowExpanded ? "" : "none";
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
let _mqttServiceEnabled = null; // Cached MQTT service state (null = not yet loaded)

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

// ─── Mapping Mode ──────────────────────────────────────────────────────────

/** Sets the active mapping_type toggle (checkbox + label) in the edit form */
function setMappingTypeBtn(type) {
  const chk = document.getElementById("datalayer-mapping-type-chk");
  const label = document.getElementById("mtype-label");
  const hidden = document.getElementById("datalayer-mapping-type");
  const hint = document.getElementById("mtype-datalayer-hint");
  const flowWrap = document.getElementById("mtype-flow-select-wrap");

  if (chk) chk.checked = type === "flow";
  if (hidden) hidden.value = type;

  if (label) {
    label.setAttribute(
      "data-i18n",
      type === "flow" ? "mappingmode.flows" : "mappingmode.bridge",
    );
    label.textContent =
      type === "flow" ? t("mappingmode.flows") : t("mappingmode.bridge");
  }

  // Show cloud-mapping hint only for datalayer mode
  if (hint) hint.style.display = type === "flow" ? "none" : "";

  // Show flow selector only in flow mode
  if (flowWrap) {
    flowWrap.style.display = type === "flow" ? "" : "none";
    if (type === "flow") _loadFlowsDropdown(null);
  }

  // Topic field: readonly in flow mode (filled from dropdown)
  const topicInput = document.getElementById("datalayer-mapping-topic");
  if (topicInput) topicInput.readOnly = type === "flow";

  // Auto-update topic + placeholder based on selected type
  _applyMappingTypeToTopic(type);
}

/** Like setMappingTypeBtn but does NOT touch the topic field.
 *  Use this when loading an existing mapping so the stored topic is preserved. */
function _setMappingTypeVisual(type, existingTopic) {
  const chk = document.getElementById("datalayer-mapping-type-chk");
  const label = document.getElementById("mtype-label");
  const hidden = document.getElementById("datalayer-mapping-type");
  const hint = document.getElementById("mtype-datalayer-hint");
  const flowWrap = document.getElementById("mtype-flow-select-wrap");

  if (chk) chk.checked = type === "flow";
  if (hidden) hidden.value = type;

  if (label) {
    label.setAttribute(
      "data-i18n",
      type === "flow" ? "mappingmode.flows" : "mappingmode.bridge",
    );
    label.textContent =
      type === "flow" ? t("mappingmode.flows") : t("mappingmode.bridge");
  }

  if (hint) hint.style.display = type === "flow" ? "none" : "";

  // Show flow selector in flow mode; preselect matching flow if possible
  if (flowWrap) {
    flowWrap.style.display = type === "flow" ? "" : "none";
    if (type === "flow") _loadFlowsDropdown(existingTopic || null);
  }

  // Topic field: readonly in flow mode
  const topicInputVis = document.getElementById("datalayer-mapping-topic");
  if (topicInputVis) topicInputVis.readOnly = type === "flow";

  // Update placeholder only, not the value
  const topicInput = document.getElementById("datalayer-mapping-topic");
  if (topicInput) {
    const transform =
      document.getElementById("datalayer-mapping-transform")?.value ||
      "measurement";
    if (type === "flow") {
      if (transform === "event") topicInput.placeholder = "e.g. te/+/+/+/+/e/+";
      else if (transform === "alarm")
        topicInput.placeholder = "e.g. te/+/+/+/+/a/+";
      else topicInput.placeholder = "e.g. te/+/+/+/+/m/+";
    } else {
      if (transform === "event")
        topicInput.placeholder = "e.g. c8y/mqtt/out/myEvent";
      else if (transform === "alarm")
        topicInput.placeholder = "e.g. c8y/mqtt/out/myAlarm";
      else topicInput.placeholder = "e.g. c8y/mqtt/out/myMeasurement";
    }
  }
}

// ─── Flow dropdown for Datalayer mapping form ─────────────────────────────────

/** Cached flows data for the dropdown (set by _loadFlowsDropdown) */
let _dlFlowsCache = [];

/**
 * Loads active flows and populates the #datalayer-flow-select dropdown.
 * @param {string|null} matchTopic - if set, preselect the flow whose flow.toml topic matches
 */
async function _loadFlowsDropdown(matchTopic) {
  const sel = document.getElementById("datalayer-flow-select");
  if (!sel) return;

  // Keep current selection if dropdown already has options beyond the placeholder
  const currentSel = sel.value;

  sel.innerHTML = `<option value="">${t("datalayer.flow_select_placeholder") || "— Flow auswählen —"}</option>`;

  try {
    const mapper =
      document.getElementById("flows-mapper-select")?.value || "c8y";
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows?mapper=${encodeURIComponent(mapper)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!resp.ok) return;
    const data = await resp.json();
    const flows = data.flows || [];
    _dlFlowsCache = flows;

    flows.forEach((flow) => {
      const opt = document.createElement("option");
      opt.value = flow.name;
      opt.textContent = "📁 " + flow.name;
      sel.appendChild(opt);
    });

    // Try to preselect: first by matchTopic, then restore previous selection
    if (matchTopic) {
      const matched = flows.find((flow) => {
        const toml = (flow.files || []).find((f) => f.name === "flow.toml");
        if (!toml) return false;
        const extracted = _extractFlowTopic(toml.content || "");
        return extracted === matchTopic;
      });
      if (matched) {
        sel.value = matched.name;
        return; // don't update topic — it's already set (visual mode)
      }
    }

    // Restore previous selection if still valid
    if (currentSel && flows.find((f) => f.name === currentSel)) {
      sel.value = currentSel;
    }

    // If exactly one flow, auto-select and fill topic
    if (flows.length === 1 && !matchTopic) {
      sel.value = flows[0].name;
      onDatalayerFlowSelected();
    }
  } catch (err) {
    console.warn("[DL] Could not load flows for dropdown:", err);
  }
}

/**
 * Extracts the first topic from the flow.toml content string.
 * Handles both: input.mqtt.topics = ["te/+/..."]  and  topics = ["te/+/..."]
 */
function _extractFlowTopic(tomlContent) {
  // Match: input.mqtt.topics = ["<topic>"] or topics = ["<topic>"]
  const m = tomlContent.match(/input\.mqtt\.topics\s*=\s*\[\s*"([^"]+)"/);
  if (m) return m[1];
  // Also try bare topics = [...]
  const m2 = tomlContent.match(/^topics\s*=\s*\[\s*"([^"]+)"/m);
  if (m2) return m2[1];
  return null;
}

/** Called when the user selects a flow from the dropdown. */
function onDatalayerFlowSelected() {
  const sel = document.getElementById("datalayer-flow-select");
  if (!sel || !sel.value) return;

  const flow = _dlFlowsCache.find((f) => f.name === sel.value);
  if (!flow) return;

  const tomlFile = (flow.files || []).find((f) => f.name === "flow.toml");
  if (!tomlFile) return;

  const topic = _extractFlowTopic(tomlFile.content || "");
  if (topic) {
    const topicInput = document.getElementById("datalayer-mapping-topic");
    if (topicInput) topicInput.value = topic;
    showMappingPayloadPreview();
  }
}

/**
 * Infers the effective mapping_type from stored value + topic pattern.
 * Existing mappings without mapping_type default to "datalayer", but if their
 * topic is a flow wildcard (dl/+/+/+/+/m|e|a/+), treat them as "flow".
 */
function inferMappingType(m) {
  if (m.mapping_type === "flow") return "flow";
  const topic = m.topic || m.tedge_topic || "";
  if (/^dl\/\+\/\+\/\+\/\+\/[mea]\/\+$/.test(topic)) return "flow";
  return "datalayer";
}

/**
 * Sets the MQTT topic field based on the selected mapping type and transform.
 * - "datalayer": c8y/mqtt/out/<lastPathSegment>  (placeholder only if topic empty)
 * - "flow":      wildcard topic matching the transform type (always override)
 */
function _applyMappingTypeToTopic(type) {
  const topicInput = document.getElementById("datalayer-mapping-topic");
  const topicLabel = document.getElementById("datalayer-topic-label");
  if (!topicInput) return;

  // Update label
  if (topicLabel) {
    const key = type === "flow" ? "datalayer.topic_in" : "datalayer.topic_out";
    topicLabel.setAttribute("data-i18n", key);
    topicLabel.textContent = t(key);
  }

  const transform =
    document.getElementById("datalayer-mapping-transform")?.value ||
    "measurement";
  const path = document.getElementById("datalayer-mapping-path")?.value || "";
  const lastPart = path.split("/").filter(Boolean).pop() || "myMeasurement";

  if (type === "flow") {
    // For flow mode: always use the canonical wildcard subscription topic
    let flowTopic;
    if (transform === "event") flowTopic = "dl/+/+/+/+/e/+";
    else if (transform === "alarm") flowTopic = "dl/+/+/+/+/a/+";
    else flowTopic = "dl/+/+/+/+/m/+";

    topicInput.value = flowTopic;
    if (transform === "event") topicInput.placeholder = "e.g. dl/+/+/+/+/e/+";
    else if (transform === "alarm")
      topicInput.placeholder = "e.g. dl/+/+/+/+/a/+";
    else topicInput.placeholder = "e.g. dl/+/+/+/+/m/+";
  } else {
    // For datalayer mode: c8y/mqtt/out/<lastSegment>
    const suggested = "c8y/mqtt/out/" + lastPart;
    // Only overwrite if field is empty or already a flow-wildcard topic
    if (!topicInput.value || topicInput.value.startsWith("dl/+/")) {
      topicInput.value = suggested;
    }
    if (transform === "event")
      topicInput.placeholder = "e.g. c8y/mqtt/out/myEvent";
    else if (transform === "alarm")
      topicInput.placeholder = "e.g. c8y/mqtt/out/myAlarm";
    else topicInput.placeholder = "e.g. c8y/mqtt/out/myMeasurement";
  }

  showMappingPayloadPreview();
}

/** 2. Status laden (Abgestimmt auf deine i18n mit Emojis) */
async function loadDatalayerStatus() {
  const text = document.getElementById("datalayer-status-text");

  const setStatus = (key) => {
    if (text) {
      text.textContent = t(key);
      text.setAttribute("data-i18n", key);
    }
  };
  const setCustom = (str) => {
    if (text) {
      text.textContent = str;
      text.removeAttribute("data-i18n");
    }
  };

  // Start-Zustand
  setStatus("status.loading");

  try {
    const r = await fetchWithAuth("api/datalayer/status");

    if (r.status === 401 || r.status === 403) {
      setStatus("datalayer.status_noauth");
      return;
    }

    if (!r.ok) {
      setStatus("status.unknown");
      return;
    }

    const d = await r.json();

    if (!d.enabled) {
      setStatus("status.inactive");
    } else {
      if (d.connected) {
        setCustom(
          `${t("status.running")} (${d.active_mappings}/${d.mapping_count} Mappings)`,
        );
      } else {
        setStatus("status.stopped");
      }
    }
  } catch (e) {
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
  if (toggle) return toggle.checked;
  // Fallback: use cached value if toggle element not in DOM yet
  return _mqttServiceEnabled === true;
}

/** 4. Topic automatisch basierend auf Transform setzen */
function updateTopicPrefix() {
  const mappingType =
    document.getElementById("datalayer-mapping-type")?.value || "datalayer";

  // For flow mode, always use the canonical wildcard — delegate to _applyMappingTypeToTopic
  if (mappingType === "flow") {
    _applyMappingTypeToTopic("flow");
    return;
  }

  // For datalayer mode: delegate to _applyMappingTypeToTopic
  _applyMappingTypeToTopic("datalayer");
}

/** Zeigt eine Vorschau des Cloud-Payloads basierend auf aktuellen Formularwerten */
function _toggleUnitField() {
  const group = document.getElementById("datalayer-unit-group");
  if (!group) return;
  const transform =
    document.getElementById("datalayer-mapping-transform")?.value ||
    "measurement";
  group.style.display = transform === "measurement" ? "" : "none";
}

function _buildMqttServicePayload(transform, fieldName, unit, ts) {
  if (transform === "measurement") {
    const p = { [fieldName]: 42, time: ts };
    if (unit) p.unit = unit;
    p.externalId = "<device-external-id>";
    return p;
  } else if (transform === "event") {
    return {
      Text: "<datalayer-value>",
      type: "c8y_ctrlx_Event",
      time: ts,
      externalId: "<device-external-id>",
    };
  } else if (transform === "alarm") {
    return {
      Text: "<datalayer-value>",
      severity: "MAJOR",
      status: "ACTIVE",
      type: "c8y_ctrlx_Alarm",
      time: ts,
      externalId: "<device-external-id>",
    };
  } else {
    return { raw: "<datalayer-value>", externalId: "<device-external-id>" };
  }
}

function _buildFlowOutputPayload(transform, fieldName, unit, ts) {
  if (transform === "measurement") {
    // Published directly to c8y/measurement/measurements/create
    const series = unit ? { value: 42.0, unit } : { value: 42.0 };
    return { time: ts, type: fieldName, [fieldName]: { [fieldName]: series } };
  } else if (transform === "event") {
    // After thin-edge c8y mapper (adds type from topic path)
    const text = JSON.stringify({ [fieldName]: "<datalayer-value>", time: ts });
    return { type: fieldName, text, time: ts };
  } else if (transform === "alarm") {
    // After thin-edge c8y mapper (adds type from topic path)
    const text = JSON.stringify({ [fieldName]: "<datalayer-value>", time: ts });
    return {
      type: fieldName,
      text,
      severity: "MAJOR",
      status: "ACTIVE",
      time: ts,
    };
  } else {
    return { [fieldName]: "<datalayer-value>" };
  }
}

async function showMappingPayloadPreview() {
  const preDl = document.getElementById("datalayer-payload-preview");
  const preMqtt = document.getElementById("datalayer-mqtt-payload-preview");

  const isFlow =
    document.getElementById("datalayer-mapping-type")?.value === "flow";
  const transform =
    document.getElementById("datalayer-mapping-transform")?.value ||
    "measurement";
  const path =
    document.getElementById("datalayer-mapping-path")?.value.trim() || "";
  const fieldName =
    document.getElementById("datalayer-mapping-field").value.trim() ||
    path.split("/").pop() ||
    "value";
  const unit = document.getElementById("datalayer-mapping-unit").value.trim();
  const ts = new Date().toISOString();

  if (!isFlow) {
    // ── DATALAYER MODE ──
    const lblDl = document.getElementById("datalayer-output-label");
    const lblMqtt = document.getElementById("datalayer-mqtt-preview-label");
    if (lblDl) lblDl.textContent = "Datalayer Output";
    if (lblMqtt) lblMqtt.textContent = "Payload Preview";
    // Left: live REST call to datalayer (fallback to static example)
    if (preDl) {
      preDl.textContent = "…";
      if (path) {
        try {
          const r = await fetchWithAuth(
            `api/datalayer/node?path=${encodeURIComponent(path)}`,
          );
          if (r.ok) {
            const data = await r.json();
            preDl.textContent = JSON.stringify(data, null, 2);
          } else {
            preDl.textContent = JSON.stringify(
              { type: "double", value: 7441.35 },
              null,
              2,
            );
          }
        } catch {
          preDl.textContent = JSON.stringify(
            { type: "double", value: 7441.35 },
            null,
            2,
          );
        }
      } else {
        preDl.textContent = JSON.stringify(
          { type: "double", value: 7441.35 },
          null,
          2,
        );
      }
    }
    // Right: MQTT Service / c8y output format
    if (preMqtt) {
      preMqtt.textContent = JSON.stringify(
        _buildMqttServicePayload(transform, fieldName, unit, ts),
        null,
        2,
      );
    }
  } else {
    // ── FLOW MODE ──
    const lblDl = document.getElementById("datalayer-output-label");
    const lblMqtt = document.getElementById("datalayer-mqtt-preview-label");
    if (lblDl) lblDl.textContent = "Bridge Output";
    if (lblMqtt) lblMqtt.textContent = "Flow Output (main.js)";
    // Left: MQTT Service / c8y format (what the bridge-equivalent would produce)
    if (preDl) {
      preDl.textContent = JSON.stringify(
        _buildMqttServicePayload(transform, fieldName, unit, ts),
        null,
        2,
      );
    }
    // Right: flow output (what main.js produces → te/ topic format)
    if (preMqtt) {
      preMqtt.textContent = JSON.stringify(
        _buildFlowOutputPayload(transform, fieldName, unit, ts),
        null,
        2,
      );
    }
  }
}

function editDatalayerMapping(id) {
  const mapping = _dlMappings.find((m) => m.id === id);
  if (!mapping) return;

  const section = document.getElementById("datalayer-mapping-section");
  if (section) section.style.display = "block";

  document.getElementById("datalayer-mapping-id").value = mapping.id;
  document.getElementById("datalayer-mapping-path").value =
    mapping.path || mapping.datalayer_path || "";
  const existingTopic = mapping.topic || mapping.tedge_topic || "";
  document.getElementById("datalayer-mapping-topic").value = existingTopic;
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

  // Mapping-Typ toggle — infer from stored value + topic pattern, preserve stored topic
  _setMappingTypeVisual(inferMappingType(mapping), existingTopic);
  _toggleUnitField();
  showMappingPayloadPreview();

  const titleEl = document.getElementById("mapping-form-title");
  if (titleEl) titleEl.textContent = t("datalayer.edit_mapping_title");

  // Delete-Button nur anzeigen, wenn Mapping existiert (id vorhanden)
  const delBtn = document.getElementById("delete-mapping-btn");
  if (delBtn) delBtn.style.display = id ? "inline-block" : "none";
  section.scrollIntoView({ behavior: "smooth" });

  // Store current mapping ID for delete
  window._currentMappingId = id;
  // Deletes the currently loaded mapping from the edit form
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

  // Get topic and strip trailing slash if present
  let topicRaw = document
    .getElementById("datalayer-mapping-topic")
    .value.trim();
  if (topicRaw.endsWith("/")) {
    topicRaw = topicRaw.replace(/\/+$/, "");
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
    mapping_type:
      document.getElementById("datalayer-mapping-type")?.value || "datalayer",
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

  const pre = document.getElementById("datalayer-payload-preview");
  if (pre) pre.textContent = "";

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
  // Reset mapping-type toggle to default
  setMappingTypeBtn("datalayer");
  _toggleUnitField();
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
    tbody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.className = "node-empty-hint";
    td.style.cssText = "text-align:center; padding:20px;";
    td.textContent = t("datalayer.no_mappings");
    tr.appendChild(td);
    tbody.appendChild(tr);
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

    // Build table row with DOM methods to prevent XSS
    const tdPath = document.createElement("td");
    tdPath.className = "cell-path";
    tdPath.title = p;
    tdPath.style.cssText =
      "max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
    const pathPrefixSpan = document.createElement("span");
    pathPrefixSpan.style.cssText =
      "color:var(--c8y-palette-gray-40);font-size:11px;";
    pathPrefixSpan.textContent = pathPrefix;
    const pathLastStrong = document.createElement("strong");
    pathLastStrong.textContent = pathLast;
    tdPath.appendChild(pathPrefixSpan);
    tdPath.appendChild(pathLastStrong);

    const tdTopic = document.createElement("td");
    tdTopic.className = "cell-topic text-truncate";
    tdTopic.title = t_topic;
    tdTopic.style.cssText = `color:${topicColor}; max-width:200px;`;
    if (topicIncompatible) {
      const warnIcon = document.createElement("i");
      warnIcon.className = "fa-solid fa-triangle-exclamation";
      warnIcon.style.cssText =
        "color:#e8760d; margin-right:4px; font-size:11px;";
      warnIcon.title = "Topic inkompatibel mit MQTT Service";
      tdTopic.appendChild(warnIcon);
    }
    tdTopic.appendChild(document.createTextNode(t_topic));

    const tdField = document.createElement("td");
    tdField.style.whiteSpace = "nowrap";
    const transSpan = document.createElement("span");
    transSpan.className = `label ${labelClass}`;
    transSpan.style.cssText = "font-size:10px; padding:1px 6px;";
    transSpan.title = fieldName || "";
    transSpan.textContent =
      trans.charAt(0).toUpperCase() + trans.slice(1).toLowerCase(); // Measurement / Event / Alarm / Raw
    tdField.appendChild(transSpan);

    // Mapping-Typ column
    const mtype = inferMappingType(m);
    const tdMtype = document.createElement("td");
    tdMtype.style.cssText =
      "width:90px; font-size:12px; color:var(--c8y-palette-gray-30,#ccc); white-space:nowrap;";
    tdMtype.textContent = mtype === "flow" ? "Tedge Flow" : "ctrlX DL";

    const tdToggle = document.createElement("td");
    tdToggle.className = "text-center";
    tdToggle.style.width = "52px";
    const lbl = document.createElement("label");
    lbl.className = "tedge-switch";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!m.enabled;
    const mappingId = m.id;
    chk.addEventListener("change", () =>
      toggleDatalayerMapping(mappingId, chk.checked),
    );
    const slider = document.createElement("span");
    slider.className = "tedge-switch-slider";
    lbl.appendChild(chk);
    lbl.appendChild(slider);
    tdToggle.appendChild(lbl);

    const tdDel = document.createElement("td");
    tdDel.className = "text-right";
    tdDel.style.width = "36px";
    const delBtn = document.createElement("button");
    delBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-brand-danger,#c0392b); border:1px solid var(--c8y-brand-danger,#c0392b); border-radius:3px; cursor:pointer";
    delBtn.title = "Löschen";
    delBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      deleteDatalayerMapping(mappingId);
    });
    const delI = document.createElement("i");
    delI.className = "fas fa-trash";
    delBtn.appendChild(delI);
    tdDel.appendChild(delBtn);

    tr.appendChild(tdPath);
    tr.appendChild(tdTopic);
    tr.appendChild(tdField);
    tr.appendChild(tdMtype);
    tr.appendChild(tdToggle);
    tr.appendChild(tdDel);
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

  // Guard: Datalayer must be enabled and base_url configured
  const enabled =
    document.getElementById("datalayer-enabled")?.checked || false;
  const baseUrl =
    document.getElementById("datalayer-base-url")?.value?.trim() || "";
  if (!enabled || !baseUrl) {
    listBox.innerHTML = "";
    const hint = document.createElement("div");
    hint.className = "node-empty-hint text-danger";
    hint.textContent = t("datalayer.browse_not_configured");
    listBox.appendChild(hint);
    return;
  }

  let path = pathInput.value.trim();
  if (!path.startsWith("/")) path = "/" + path;
  if (path === "/") path = "";

  listBox.innerHTML = "";
  const loadingHint = document.createElement("div");
  loadingHint.className = "node-empty-hint";
  loadingHint.textContent = t("status.loading");
  listBox.appendChild(loadingHint);

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
    listBox.innerHTML = "";
    const errHint = document.createElement("div");
    errHint.className = "node-empty-hint text-danger";
    errHint.textContent = t("datalayer.browse_error") + " " + e.message;
    listBox.appendChild(errHint);
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
  listBox.innerHTML = "";
  if (!nodes || nodes.length === 0) {
    const hint = document.createElement("div");
    hint.className = "node-empty-hint";
    hint.textContent = "Keine Unterknoten gefunden.";
    listBox.appendChild(hint);
    return;
  }

  nodes.forEach((node) => {
    const fullPath = node.path;
    const item = document.createElement("div");
    item.className = "node-item";

    const span = document.createElement("span");
    span.className = "node-name";
    span.textContent = fullPath.split("/").pop();
    span.addEventListener("click", () => {
      document.getElementById("datalayer-browse-path").value = fullPath;
      browseDatalayer();
    });

    const btn = document.createElement("button");
    btn.className = "btn-add-mapping";
    btn.textContent = "Add";
    btn.addEventListener("click", () => prepareMapping(fullPath));

    item.appendChild(span);
    item.appendChild(btn);
    listBox.appendChild(item);
  });
}

// ── ctrlX Licensing ──────────────────────────────────────────────────────────

async function checkLicenseStatus() {
  try {
    const resp = await fetchWithAuth("api/license-status");
    if (!resp.ok) return;
    const data = await resp.json();
    const banner = document.getElementById("license-warning-banner");
    if (!banner) return;
    if (!data.licensed) {
      const reqName = data.required || "SWL-XCx-RUN-DLACCESSNRTxx-NNNN";
      // Build banner with DOM methods to prevent XSS via reqName
      banner.innerHTML = "";
      banner.appendChild(document.createTextNode("\u26A0 "));
      const strong = document.createElement("strong");
      strong.textContent = "License missing:";
      banner.appendChild(strong);
      banner.appendChild(
        document.createTextNode(
          " No valid ctrlX OS license found for this app. Please obtain license ",
        ),
      );
      const code = document.createElement("code");
      code.style.margin = "0 4px";
      code.textContent = reqName;
      banner.appendChild(code);
      banner.appendChild(document.createTextNode(" from the "));
      const aLocal = document.createElement("a");
      aLocal.style.cssText = "cursor:pointer;text-decoration:underline";
      aLocal.textContent = "ctrlX Licensing section";
      aLocal.addEventListener("click", scrollToLicensing);
      banner.appendChild(aLocal);
      banner.appendChild(document.createTextNode(" or "));
      const aExt = document.createElement("a");
      aExt.href = "/license-manager";
      aExt.target = "_blank";
      aExt.rel = "noopener";
      aExt.textContent = "Bosch Rexroth Licensing Center";
      banner.appendChild(aExt);
      banner.appendChild(document.createTextNode("."));
      banner.style.display = "block";
    } else {
      banner.style.display = "none";
    }
  } catch (e) {
    // silently ignore — banner stays hidden if endpoint not reachable
  }
}

function scrollToLicensing() {
  const sec = document.getElementById("sec-licensing");
  if (!sec) return;
  if (sec.classList.contains("collapsed")) sec.querySelector("h2")?.click();
  sec.scrollIntoView({ behavior: "smooth" });
}

async function loadLicenses() {
  const loading = document.getElementById("licensing-loading");
  const table = document.getElementById("licensing-table");
  const tbody = document.getElementById("licensing-table-body");
  const errDiv = document.getElementById("licensing-error");

  if (loading) loading.style.display = "";
  if (table) table.style.display = "none";
  if (errDiv) errDiv.style.display = "none";

  try {
    const resp = await fetchWithAuth("/thin-edge-io/api/licenses", {
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

    tbody.innerHTML = "";
    licenses.forEach((lic) => {
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
      // Build row with DOM methods to prevent XSS via license data
      const row = document.createElement("tr");
      row.style.borderBottom = "1px solid var(--c8y-palette-gray-80,#333)";
      const mkTd = (text) => {
        const td = document.createElement("td");
        td.style.padding = "6px 8px";
        td.textContent = text;
        return td;
      };
      row.appendChild(mkTd(name));
      const tdStatus = document.createElement("td");
      tdStatus.style.padding = "6px 8px";
      const statusSpan = document.createElement("span");
      statusSpan.style.color = statusColor;
      statusSpan.textContent = statusLabel;
      tdStatus.appendChild(statusSpan);
      row.appendChild(tdStatus);
      row.appendChild(mkTd(String(validUntil)));
      row.appendChild(mkTd(String(qty)));
      tbody.appendChild(row);
    });

    if (table) table.style.display = "";
  } catch (e) {
    if (loading) loading.style.display = "none";
    if (errDiv) {
      errDiv.textContent = `Could not load license information: ${e.message}`;
      errDiv.style.display = "";
    }
  }
}

// ── Flows Management ─────────────────────────────────────────────────────────

let _flowsCurrentFlow = null; // currently open flow directory name
let _flowsCurrentFile = null; // currently open file name
let _flowsNewFileTarget = null; // flow name for pending "add file" operation

function _flowsMapper() {
  const sel = document.getElementById("flows-mapper-select");
  return sel ? sel.value : "c8y";
}

function _showEditorState(state) {
  // state: "placeholder" | "add-file" | "editor"
  const placeholder = document.getElementById("flows-editor-placeholder");
  const addForm = document.getElementById("flows-new-file-form");
  const wrap = document.getElementById("flows-editor-wrap");
  if (placeholder)
    placeholder.style.display = state === "placeholder" ? "" : "none";
  if (addForm) addForm.style.display = state === "add-file" ? "" : "none";
  if (wrap) wrap.style.display = state === "editor" ? "" : "none";
}

async function loadFlows() {
  const loading = document.getElementById("flows-loading");
  const tree = document.getElementById("flows-tree");
  const empty = document.getElementById("flows-empty");
  const errDiv = document.getElementById("flows-error");
  const archivedLoading = document.getElementById("flows-archived-loading");
  const archivedTree = document.getElementById("flows-archived-tree");
  const archivedEmpty = document.getElementById("flows-archived-empty");

  if (loading) loading.style.display = "";
  if (tree) tree.style.display = "none";
  if (empty) empty.style.display = "none";
  if (errDiv) errDiv.style.display = "none";
  if (archivedLoading) archivedLoading.style.display = "";
  if (archivedTree) archivedTree.style.display = "none";
  if (archivedEmpty) archivedEmpty.style.display = "none";

  try {
    const mapper = _flowsMapper();
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows?mapper=${encodeURIComponent(mapper)}`,
      { headers: { Accept: "application/json" } },
    );
    if (resp.status === 403) {
      if (loading) loading.style.display = "none";
      if (archivedLoading) archivedLoading.style.display = "none";
      if (errDiv) {
        errDiv.textContent = t("notify.no_perm_status");
        errDiv.style.display = "";
      }
      return;
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const flows = data.flows || [];
    const archivedFlows = data.archived_flows || [];

    if (loading) loading.style.display = "none";
    if (archivedLoading) archivedLoading.style.display = "none";

    if (flows.length === 0) {
      if (empty) empty.style.display = "";
    } else if (tree) {
      _renderFlowsTree(flows, tree);
      tree.style.display = "";
      _highlightFlowFile(_flowsCurrentFlow, _flowsCurrentFile);
    }

    if (archivedFlows.length === 0) {
      if (archivedEmpty) archivedEmpty.style.display = "";
    } else if (archivedTree) {
      _renderArchivedFlowsTree(archivedFlows, archivedTree);
      archivedTree.style.display = "";
    }
  } catch (err) {
    if (loading) loading.style.display = "none";
    if (archivedLoading) archivedLoading.style.display = "none";
    if (errDiv) {
      errDiv.textContent = `${t("flows.err_load")}: ${err.message}`;
      errDiv.style.display = "";
    }
  }
}

function _fileIcon(name) {
  if (name.endsWith(".js")) return "📜";
  if (name === "flow.toml") return "⚙️";
  if (name.endsWith(".toml.template")) return "📋";
  if (name.endsWith(".toml")) return "📄";
  return "📄";
}

function _renderFlowsTree(flows, container) {
  container.innerHTML = "";
  flows.forEach((flow) => {
    // ── Flow header row ──
    const header = document.createElement("div");
    header.style.cssText = `
      display:flex; align-items:center; gap:4px;
      padding:7px 10px;
      background:var(--c8y-palette-gray-80,#252525);
      border-bottom:1px solid var(--c8y-palette-gray-70,#333);
      font-size:12px; font-weight:600;
    `;

    const nameSpan = document.createElement("span");
    nameSpan.style.cssText =
      "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:monospace;";
    nameSpan.textContent = "📁 " + flow.name;
    nameSpan.title = flow.name;
    header.appendChild(nameSpan);

    // "+ file" button
    const addBtn = document.createElement("button");
    addBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-palette-gray-30,#bbb); border:1px solid var(--c8y-palette-gray-60,#555); border-radius:3px; cursor:pointer";
    addBtn.title = t("flows.add_file_btn");
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      showAddFileForm(flow.name);
    };
    header.appendChild(addBtn);

    // archive button
    const archiveBtn = document.createElement("button");
    archiveBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-palette-gray-30,#bbb); border:1px solid var(--c8y-palette-gray-60,#555); border-radius:3px; cursor:pointer; margin-left:2px";
    archiveBtn.title = t("flows.archive_flow_btn") || "Flow archivieren";
    archiveBtn.innerHTML = '<i class="fas fa-archive"></i>';
    archiveBtn.onclick = (e) => {
      e.stopPropagation();
      archiveFlow(flow.name);
    };
    header.appendChild(archiveBtn);

    // delete flow button
    const delBtn = document.createElement("button");
    delBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-brand-danger,#c0392b); border:1px solid var(--c8y-brand-danger,#c0392b); border-radius:3px; cursor:pointer; margin-left:2px";
    delBtn.title = t("flows.delete_flow_btn");
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteFlow(flow.name);
    };
    header.appendChild(delBtn);

    container.appendChild(header);

    // ── File rows ──
    flow.files.forEach((file) => {
      const row = document.createElement("div");
      row.dataset.flow = flow.name;
      row.dataset.file = file.name;
      const isActive =
        flow.name === _flowsCurrentFlow && file.name === _flowsCurrentFile;
      row.style.cssText = `
        padding:5px 10px 5px 22px;
        font-family:monospace; font-size:12px;
        cursor:pointer;
        border-bottom:1px solid var(--c8y-palette-gray-70,#2a2a2a);
        background:${isActive ? "var(--c8y-brand-primary,#1776BF)" : "transparent"};
        color:${isActive ? "#fff" : "var(--c8y-palette-gray-10,#e0e0e0)"};
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      `;
      row.textContent = _fileIcon(file.name) + " " + file.name;
      row.title = file.name;
      row.onclick = () => openFileInEditor(flow.name, file.name, file.content);
      container.appendChild(row);
    });
  });
}

function _renderArchivedFlowsTree(archivedFlows, container) {
  container.innerHTML = "";
  archivedFlows.forEach((flow) => {
    const header = document.createElement("div");
    header.style.cssText = `
      display:flex; align-items:center; gap:4px;
      padding:7px 10px;
      background:var(--c8y-palette-gray-80,#252525);
      border-bottom:1px solid var(--c8y-palette-gray-70,#333);
      font-size:12px; font-weight:600;
    `;

    const nameSpan = document.createElement("span");
    nameSpan.style.cssText =
      "flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:monospace; color:var(--c8y-palette-gray-40,#999);";
    nameSpan.textContent = "📁 " + flow.name;
    nameSpan.title = flow.name;
    header.appendChild(nameSpan);

    // Restore button
    const restoreBtn = document.createElement("button");
    restoreBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-brand-success,#27ae60); border:1px solid var(--c8y-brand-success,#27ae60); border-radius:3px; cursor:pointer";
    restoreBtn.title = t("flows.restore_flow_btn") || "Flow wiederherstellen";
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i>';
    restoreBtn.onclick = (e) => {
      e.stopPropagation();
      restoreFlow(flow.name);
    };
    header.appendChild(restoreBtn);

    // Delete archived button
    const delBtn = document.createElement("button");
    delBtn.style.cssText =
      "font-size:11px; padding:2px 7px; background:transparent; color:var(--c8y-brand-danger,#c0392b); border:1px solid var(--c8y-brand-danger,#c0392b); border-radius:3px; cursor:pointer; margin-left:2px";
    delBtn.title = t("flows.delete_flow_btn");
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteArchivedFlow(flow.name);
    };
    header.appendChild(delBtn);

    container.appendChild(header);
  });
}

async function restoreFlow(flowName) {
  const mapper = _flowsMapper();
  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/restore?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(flowName)}`,
      { method: "POST", headers: { Accept: "application/json" } },
    );
    if (!resp.ok) {
      const d = await resp.json().catch(() => ({}));
      showNotification(d.error || `HTTP ${resp.status}`, "danger");
      return;
    }
    showNotification(`Flow "${flowName}" wiederhergestellt.`, "success");
    await loadFlows();
  } catch (err) {
    showNotification(`Fehler: ${err.message}`, "danger");
  }
}

async function archiveFlow(flowName) {
  const mapper = _flowsMapper();
  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/archive?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(flowName)}`,
      { method: "POST", headers: { Accept: "application/json" } },
    );
    if (!resp.ok) {
      const d = await resp.json().catch(() => ({}));
      showNotification(d.error || `HTTP ${resp.status}`, "danger");
      return;
    }
    showNotification(`Flow "${flowName}" archiviert.`, "success");
    await loadFlows();
  } catch (err) {
    showNotification(`Fehler: ${err.message}`, "danger");
  }
}

async function deleteArchivedFlow(flowName) {
  const mapper = _flowsMapper();
  if (!confirm(`Archivierten Flow "${flowName}" endgültig löschen?`)) return;
  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/archive?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(flowName)}`,
      { method: "DELETE", headers: { Accept: "application/json" } },
    );
    if (!resp.ok) {
      const d = await resp.json().catch(() => ({}));
      showNotification(d.error || `HTTP ${resp.status}`, "danger");
      return;
    }
    showNotification(`Archivierter Flow "${flowName}" gelöscht.`, "success");
    await loadFlows();
  } catch (err) {
    showNotification(`Fehler: ${err.message}`, "danger");
  }
}

function _highlightFlowFile(flowName, fileName) {
  const container = document.getElementById("flows-tree");
  if (!container) return;
  container.querySelectorAll("div[data-file]").forEach((row) => {
    const active =
      row.dataset.flow === flowName && row.dataset.file === fileName;
    row.style.background = active
      ? "var(--c8y-brand-primary,#1776BF)"
      : "transparent";
    row.style.color = active ? "#fff" : "var(--c8y-palette-gray-10,#e0e0e0)";
  });
}

function openFileInEditor(flowName, fileName, content) {
  _flowsCurrentFlow = flowName;
  _flowsCurrentFile = fileName;
  _highlightFlowFile(flowName, fileName);

  const breadcrumb = document.getElementById("flows-editor-breadcrumb");
  const editor = document.getElementById("flows-editor");
  if (breadcrumb) breadcrumb.textContent = `${flowName} / ${fileName}`;
  if (editor) editor.value = content;

  _showEditorState("editor");
}

async function saveCurrentFile() {
  if (!_flowsCurrentFlow || !_flowsCurrentFile) return;
  const editor = document.getElementById("flows-editor");
  const content = editor ? editor.value : "";
  const mapper = _flowsMapper();

  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/file?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(_flowsCurrentFlow)}&file=${encodeURIComponent(_flowsCurrentFile)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const label = `${_flowsCurrentFlow}/${_flowsCurrentFile}`;
    showNotification(t("flows.saved", label), "success");
    await loadFlows();
    _highlightFlowFile(_flowsCurrentFlow, _flowsCurrentFile);
  } catch (err) {
    showNotification(`${t("flows.err_save")}: ${err.message}`, "error");
  }
}

async function deleteCurrentFile() {
  if (!_flowsCurrentFlow || !_flowsCurrentFile) return;
  const name = `${_flowsCurrentFlow}/${_flowsCurrentFile}`;
  if (!confirm(t("flows.confirm_delete", name))) return;

  const mapper = _flowsMapper();
  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/file?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(_flowsCurrentFlow)}&file=${encodeURIComponent(_flowsCurrentFile)}`,
      { method: "DELETE", headers: { Accept: "application/json" } },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    showNotification(t("flows.deleted", name), "success");
    _flowsCurrentFlow = null;
    _flowsCurrentFile = null;
    _showEditorState("placeholder");
    await loadFlows();
  } catch (err) {
    showNotification(`${t("flows.err_delete")}: ${err.message}`, "error");
  }
}

async function deleteFlow(flowName) {
  const mapper = _flowsMapper();
  if (!confirm(t("flows.confirm_delete_flow", flowName))) return;

  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(flowName)}`,
      { method: "DELETE", headers: { Accept: "application/json" } },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    if (_flowsCurrentFlow === flowName) {
      _flowsCurrentFlow = null;
      _flowsCurrentFile = null;
      _showEditorState("placeholder");
    }
    showNotification(t("flows.deleted", flowName), "success");
    await loadFlows();
  } catch (err) {
    showNotification(`${t("flows.err_delete")}: ${err.message}`, "error");
  }
}

// ── New Flow form ─────────────────────────────────────────────────────────────

function showNewFlowForm() {
  const form = document.getElementById("flows-new-flow-form");
  const input = document.getElementById("flows-new-flow-name");
  if (form) form.style.display = "";
  if (input) {
    input.value = "";
    input.focus();
  }
  loadFlows();
}

function cancelNewFlow() {
  const form = document.getElementById("flows-new-flow-form");
  if (form) form.style.display = "none";
}

async function confirmNewFlow() {
  const input = document.getElementById("flows-new-flow-name");
  const rawName = input ? input.value.trim() : "";
  if (!rawName) {
    showNotification(t("flows.err_no_name"), "error");
    return;
  }

  const mapper = _flowsMapper();
  const content = `[flow]
version = "1.0"
description = "My flow"

[input.mqtt]
topics = ["te/+/+/+/+/m/+"]

[[steps]]
script = "main.js"
`;
  try {
    const resp = await fetchWithAuth(
      `/thin-edge-io/api/flows/file?mapper=${encodeURIComponent(mapper)}&flow=${encodeURIComponent(rawName)}&file=flow.toml`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    cancelNewFlow();
    await loadFlows();
    openFileInEditor(rawName, "flow.toml", content);
  } catch (err) {
    showNotification(`${t("flows.err_save")}: ${err.message}`, "error");
  }
}

// ── Add File form ─────────────────────────────────────────────────────────────

function showAddFileForm(flowName) {
  _flowsNewFileTarget = flowName;
  const label = document.getElementById("flows-new-file-flow-label");
  const input = document.getElementById("flows-new-file-name");
  if (label) label.textContent = flowName;
  if (input) {
    input.value = "";
    input.focus();
  }
  _showEditorState("add-file");
}

function cancelAddFile() {
  _flowsNewFileTarget = null;
  _showEditorState(
    _flowsCurrentFlow && _flowsCurrentFile ? "editor" : "placeholder",
  );
}

function _defaultFileContent(fileName) {
  if (fileName.endsWith(".js")) {
    return `const decoder = new TextDecoder();

export function onMessage(message, context) {
  const payload = JSON.parse(decoder.decode(message.payload));
  // TODO: transform payload
  return [{
    topic: message.topic,
    payload: JSON.stringify(payload),
  }];
}
`;
  }
  if (fileName.endsWith(".toml.template")) {
    return `# Configuration defaults for this flow.
# Copy to params.toml and edit values to override.

# threshold = 70.0
`;
  }
  return "";
}

async function confirmAddFile() {
  const input = document.getElementById("flows-new-file-name");
  const rawName = input ? input.value.trim() : "";
  if (!rawName) {
    showNotification(t("flows.err_no_name"), "error");
    return;
  }

  const validExts = [".js", ".toml", ".toml.template"];
  if (!validExts.some((ext) => rawName.endsWith(ext))) {
    showNotification(t("flows.err_invalid_ext"), "error");
    return;
  }

  const flowName = _flowsNewFileTarget;
  if (!flowName) return;

  _flowsNewFileTarget = null;
  openFileInEditor(flowName, rawName, _defaultFileContent(rawName));
  // File is created on disk only when the user clicks "Speichern"
  await loadFlows();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Navigator ────────────────────────────────────────────────────────
/**
 * Show a specific section and mark the corresponding nav-item as active.
 * @param {string} sectionId  - id of the <section> to show (e.g. "sec-cloud")
 * @param {Element|null} clickedEl - the .nav-item that was clicked
 */
function showNav(sectionId, clickedEl) {
  // Hide all navigable sections
  document.querySelectorAll("#main-container > section").forEach((s) => {
    s.style.display = "none";
  });

  // Check if target section belongs to a page group
  const targetEl = document.getElementById(sectionId);
  const pageGroup = targetEl ? targetEl.dataset.page : null;

  // Collect all sections to show
  const toShow = pageGroup
    ? Array.from(
        document.querySelectorAll(
          `#main-container > section[data-page="${pageGroup}"]`,
        ),
      )
    : targetEl
      ? [targetEl]
      : [];

  toShow.forEach((s) => {
    s.style.display = "block";
    if (s.classList.contains("collapsed")) {
      s.classList.remove("collapsed");
      if (!s.dataset.sectionLoaded) {
        s.dataset.sectionLoaded = "1";
        const loader =
          window._sectionLazyLoaders && window._sectionLazyLoaders[s.id];
        if (loader) loader();
      }
    }
  });

  // Remove active class from all nav items
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));

  // Add active to clicked element
  if (clickedEl) clickedEl.classList.add("active");

  // Show header save button on setup and device pages
  const saveBtn = document.getElementById("header-save-btn");
  const refreshBtn = document.getElementById("header-refresh-btn");
  if (refreshBtn) {
    const showRefresh =
      pageGroup === "status" ||
      pageGroup === "datalayer" ||
      pageGroup === "licensing";
    refreshBtn.style.display = showRefresh ? "" : "none";
    if (pageGroup === "datalayer")
      refreshBtn.onclick = () => loadDatalayerStatus();
    else if (pageGroup === "licensing")
      refreshBtn.onclick = () => loadLicenses();
    else refreshBtn.onclick = () => refreshStatus();
  }
  if (saveBtn) {
    // For the setup page the save button is controlled exclusively by the
    // sec-cloud h2 click handler (window._cloudConfigExpanded flag) so that
    // it does NOT appear automatically on page load or navigation.
    const showSave =
      (pageGroup === "setup" && !!window._cloudConfigExpanded) ||
      pageGroup === "device" ||
      pageGroup === "snap-config" ||
      pageGroup === "datalayer";
    saveBtn.style.display = showSave ? "" : "none";
    if (pageGroup === "device")
      saveBtn.onclick = () => saveAndPublishInventory();
    else if (pageGroup === "snap-config")
      saveBtn.onclick = () => saveSnapConfigFile();
    else if (pageGroup === "datalayer")
      saveBtn.onclick = () => saveDatalayerConfig();
    else saveBtn.onclick = () => saveActiveCloudTab();
  }

  // Persist current section
  sessionStorage.setItem("tedge-nav-section", sectionId);
}

/**
 * Toggle open/closed state of a nav-group.
 * @param {Element} headerEl - the .nav-group-header that was clicked
 */
function toggleNavGroup(headerEl) {
  const group = headerEl.closest(".nav-group");
  if (group) group.classList.toggle("open");
}

window.addEventListener("DOMContentLoaded", function () {
  // Determine which section to show (persisted or default)
  const saved = sessionStorage.getItem("tedge-nav-section") || "sec-cloud";
  const navItem = document.querySelector(`.nav-item[data-target="${saved}"]`);
  // Mark the default section as pre-loaded (data already loaded by other DOMContentLoaded handlers)
  const defaultTarget = document.getElementById(saved);
  if (defaultTarget) defaultTarget.dataset.sectionLoaded = "1";
  showNav(saved, navItem);

  // On initial load keep sec-cloud collapsed so the save button starts
  // hidden. The user explicitly expands the section to reveal both the
  // content and the save button.
  if (!window._cloudConfigExpanded) {
    const secCloud = document.getElementById("sec-cloud");
    if (secCloud) secCloud.classList.add("collapsed");
    const saveBtn = document.getElementById("header-save-btn");
    if (saveBtn) saveBtn.style.display = "none";
  }
});
