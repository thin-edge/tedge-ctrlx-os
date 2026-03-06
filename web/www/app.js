// thin-edge.io Configuration UI

// ── i18n ─────────────────────────────────────────────────────────────
const I18N = {
    de: {
        // Header
        'header.color':        'Farbe',
        'header.new_tab':      '⧉ New Tab',
        // Nav / Sections
        'section.status':      'Verbindungsstatus',
        'section.cloud':       'Cloud-Konfiguration',
        'section.device':      'Gerätekonfiguration & Zertifikat',
        'section.connect':     'Gerät verbinden',
        'section.logs':        'Logs & Diagnose',
        'section.sysinfo':     'Systeminformationen',
        // Status
        'status.services':     'Dienste',
        'status.clouds':       'Cloud-Verbindungen',
        'status.loading':      '⚪ Lädt...',
        'status.running':      '🟢 Läuft',
        'status.stopped':      '🔴 Gestoppt',
        'status.inactive':     '⚫ Inaktiv',
        'status.unknown':      '⚪ Unbekannt',
        'status.refresh':      'Status aktualisieren',
        // Cloud config
        'cloud.save':          'Konfiguration speichern',
        'cloud.save_short':    'Speichern',
        'cloud.c8y_mapper':    'Cumulocity IoT Mapper aktivieren',
        'cloud.aws_mapper':    'AWS IoT Mapper aktivieren',
        'cloud.az_mapper':     'Azure IoT Mapper aktivieren',
        // Device
        'device.id':           'Geräte-ID:',
        'device.name':         'Gerätename:',
        'device.name_hint':    'Wird als CN beim Erstellen des Gerätezertifikats verwendet',
        'device.id_hint':      'Eindeutiger Bezeichner (nur Admin kann ändern)',
        'device.id_hint_ro':   'Eindeutiger Bezeichner (nur Lesen – Admin erforderlich)',
        'device.cert_status':  'Zertifikatsstatus:',
        'device.upload_status':'Upload-Status:',
        'device.save':         'Speichern',
        'device.renew_cert':   'Zertifikat erneuern',
        'device.update_cert':  'Zertifikat aktualisieren',
        'device.create_cert':  'Zertifikat erstellen',
        'device.upload_cert':  'Zertifikat hochladen',
        'device.cert_unknown': '⚪ Unbekannt',
        'device.not_uploaded': '⚪ Noch nicht hochgeladen',
        'device.cert_active':  '🟢 Aktiv',
        'device.cert_missing': '🔴 Fehlt',
        'device.cert_details': 'Zertifikatsdetails',
        'device.c8y_user':     'Cumulocity Benutzername:',
        'device.c8y_pass':     'Passwort:',
        'device.upload_btn':   'Zertifikat hochladen',
        'device.cancel':       'Abbrechen',
        'device.creds_title':  'Cumulocity-Zugangsdaten',
        // Connect
        'connect.desc_c8y':    'Verbindet das Gerät mit Cumulocity IoT. Output erscheint im Log-Viewer unten.',
        'connect.desc_aws':    'Verbindet das Gerät mit AWS IoT. Output erscheint im Log-Viewer unten.',
        'connect.desc_az':     'Verbindet das Gerät mit Azure IoT Hub. Output erscheint im Log-Viewer unten.',
        'connect.btn':         'Verbinden',
        'connect.reconnect':   'Neu verbinden',
        'connect.disconnect':  'Trennen',
        'connect.setup':       'Setup ↗',
        'connect.test_title':  'Testnachrichten',
        'connect.test_desc':   'Publiziert eine Testnachricht via tedge mqtt pub auf den lokalen Broker. Output erscheint im Log-Viewer.',
        'connect.test_meas':   'Test Measurement',
        'connect.test_event':  'Test Event',
        'connect.test_alarm':  'Test Alarm',
        // Logs
        'logs.service':        'Dienst',
        'logs.level':          'Log-Level',
        'logs.apply':          'Level anwenden',
        'logs.load':           'Logs laden',
        'logs.placeholder':    'Klicke „Logs laden" um die letzten Einträge zu laden.',
        // Tedge Config
        'section.tedgeconfig':       'Tedge Konfiguration',
        'tedgeconfig.load':          'Konfiguration laden',
        'tedgeconfig.copy':          'Kopieren',
        'tedgeconfig.placeholder':   'Auf "Konfiguration laden" klicken, um die aktuelle Konfiguration anzuzeigen.',
        'tedgeconfig.loading':       'Lade Konfiguration…',
        'tedgeconfig.error':         (msg) => `Fehler beim Laden der Konfiguration: ${msg}`,
        'tedgeconfig.copied':        'Konfiguration in Zwischenablage kopiert',
        // Sysinfo
        'sysinfo.version':     'Version:',
        'sysinfo.build':       'Build:',
        'sysinfo.snap':        'Snap:',
        'sysinfo.arch':        'Architektur:',
        // Footer
        'footer.text':         'thin-edge.io IoT Edge Framework',
        // JS notifications
        'notify.status_error':      'Keine Berechtigung zum Anzeigen des Status',
        'notify.status_load_err':   'Servicestatus konnte nicht geladen werden',
        'notify.config_error':      'Keine Berechtigung zum Anzeigen der Konfiguration',
        'notify.config_load_err':   'Konfiguration konnte nicht geladen werden',
        'notify.c8y_saved':         'Cumulocity-Konfiguration gespeichert',
        'notify.c8y_save_err':      'Cumulocity-Konfiguration konnte nicht gespeichert werden',
        'notify.aws_saved':         'AWS-Konfiguration gespeichert',
        'notify.aws_save_err':      'AWS-Konfiguration konnte nicht gespeichert werden',
        'notify.az_saved':          'Azure-Konfiguration gespeichert',
        'notify.az_save_err':       'Azure-Konfiguration konnte nicht gespeichert werden',
        'notify.dev_saved':         'Gerätekonfiguration gespeichert',
        'notify.dev_save_err':      'Gerätekonfiguration konnte nicht gespeichert werden',
        'notify.refreshing':        'Status wird aktualisiert...',
        'notify.restart_confirm':   'Thin-edge.io-Dienste wirklich neu starten? Hierfür sind Admin-Rechte erforderlich.',
        'notify.restarting':        'Dienste werden neu gestartet...',
        'notify.restart_err':       'Dienste konnten nicht neu gestartet werden',
        'notify.no_perm_status':    'Keine Berechtigung für diesen Vorgang',
        'notify.cert_cn_required':  'Bitte Certificate Common Name eingeben',
        'notify.cert_upload_user':  'Bitte Cumulocity-Benutzername eingeben',
        'notify.cert_upload_pass':  'Bitte Passwort eingeben',
        'notify.uploading':         'Hochladen...',
        'notify.cert_uploaded':     'Zertifikat zu Cumulocity hochgeladen',
        'notify.cert_upload_fail':  'Zertifikat-Upload fehlgeschlagen',
        'notify.upload_error':      'Upload-Fehler',
        'notify.admin_required':    'Admin-Rechte erforderlich',
        'notify.connect_ok':        (name) => `Mit ${name} verbunden`,
        'notify.connect_fail':      (name) => `Verbindung zu ${name} fehlgeschlagen`,
        'notify.connect_error':     'Verbindungsfehler',
        'notify.disconnect_ok':     (name) => `Von ${name} getrennt`,
        'notify.disconnect_fail':   (name) => `Trennen von ${name} fehlgeschlagen`,
        'notify.disconnect_error':  'Trennfehler',
        'notify.reconnect_ok':      (name) => `Mit ${name} neu verbunden`,
        'notify.reconnect_fail':    (name) => `Neu verbinden mit ${name} fehlgeschlagen`,
        'notify.reconnect_error':   'Neu-Verbindungsfehler',
        'notify.test_sent':         (label) => `${label} gesendet`,
        'notify.test_fail':         (label) => `${label} fehlgeschlagen`,
        'notify.test_error':        'Fehler beim Senden',
        'notify.cert_details_ok':   'Zertifikatsdetails im Log-Viewer geladen',
        'notify.cert_details_err':  'Fehler beim Laden der Zertifikatsdetails',
        'notify.no_perm_device':    'Keine Berechtigung zum Anzeigen der Geräteinformationen',
        // Confirm dialogs
        'confirm.connect':          (name) => `Mit ${name} verbinden?\n\nDies stellt die Cloud-Verbindung her.`,
        'confirm.disconnect':       (name) => `Von ${name} trennen?\n\nDies trennt die Cloud-Verbindung.`,
        'confirm.reconnect':        (name) => `Mit ${name} neu verbinden?\n\nDies trennt die Verbindung und stellt sie neu her.`,
        'confirm.cert_create':      (cn) => `Zertifikat erstellen mit Common Name "${cn}"?\n\nDies startet thin-edge.io-Dienste neu.`,
        'confirm.cert_renew':       (cn) => `Zertifikat erneuern mit Common Name "${cn}"?\n\n⚠️ Das bestehende Zertifikat wird ersetzt!\nDanach muss das Zertifikat erneut hochgeladen werden.\n\nDies startet thin-edge.io-Dienste neu.`,
        'confirm.cert_upload':      (user) => `Zertifikat zu Cumulocity IoT hochladen?\n\nDas Gerätezertifikat wird unter dem Benutzer "${user}" in Cumulocity registriert.`,
        // Log viewer
        'logs.loading':             (svc) => `Lade Logs für ${svc}...`,
        'logs.no_perm':             'Keine Berechtigung zum Anzeigen der Logs.',
        'logs.empty':               '(Keine Log-Einträge gefunden)',
        'logs.load_error':          (msg) => `Fehler beim Laden der Logs: ${msg}`,
        'logs.level_set':           (svc, lvl) => `Log-Level für "${svc}" auf "${lvl}" gesetzt. Dienst wird neu gestartet.`,
        'logs.level_err':           'Fehler beim Setzen des Log-Levels',
        'logs.no_perm_level':       'Keine Berechtigung zum Ändern des Log-Levels',
        // cert upload status
        'cert.uploaded_to':         (cloud, time) => `🟢 Hochgeladen zu ${cloud}${time}`,
        // cert create verb
        'cert.created':             (cn) => `Zertifikat erstellt mit CN: ${cn}`,
        'cert.renewed':             (cn) => `Zertifikat erneuert mit CN: ${cn}`,
        'cert.create_err':          'Fehler beim Erstellen des Zertifikats',
    },
    en: {
        // Header
        'header.color':        'Color',
        'header.new_tab':      '⧉ New Tab',
        // Nav / Sections
        'section.status':      'Connection Status',
        'section.cloud':       'Cloud Configuration',
        'section.device':      'Device Configuration & Certificate',
        'section.connect':     'Connect Device',
        'section.logs':        'Logs & Diagnostics',
        'section.sysinfo':     'System Information',
        // Status
        'status.services':     'Services',
        'status.clouds':       'Cloud Connections',
        'status.loading':      '⚪ Loading...',
        'status.running':      '🟢 Running',
        'status.stopped':      '🔴 Stopped',
        'status.inactive':     '⚫ Inactive',
        'status.unknown':      '⚪ Unknown',
        'status.refresh':      'Refresh Status',
        // Cloud config
        'cloud.save':          'Save Configuration',
        'cloud.save_short':    'Save',
        'cloud.c8y_mapper':    'Enable Cumulocity IoT Mapper',
        'cloud.aws_mapper':    'Enable AWS IoT Mapper',
        'cloud.az_mapper':     'Enable Azure IoT Mapper',
        // Device
        'device.id':           'Device ID:',
        'device.name':         'Device Name:',
        'device.name_hint':    'Used as CN when creating the device certificate',
        'device.id_hint':      'The unique device identifier',
        'device.id_hint_ro':   'The unique device identifier (read-only – admin only)',
        'device.cert_status':  'Certificate Status:',
        'device.upload_status':'Upload Status:',
        'device.save':         'Save',
        'device.renew_cert':   'Renew Certificate',
        'device.update_cert':  'Update Certificate',
        'device.create_cert':  'Create Certificate',
        'device.upload_cert':  'Upload Certificate',
        'device.cert_unknown': '⚪ Unknown',
        'device.not_uploaded': '⚪ Not yet uploaded',
        'device.cert_active':  '🟢 Active',
        'device.cert_missing': '🔴 Missing',
        'device.cert_details': 'Certificate Details',
        'device.c8y_user':     'Cumulocity Username:',
        'device.c8y_pass':     'Password:',
        'device.upload_btn':   'Upload Certificate',
        'device.cancel':       'Cancel',
        'device.creds_title':  'Cumulocity Credentials',
        // Connect
        'connect.desc_c8y':    'Connects the device to Cumulocity IoT. Output appears in the log viewer below.',
        'connect.desc_aws':    'Connects the device to AWS IoT. Output appears in the log viewer below.',
        'connect.desc_az':     'Connects the device to Azure IoT Hub. Output appears in the log viewer below.',
        'connect.btn':         'Connect',
        'connect.reconnect':   'Reconnect',
        'connect.disconnect':  'Disconnect',
        'connect.setup':       'Setup ↗',
        'connect.test_title':  'Test Messages',
        'connect.test_desc':   'Publishes a test message via tedge mqtt pub to the local broker. Output appears in the log viewer.',
        'connect.test_meas':   'Test Measurement',
        'connect.test_event':  'Test Event',
        'connect.test_alarm':  'Test Alarm',
        // Logs
        'logs.service':        'Service',
        'logs.level':          'Log Level',
        'logs.apply':          'Apply Level',
        'logs.load':           'Load Logs',
        'logs.placeholder':    'Click "Load Logs" to load the latest entries.',
        // Tedge Config
        'section.tedgeconfig':       'Tedge Configuration',
        'tedgeconfig.load':          'Load Configuration',
        'tedgeconfig.copy':          'Copy',
        'tedgeconfig.placeholder':   'Click "Load Configuration" to display the current configuration.',
        'tedgeconfig.loading':       'Loading configuration…',
        'tedgeconfig.error':         (msg) => `Error loading configuration: ${msg}`,
        'tedgeconfig.copied':        'Configuration copied to clipboard',
        // Sysinfo
        'sysinfo.version':     'Version:',
        'sysinfo.build':       'Build:',
        'sysinfo.snap':        'Snap:',
        'sysinfo.arch':        'Architecture:',
        // Footer
        'footer.text':         'thin-edge.io IoT Edge Framework',
        // JS notifications
        'notify.status_error':      'No permission to view service status',
        'notify.status_load_err':   'Could not load service status',
        'notify.config_error':      'No permission to view configuration',
        'notify.config_load_err':   'Could not load configuration',
        'notify.c8y_saved':         'Cumulocity configuration saved',
        'notify.c8y_save_err':      'Could not save Cumulocity configuration',
        'notify.aws_saved':         'AWS configuration saved',
        'notify.aws_save_err':      'Could not save AWS configuration',
        'notify.az_saved':          'Azure configuration saved',
        'notify.az_save_err':       'Could not save Azure configuration',
        'notify.dev_saved':         'Device configuration saved',
        'notify.dev_save_err':      'Could not save device configuration',
        'notify.refreshing':        'Refreshing status...',
        'notify.restart_confirm':   'Are you sure you want to restart thin-edge.io services? This requires admin permissions.',
        'notify.restarting':        'Services are restarting...',
        'notify.restart_err':       'Could not restart services',
        'notify.no_perm_status':    'Insufficient permissions for this action',
        'notify.cert_cn_required':  'Please enter a Certificate Common Name',
        'notify.cert_upload_user':  'Please enter a Cumulocity username',
        'notify.cert_upload_pass':  'Please enter the password',
        'notify.uploading':         'Uploading...',
        'notify.cert_uploaded':     'Certificate uploaded to Cumulocity',
        'notify.cert_upload_fail':  'Certificate upload failed',
        'notify.upload_error':      'Upload error',
        'notify.admin_required':    'Admin access required',
        'notify.connect_ok':        (name) => `Connected to ${name}`,
        'notify.connect_fail':      (name) => `Connection to ${name} failed`,
        'notify.connect_error':     'Connection error',
        'notify.disconnect_ok':     (name) => `Disconnected from ${name}`,
        'notify.disconnect_fail':   (name) => `Disconnect from ${name} failed`,
        'notify.disconnect_error':  'Disconnect error',
        'notify.reconnect_ok':      (name) => `Reconnected to ${name}`,
        'notify.reconnect_fail':    (name) => `Reconnect to ${name} failed`,
        'notify.reconnect_error':   'Reconnect error',
        'notify.test_sent':         (label) => `${label} sent`,
        'notify.test_fail':         (label) => `${label} failed`,
        'notify.test_error':        'Error sending message',
        'notify.cert_details_ok':   'Certificate details loaded in log viewer',
        'notify.cert_details_err':  'Error fetching certificate details',
        'notify.no_perm_device':    'No permission to view device ID information',
        // Confirm dialogs
        'confirm.connect':          (name) => `Connect to ${name}?\n\nThis will establish the cloud connection.`,
        'confirm.disconnect':       (name) => `Disconnect from ${name}?\n\nThis will terminate the cloud connection.`,
        'confirm.reconnect':        (name) => `Reconnect to ${name}?\n\nThis will disconnect and re-establish the connection.`,
        'confirm.cert_create':      (cn) => `Create certificate with Common Name "${cn}"?\n\nThis will restart thin-edge.io services.`,
        'confirm.cert_renew':       (cn) => `Renew certificate with Common Name "${cn}"?\n\n⚠️ The existing certificate will be replaced!\nThe new certificate must be re-uploaded afterwards.\n\nThis will restart thin-edge.io services.`,
        'confirm.cert_upload':      (user) => `Upload certificate to Cumulocity IoT?\n\nThe device certificate will be registered under user "${user}" in Cumulocity.`,
        // Log viewer
        'logs.loading':             (svc) => `Loading logs for ${svc}...`,
        'logs.no_perm':             'No permission to view logs.',
        'logs.empty':               '(No log entries found)',
        'logs.load_error':          (msg) => `Error loading logs: ${msg}`,
        'logs.level_set':           (svc, lvl) => `Log level for "${svc}" set to "${lvl}". Service will be restarted.`,
        'logs.level_err':           'Error setting log level',
        'logs.no_perm_level':       'No permission to change log level',
        // cert upload status
        'cert.uploaded_to':         (cloud, time) => `🟢 Uploaded to ${cloud}${time}`,
        // cert create verb
        'cert.created':             (cn) => `Certificate created with CN: ${cn}`,
        'cert.renewed':             (cn) => `Certificate renewed with CN: ${cn}`,
        'cert.create_err':          'Error creating certificate',
    }
};

const _savedLang = localStorage.getItem('tedge-lang');
let _lang = _savedLang || ((navigator.language || 'en').startsWith('de') ? 'de' : 'en');
// Normalise: only 'de' or 'en'
if (_lang !== 'de') _lang = 'en';

function t(key, ...args) {
    const val = (I18N[_lang] || I18N['en'])[key] ?? (I18N['en'][key] ?? key);
    if (typeof val === 'function') return val(...args);
    return val;
}

function setLang(lang) {
    _lang = (lang === 'de') ? 'de' : 'en';
    localStorage.setItem('tedge-lang', _lang);
    document.documentElement.setAttribute('lang', _lang);
    applyI18n();
    // Update lang toggle buttons
    document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === _lang);
    });
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    // Dynamic: status badges already get their text via updateStatusBadge()
    // but we re-set the loading placeholders that haven't loaded yet:
    document.querySelectorAll('.status.unknown').forEach(el => {
        el.textContent = t('status.loading');
    });
    // Log viewer placeholder
    const lv = document.getElementById('log-viewer');
    if (lv && lv.textContent.trim() === '' || (lv && (lv.textContent.includes('Klicke') || lv.textContent.includes('Click')))) {
        lv.textContent = t('logs.placeholder');
    }
    // cert-upload-status: only if it shows the default "not uploaded" text
    const cu = document.getElementById('cert-upload-status');
    if (cu && (cu.textContent.includes('Noch nicht') || cu.textContent.includes('Not yet'))) {
        cu.textContent = t('device.not_uploaded');
    }
}
// ─────────────────────────────────────────────────────────────────────

// ── Color Theme Picker ──────────────────────────────────────────────
// Funktionsdeklarationen (werden gehoisted) damit inline-onclick sie immer findet
function toggleColorPicker(e) {
    if (e) e.stopPropagation();
    var dd = document.getElementById('color-picker-dropdown');
    var btn = document.getElementById('color-picker-btn');
    if (!dd || !btn) return;
    var isOpen = dd.style.display !== 'none';
    if (isOpen) {
        dd.style.display = 'none';
        return;
    }
    var rect = btn.getBoundingClientRect();
    dd.style.top = (rect.bottom + 6) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
    dd.style.display = 'flex';
}

function setColorTheme(color, e) {
    if (e) e.stopPropagation();
    if (color === 'green') {
        document.documentElement.removeAttribute('data-color');
    } else {
        document.documentElement.setAttribute('data-color', color);
    }
    localStorage.setItem('tedge-color', color);
    document.querySelectorAll('.color-swatch').forEach(function(s) {
        s.classList.toggle('active', s.dataset.color === color);
    });
    var dd = document.getElementById('color-picker-dropdown');
    if (dd) dd.style.display = 'none';
}
// ─────────────────────────────────────────────────────────────────────

// Helper function to handle API responses with permission errors
async function handleApiResponse(response, successMessage, errorMessage) {
    if (response.ok) {
        const data = await response.json();
        if (data.success === false && data.error) {
            showNotification(data.error, 'error');
            return false;
        }
        showNotification(successMessage, 'success');
        return true;
    } else if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        showNotification(data.error || 'Insufficient permissions for this action', 'error');
        return false;
    } else {
        showNotification(errorMessage, 'error');
        return false;
    }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const section = tab.closest('section');
        const tabsEl  = tab.closest('.tabs');
        // Nur Tabs und Panels innerhalb derselben Sektion deaktivieren
        if (tabsEl) tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        if (section) section.querySelectorAll('.cloud-config, .connect-panel').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const cloud   = tab.dataset.cloud;
        const connect = tab.dataset.connect;
        if (cloud)   { const el = document.getElementById(cloud   + '-config');  if (el) el.classList.add('active'); }
        if (connect) { const el = document.getElementById(connect + '-connect'); if (el) el.classList.add('active'); }
    });
});

// Load status on page load
window.addEventListener('DOMContentLoaded', () => {
    loadStatus();
    loadConfiguration();
});

// Load service status
async function loadStatus() {
    try {
        const response = await fetch('api/status');
        
        if (response.status === 403) {
            showNotification(t('notify.status_error'), 'error');
            return;
        }
        
        const data = await response.json();
        
        updateStatusBadge('mqtt-status', data.mosquitto || 'unknown');
        updateStatusBadge('agent-status', data.agent || 'unknown');
        updateStatusBadge('bridge-status', data.bridge || 'unknown');
        updateStatusBadge('watchdog-status', data.watchdog || 'unknown');
        updateStatusBadge('c8y-status', data.c8y || 'unknown');
        updateStatusBadge('aws-status', data.aws || 'unknown');
        updateStatusBadge('az-status', data.az || 'unknown');
    } catch (error) {
        console.error('Error loading status:', error);
        showNotification(t('notify.status_load_err'), 'error');
    }
}

// Update status badge
function updateStatusBadge(elementId, status) {
    const element = document.getElementById(elementId);
    element.className = 'status ' + status;
    
    const icons = {
        'running':  t('status.running'),
        'stopped':  t('status.stopped'),
        'inactive': t('status.inactive'),
        'unknown':  t('status.unknown')
    };
    
    element.textContent = icons[status] || t('status.unknown');
}

// Load configuration
function updateCertUploadStatusDisplay(certUpload) {
    const el = document.getElementById('cert-upload-status');
    if (!el) return;
    if (certUpload && certUpload.uploaded) {
        const cloud = certUpload.cloud ? certUpload.cloud.toUpperCase() : 'Cloud';
        let timeStr = '';
        if (certUpload.timestamp) {
            const ts = parseInt(certUpload.timestamp, 10);
            if (!isNaN(ts)) timeStr = ' (' + new Date(ts * 1000).toLocaleString() + ')';
        }
        el.textContent = t('cert.uploaded_to', cloud, timeStr);
        el.style.color = 'var(--brand-primary, #53cd61)';
    } else {
        el.textContent = t('device.not_uploaded');
        el.style.color = '';
    }
}

async function loadConfiguration() {
    try {
        const response = await fetch('api/config');
        
        if (response.status === 403) {
            showNotification(t('notify.config_error'), 'error');
            return;
        }
        
        const config = await response.json();
        
        // Populate form fields
        if (config.device) {
            // Only set device-id if not already filled by loadDeviceIdInfo (which uses live cert data)
            const deviceIdField = document.getElementById('device-id');
            if (deviceIdField && !deviceIdField.value && config.device.id) {
                deviceIdField.value = config.device.id;
            }
        }
        
        if (config.c8y) {
            document.getElementById('c8y-url').value = config.c8y['c8y-url'] || '';
            document.getElementById('c8y-tenant').value = config.c8y.tenant || '';
            document.getElementById('c8y-enabled').checked = config.c8y.enabled || false;
        }
        
        if (config.aws) {
            document.getElementById('aws-url').value = config.aws['aws-url'] || '';
            document.getElementById('aws-region').value = config.aws.region || '';
            document.getElementById('aws-account').value = config.aws.account || '';
            document.getElementById('aws-enabled').checked = config.aws.enabled || false;
        }
        
        if (config.az) {
            document.getElementById('az-url').value = config.az['azure-url'] || '';
            document.getElementById('az-enabled').checked = config.az.enabled || false;
        }

        updateCertUploadStatusDisplay(config.cert_upload || null);
    } catch (error) {
        console.error('Error loading configuration:', error);
        showNotification(t('notify.config_load_err'), 'error');
    }
}

// Save Cumulocity configuration
async function saveC8yConfig() {
    const config = {
        'c8y-url': document.getElementById('c8y-url').value,
        tenant: document.getElementById('c8y-tenant').value,
        enabled: document.getElementById('c8y-enabled').checked
    };
    
    try {
        const response = await fetch('api/config/c8y', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        await handleApiResponse(
            response,
            t('notify.c8y_saved'),
            t('notify.c8y_save_err')
        );
    } catch (error) {
        console.error('Error saving C8y config:', error);
        showNotification(t('notify.c8y_save_err'), 'error');
    }
}

// Save AWS configuration
async function saveAwsConfig() {
    const config = {
        'aws-url': document.getElementById('aws-url').value,
        region: document.getElementById('aws-region').value,
        account: document.getElementById('aws-account').value,
        enabled: document.getElementById('aws-enabled').checked
    };
    
    try {
        const response = await fetch('api/config/aws', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        await handleApiResponse(
            response,
            t('notify.aws_saved'),
            t('notify.aws_save_err')
        );
    } catch (error) {
        console.error('Error saving AWS config:', error);
        showNotification(t('notify.aws_save_err'), 'error');
    }
}

// Save Azure configuration
async function saveAzConfig() {
    const config = {
        'azure-url': document.getElementById('az-url').value,
        enabled: document.getElementById('az-enabled').checked
    };
    
    try {
        const response = await fetch('api/config/az', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        await handleApiResponse(
            response,
            t('notify.az_saved'),
            t('notify.az_save_err')
        );
    } catch (error) {
        console.error('Error saving Azure config:', error);
        showNotification(t('notify.az_save_err'), 'error');
    }
}

// Save device configuration
async function saveDeviceConfig() {
    const config = {
        id: document.getElementById('device-id').value
    };
    
    try {
        const response = await fetch('api/config/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        await handleApiResponse(
            response,
            t('notify.dev_saved'),
            t('notify.dev_save_err')
        );
    } catch (error) {
        console.error('Error saving device config:', error);
        showNotification(t('notify.dev_save_err'), 'error');
    }
}

// Refresh status
function refreshStatus() {
    showNotification(t('notify.refreshing'), 'info');
    loadStatus();
}

// Load logs from API
async function loadLogs() {
    const service = document.getElementById('log-service-select').value;
    const viewer = document.getElementById('log-viewer');
    viewer.textContent = t('logs.loading', service);
    try {
        const response = await fetch(`api/logs?service=${encodeURIComponent(service)}&lines=100`);
        if (response.status === 403) {
            viewer.textContent = t('logs.no_perm');
            return;
        }
        const data = await response.json();
        if (data.lines && data.lines.length > 0) {
            viewer.textContent = data.lines.join('\n');
        } else {
            viewer.textContent = t('logs.empty');
        }
        viewer.scrollTop = viewer.scrollHeight;
    } catch (error) {
        viewer.textContent = t('logs.load_error', error.message);
    }
}

// Apply log level for selected service
async function applyLogLevel() {
    const service = document.getElementById('log-service-select').value;
    const level = document.getElementById('log-level-select').value;
    try {
        const response = await fetch('api/log-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service, level })
        });
        if (response.status === 403) {
            showNotification(t('logs.no_perm_level'), 'error');
            return;
        }
        const data = await response.json();
        if (data.success) {
            showNotification(t('logs.level_set', service, level), 'success');
        } else {
            showNotification(data.error || t('logs.level_err'), 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

// Load tedge config list
async function loadTedgeConfig() {
    const viewer = document.getElementById('tedge-config-viewer');
    viewer.textContent = t('tedgeconfig.loading');
    try {
        const response = await fetch('api/tedge-config-list');
        if (response.status === 403) {
            viewer.textContent = t('tedgeconfig.error', 'Keine Berechtigung');
            return;
        }
        const data = await response.json();
        if (data.output) {
            viewer.textContent = data.output;
        } else {
            viewer.textContent = t('tedgeconfig.error', data.error || 'Unbekannter Fehler');
        }
    } catch (error) {
        viewer.textContent = t('tedgeconfig.error', error.message);
    }
}

function copyTedgeConfig() {
    const viewer = document.getElementById('tedge-config-viewer');
    if (!viewer.textContent) return;
    navigator.clipboard.writeText(viewer.textContent).then(() => {
        showNotification(t('tedgeconfig.copied'), 'success');
    }).catch(() => {
        // Fallback für ältere Browser
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(viewer);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        showNotification(t('tedgeconfig.copied'), 'success');
    });
}

// Restart services
async function restartServices() {
    if (!confirm(t('notify.restart_confirm'))) {
        return;
    }
    
    try {
        const response = await fetch('api/restart', {
            method: 'POST'
        });
        
        const success = await handleApiResponse(
            response,
            t('notify.restarting'),
            t('notify.restart_err')
        );
        
        if (success) {
            setTimeout(loadStatus, 5000);
        }
    } catch (error) {
        console.error('Error restarting services:', error);
        showNotification(t('notify.restart_err'), 'error');
    }
}

// Show notification (Bootstrap alert + Cumulocity palette)
function showNotification(message, type = 'info') {
    const typeClass = type === 'error' ? 'alert-danger'
        : type === 'success' ? 'alert-success'
        : type === 'warning' ? 'alert-warning'
        : 'alert-info';

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `alert ${typeClass} alert-dismissible`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `${message} <button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;
    el.querySelector('.close').addEventListener('click', () => el.remove());
    container.appendChild(el);

    // Trigger transition in next frame
    requestAnimationFrame(() => el.classList.add('show'));

    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
    }, 3000);
}

// Device ID Management Functions

// Load device ID information
async function loadDeviceIdInfo() {
    try {
        const response = await fetch('api/device-id');
        if (!response.ok) {
            if (response.status === 403) showNotification(t('notify.no_perm_device'), 'error');
            return;
        }
        const data = await response.json();

        // Fill device-id field: prefer current cert ID, fall back to system serial
        const deviceIdField = document.getElementById('device-id');
        if (deviceIdField) {
            // Treat "not-set" / "No certificate found" as absent
            const cert = (data.current && data.current !== 'not-set' && !data.current.startsWith('No certificate')) ? data.current : '';
            const raw = cert || data.system_serial || '';
            // Strip "ctrlx-" prefix for display
            const value = raw.replace(/^ctrlx-/i, '');
            deviceIdField.value = value;
            deviceIdField.placeholder = (data.system_serial || '48FC8D56-6F25-43B1-8DF6-380342AA3478').replace(/^ctrlx-/i, '');
        }

        // Pre-fill cert-common-name from current cert CN
        const cnField = document.getElementById('cert-common-name');
        if (cnField && !cnField.value) {
            const cert = (data.current && data.current !== 'not-set' && !data.current.startsWith('No certificate')) ? data.current : '';
            const raw = cert || data.system_serial || '';
            cnField.value = raw.replace(/^ctrlx-/i, '');
            cnField.placeholder = (data.system_serial || '').replace(/^ctrlx-/i, '') || 'e.g. ctrlx-001';
        }

        // Certificate status + button highlight + inline cert details
        window._certExists = !!data.has_certificate;
        const certStatus = document.getElementById('cert-status');
        const createBtn = document.getElementById('btn-set-device-id');
        if (data.has_certificate) {
            if (certStatus) { certStatus.className = 'cert-status success'; certStatus.textContent = t('device.cert_active'); }
            if (createBtn) { createBtn.className = 'btn btn-warning btn-sm'; createBtn.disabled = false; createBtn.textContent = t('device.update_cert'); }
            loadCertDetailsInline();
        } else {
            if (certStatus) { certStatus.className = 'cert-status error'; certStatus.textContent = t('device.cert_missing'); }
            if (createBtn) { createBtn.className = 'btn btn-warning btn-sm'; createBtn.disabled = false; createBtn.textContent = t('device.create_cert'); }
            const inline = document.getElementById('cert-details-inline');
            if (inline) inline.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading device ID info:', error);
    }
}

// Check current user role and enable/disable admin-only fields
async function applyRoleRestrictions() {
    try {
        const response = await fetch('api/me');
        if (!response.ok) return;
        const data = await response.json();
        const isAdmin = data.role === 'admin';

        const deviceIdField = document.getElementById('device-id');
        if (deviceIdField) {
            deviceIdField.readOnly = !isAdmin;
            deviceIdField.style.background = isAdmin ? '' : 'var(--c8y-palette-gray-90,#2a2a3e)';
            deviceIdField.style.cursor = isAdmin ? '' : 'not-allowed';
            deviceIdField.style.opacity = isAdmin ? '' : '0.7';
        }
        const hint = document.getElementById('device-id-hint');
        if (hint) hint.textContent = isAdmin ? t('device.id_hint') : t('device.id_hint_ro');

        const saveBtn = document.getElementById('btn-save-device');
        if (saveBtn) saveBtn.disabled = !isAdmin;
        const setBtn = document.getElementById('btn-set-device-id');
        if (setBtn) {
            // Button nur aktiv wenn Admin
            setBtn.disabled = !isAdmin;
        }
    } catch (e) {
        console.error('Could not check role', e);
    }
}

// Erstellt oder erneuert das Gerätezertifikat
function manageCertificate() {
    setDeviceId();
}

// Set device ID
async function setDeviceId() {
    const commonName = (document.getElementById('cert-common-name') || {}).value?.trim()
        || document.getElementById('device-id')?.value?.trim();

    if (!commonName) {
        showNotification(t('notify.cert_cn_required'), 'error');
        return;
    }

    const confirmMsg = window._certExists ? t('confirm.cert_renew', commonName) : t('confirm.cert_create', commonName);
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const response = await fetch('api/device-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: commonName })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const msg = window._certExists ? t('cert.renewed', commonName) : t('cert.created', commonName);
                showNotification(msg, 'success');
                setTimeout(() => {
                    loadDeviceIdInfo();
                    loadStatus();
                }, 2000);
            } else {
                showNotification(data.error || t('cert.create_err'), 'error');
            }
        } else if (response.status === 403) {
            const data = await response.json().catch(() => ({}));
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else {
            const data = await response.json().catch(() => ({}));
            showNotification(data.error || t('cert.create_err'), 'error');
        }
    } catch (error) {
        console.error('Error creating certificate:', error);
        showNotification(t('cert.create_err'), 'error');
    }
}

// Load cert details into inline panel
async function loadCertDetailsInline() {
    const inline = document.getElementById('cert-details-inline');
    const pre = document.getElementById('cert-details-pre');
    if (!inline || !pre) return;
    try {
        const response = await fetch('api/device-id/cert-info');
        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch (_) {}
        if (data.details) {
            pre.textContent = data.details;
            inline.style.display = 'flex';
            inline.style.flexDirection = 'column';
        }
    } catch (_) {}
}

// Show certificate details via tedge cert show
async function showCertificateDetails() {
    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = t('device.cert_details') + ' ...';
    try {
        const response = await fetch('api/device-id/cert-info');
        let data = {};
        const text = await response.text();
        try { data = JSON.parse(text); } catch (_) {}

        const msg = data.details || data.error ||
            (response.status === 408 ? 'Request timed out — tedge cert show took too long.' : `Server error (${response.status})`);

        if (viewer) {
            viewer.textContent = msg;
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (!response.ok || data.success === false) {
            showNotification(data.error || `Error ${response.status}`, 'error');
        } else {
            showNotification(t('notify.cert_details_ok'), 'success');
        }
    } catch (error) {
        console.error('Error fetching certificate details:', error);
        showNotification(t('notify.cert_details_err'), 'error');
    }
}

// Connect cloud via tedge connect <cloud>
async function connectCloud(cloud) {
    const names = { c8y: 'Cumulocity IoT', aws: 'AWS IoT', az: 'Azure IoT' };
    const name = names[cloud] || cloud;
    if (!confirm(t('confirm.connect', name))) return;

    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = `Connecting to ${name}...`;

    try {
        const response = await fetch(`api/connect/${cloud}`, { method: 'POST' });
        const data = await response.json();

        if (viewer) {
            viewer.textContent = data.output || data.error || '(no output)';
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (response.status === 403) {
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else if (data.success) {
            showNotification(t('notify.connect_ok', name), 'success');
            setTimeout(() => loadStatus(), 2000);
        } else {
            showNotification(t('notify.connect_fail', name), 'error');
        }
    } catch (error) {
        console.error('Error connecting cloud:', error);
        showNotification(t('notify.connect_error'), 'error');
    }
}

async function disconnectCloud(cloud) {
    const names = { c8y: 'Cumulocity IoT', aws: 'AWS IoT', az: 'Azure IoT' };
    const name = names[cloud] || cloud;
    if (!confirm(t('confirm.disconnect', name))) return;

    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = `Disconnecting from ${name}...`;

    try {
        const response = await fetch(`api/disconnect/${cloud}`, { method: 'POST' });
        const data = await response.json();

        if (viewer) {
            viewer.textContent = data.output || data.error || '(no output)';
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (response.status === 403) {
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else if (data.success) {
            showNotification(t('notify.disconnect_ok', name), 'success');
            setTimeout(() => loadStatus(), 2000);
        } else {
            showNotification(t('notify.disconnect_fail', name), 'error');
        }
    } catch (error) {
        console.error('Error disconnecting cloud:', error);
        showNotification(t('notify.disconnect_error'), 'error');
    }
}

async function reconnectCloud(cloud) {
    const names = { c8y: 'Cumulocity IoT', aws: 'AWS IoT', az: 'Azure IoT' };
    const name = names[cloud] || cloud;
    if (!confirm(t('confirm.reconnect', name))) return;

    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = `Reconnecting to ${name}...`;

    try {
        const response = await fetch(`api/reconnect/${cloud}`, { method: 'POST' });
        const data = await response.json();

        if (viewer) {
            viewer.textContent = data.output || data.error || '(no output)';
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (response.status === 403) {
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else if (data.success) {
            showNotification(t('notify.reconnect_ok', name), 'success');
            setTimeout(() => loadStatus(), 2000);
        } else {
            showNotification(t('notify.reconnect_fail', name), 'error');
        }
    } catch (error) {
        console.error('Error reconnecting cloud:', error);
        showNotification(t('notify.reconnect_error'), 'error');
    }
}

async function sendTestMessage(type) {
    const labels = { measurement: t('connect.test_meas'), event: t('connect.test_event'), alarm: t('connect.test_alarm') };
    const label = labels[type] || type;

    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = `Sending ${label}...`;

    try {
        const response = await fetch('api/test-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        const data = await response.json();

        if (viewer) {
            viewer.textContent = data.output || data.error || '(no output)';
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (response.status === 403) {
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else if (data.success) {
            showNotification(t('notify.test_sent', label), 'success');
        } else {
            showNotification(t('notify.test_fail', label), 'error');
        }
    } catch (error) {
        console.error('Error sending test message:', error);
        showNotification(t('notify.test_error'), 'error');
    }
}

function toggleCertUploadForm() {
    const form = document.getElementById('cert-upload-form');
    if (!form) return;
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : 'block';
    if (!visible) {
        const userEl = document.getElementById('c8y-upload-user');
        if (userEl) userEl.focus();
    } else {
        document.getElementById('c8y-upload-pass').value = '';
    }
}

async function submitCertUpload() {
    const username = (document.getElementById('c8y-upload-user') || {}).value || '';
    const password = (document.getElementById('c8y-upload-pass') || {}).value || '';

    if (!username) {
        showNotification(t('notify.cert_upload_user'), 'error');
        return;
    }
    if (!password) {
        showNotification(t('notify.cert_upload_pass'), 'error');
        return;
    }

    if (!confirm(t('confirm.cert_upload', username))) return;

    const btn = document.querySelector('#cert-upload-form .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = t('notify.uploading'); }

    const viewer = document.getElementById('log-viewer');
    if (viewer) viewer.textContent = 'Uploading certificate to Cumulocity...';

    try {
        const response = await fetch('api/cert/upload/c8y', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (viewer) {
            viewer.textContent = data.output || data.error || '(no output)';
            const sec = document.getElementById('sec-logs');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        }

        if (response.status === 403) {
            showNotification(data.error || t('notify.admin_required'), 'error');
        } else if (data.success) {
            showNotification(t('notify.cert_uploaded'), 'success');
            document.getElementById('c8y-upload-pass').value = '';
            updateCertUploadStatusDisplay({
                uploaded: true,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                cloud: 'c8y'
            });
            toggleCertUploadForm();
        } else {
            showNotification(t('notify.cert_upload_fail'), 'error');
        }
    } catch (error) {
        console.error('Error uploading certificate:', error);
        showNotification(t('notify.upload_error'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = t('device.upload_btn'); }
    }
}
// (toggleColorPicker und setColorTheme sind am Dateianfang als hoisted Deklarationen definiert)

function applyColorTheme() {
    var color = localStorage.getItem('tedge-color') || 'green';
    if (color !== 'green') document.documentElement.setAttribute('data-color', color);
    document.querySelectorAll('.color-swatch').forEach(function(s) {
        s.classList.toggle('active', s.dataset.color === color);
    });
}

document.addEventListener('click', function(e) {
    var dd = document.getElementById('color-picker-dropdown');
    var wrap = document.getElementById('color-picker-wrap');
    if (dd && dd.style.display !== 'none') {
        if (!wrap || !wrap.contains(e.target)) {
            dd.style.display = 'none';
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    setLang(_lang); // apply i18n on load
    loadDeviceIdInfo();
    applyRoleRestrictions();
    loadBuildInfo();
    applyColorTheme();
    initCollapsibleSections();
});

function initCollapsibleSections() {
    document.querySelectorAll('.card').forEach((section, index) => {
        const h2 = section.querySelector(':scope > h2');
        if (!h2) return;

        // Add chevron icon
        const icon = document.createElement('span');
        icon.className = 'collapse-icon';
        icon.textContent = '▾';
        h2.appendChild(icon);

        // Wrap all siblings after h2 in card-body
        const body = document.createElement('div');
        body.className = 'card-body';
        const siblings = Array.from(section.children).filter(c => c !== h2);
        siblings.forEach(c => body.appendChild(c));
        section.appendChild(body);

        // Collapse all except first
        if (index > 0) section.classList.add('collapsed');

        // Toggle on h2 click
        h2.addEventListener('click', () => section.classList.toggle('collapsed'));
    });
}

async function loadBuildInfo() {
    try {
        const response = await fetch('api/build-info');
        if (!response.ok) return;
        const data = await response.json();
        const el = (id) => document.getElementById(id);
        if (el('tedge-version') && data.version) el('tedge-version').textContent = data.version;
        if (el('build-number') && data.build)   el('build-number').textContent  = data.build;
        if (el('snap-name')    && data.snap_name) el('snap-name').textContent   = data.snap_name;
        if (el('arch')         && data.architecture) el('arch').textContent     = data.architecture;
    } catch (e) {
        console.warn('Could not load build info:', e);
    }
}

