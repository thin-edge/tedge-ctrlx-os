use actix_files::Files;
use actix_web::{middleware, web, App, HttpRequest, HttpResponse, HttpServer, Result};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Duration;
#[path = "../../bridge-service-rust/src/datalayer.rs"]
pub mod datalayer;
use crate::datalayer::{DatalayerConfig, DatalayerCredentials, DatalayerMapping, MappingDirection, MappingTransform};

/// Returns the snap instance name at runtime.
/// snapd always sets SNAP_INSTANCE_NAME inside the snap environment.
/// The fallback is only used when the binary runs outside a snap (e.g. local dev).
/// To rename the snap, update ONLY the fallback string here AND `name:` in snapcraft.yaml.
fn snap_name() -> String {
    env::var("SNAP_INSTANCE_NAME").unwrap_or_else(|_| "ctrlx-cumulocity-thin-edge-io".to_string())
}

/// Returns `"<snap_name>.<service>"`, e.g. `"ctrlx-cumulocity-thin-edge-io.mosquitto"`.
fn snap_svc(service: &str) -> String {
    format!("{}.{}", snap_name(), service)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeviceConfig {
    id: String,
    #[serde(default)]
    name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct C8yConfig {
    #[serde(rename = "c8y-url")]
    url: Option<String>,
    tenant: Option<String>,
    enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AwsConfig {
    #[serde(rename = "aws-url")]
    url: Option<String>,
    enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AzConfig {
    #[serde(rename = "azure-url")]
    url: Option<String>,
    enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CertUploadStatus {
    uploaded: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    timestamp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cloud: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Config {
    device: DeviceConfig,
    c8y: C8yConfig,
    aws: AwsConfig,
    az: AzConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    cert_upload: Option<CertUploadStatus>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            device: DeviceConfig {
                id: String::new(),
                name: String::new(),
            },
            c8y: C8yConfig {
                url: None,
                tenant: None,
                enabled: false,
            },
            aws: AwsConfig {
                url: None,
                enabled: false,
            },
            az: AzConfig {
                url: None,
                enabled: false,
            },
            cert_upload: None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
struct ServiceStatus {
    mosquitto: String,
    agent: String,
    bridge: String,
    watchdog: String,
    webserver: String,
    log_upload_manager: String,
    mapper_c8y: String,
    mapper_aws: String,
    mapper_az: String,
    c8y: String,
    aws: String,
    az: String,
}

/// Check actual mosquitto bridge connection state via $SYS topic.
/// Returns "running" (bridge up), "stopped" (bridge down), "inactive" (not configured),
/// or "unknown" (configured but state undetermined, e.g. mosquitto just restarted).
async fn check_bridge_state(sub_bin: String, snap_data: String, cloud: &str) -> &'static str {
    // Step 1: check if a connection has been configured at all.
    // With the classic external bridge, tedge writes mosquitto-conf/<cloud>-bridge.conf.
    // With the built-in bridge (our default), tedge writes mappers/<cloud>/mapper.toml
    // instead — there is no mosquitto-conf bridge file.
    // Accept either path so both bridge modes are handled correctly.
    let bridge_conf = format!("{}/tedge/mosquitto-conf/{}-bridge.conf", snap_data, cloud);
    let mapper_toml = format!("{}/tedge/mappers/{}/mapper.toml", snap_data, cloud);
    if !std::path::Path::new(&bridge_conf).exists() && !std::path::Path::new(&mapper_toml).exists()
    {
        return "inactive";
    }

    let bridge_name = match cloud {
        "c8y" => "edge_to_c8y",
        "aws" => "edge_to_aws",
        "az" => "edge_to_az",
        _ => return "unknown",
    };

    // mapper service name (used both as fallback and as proxy for bridge state)
    let mapper_svc_owned = match cloud {
        "c8y" => snap_svc("tedge-mapper-c8y"),
        "aws" => snap_svc("tedge-mapper-aws"),
        "az" => snap_svc("tedge-mapper-az"),
        _ => return "unknown",
    };
    let mapper_svc = mapper_svc_owned.as_str();

    // Step 2: if mosquitto_sub is available, query $SYS/broker/connection/<name>/state.
    // Note: $SYS topics are only published at sys_interval (default 10s) or on state change.
    // If mosquitto_sub times out or returns an ambiguous result, fall through to Step 3.
    if std::path::Path::new(&sub_bin).exists() {
        let topic = format!("$SYS/broker/connection/{}/state", bridge_name);
        let result = tokio::time::timeout(
            std::time::Duration::from_secs(3),
            tokio::process::Command::new(&sub_bin)
                .args([
                    "-h",
                    "127.0.0.1",
                    "-p",
                    "1883",
                    "-t",
                    &topic,
                    "-C",
                    "1",
                    "-W",
                    "2",
                ])
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .output(),
        )
        .await;

        match result {
            Ok(Ok(out)) if !out.stdout.is_empty() => match out.stdout.first() {
                Some(&b'1') => return "running",
                Some(&b'0') => return "stopped",
                // ambiguous → fall through to snapctl fallback below
                _ => {}
            },
            // timeout or error → fall through to snapctl fallback below
            _ => {}
        }
    }

    // Step 3: fallback — use mapper snapctl status as proxy.
    // bridge.conf exists → tedge connect was run. Active mapper ≈ bridge is up.
    match tokio::process::Command::new("snapctl")
        .args(["services", mapper_svc])
        .output()
        .await
    {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            // Check Current column == "active" (not "inactive")
            let running = stdout.lines().skip(1).any(|line| {
                line.split_whitespace()
                    .nth(2)
                    .map(|s| s == "active")
                    .unwrap_or(false)
            });
            if running {
                "running"
            } else {
                "stopped"
            }
        }
        _ => "stopped",
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeviceIdInfo {
    current: String,
    system_serial: String,
    has_certificate: bool,
}

#[derive(Debug, Clone, Deserialize)]
struct SetDeviceIdRequest {
    device_id: String,
}

// ── CA certificate download job store ────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
enum CaJobStatus {
    Pending,
    Success,
    Error,
}

#[derive(Debug, Clone, Serialize)]
struct CaJob {
    status: CaJobStatus,
    message: String,
}

type CaJobStore = Arc<Mutex<HashMap<String, CaJob>>>;

// ─────────────────────────────────────────────────────────────────────────────

struct AppState {
    config: std::sync::Mutex<Config>,
    config_path: PathBuf,
    datalayer_config_path: PathBuf,
    datalayer_credentials_path: PathBuf,
    ca_jobs: CaJobStore,
}

impl AppState {
    fn new(
        config_path: PathBuf,
        datalayer_config_path: PathBuf,
        credentials_path: PathBuf,
    ) -> Self {
        info!("[INIT] Loading configuration from: {:?}", config_path);
        let config = Self::load_config(&config_path);
        info!("[INIT] Configuration loaded successfully");

        // Create initial default file if it does not exist
        if !config_path.exists() {
            info!(
                "[INIT] Creating initial default config at: {:?}",
                config_path
            );
            if let Err(e) = Self::save_config_static(&config_path, &config) {
                warn!("[INIT] Failed to write initial config file: {}", e);
            }
        }

        // Create datalayer config file with defaults if it is missing
        if !datalayer_config_path.exists() {
            info!(
                "[INIT] Creating initial datalayer config at: {:?}",
                datalayer_config_path
            );
            let default_dl = DatalayerConfig::default();
            if let Some(parent) = datalayer_config_path.parent() {
                let _ = std::fs::create_dir_all(parent); // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
            }
            match std::fs::write(
                // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
                &datalayer_config_path,
                serde_json::to_string_pretty(&default_dl).unwrap_or_default(),
            ) {
                Ok(_) => info!("[INIT] Datalayer config written with defaults."),
                Err(e) => warn!("[INIT] Failed to write datalayer config: {}", e),
            }
        }

        AppState {
            config: std::sync::Mutex::new(config),
            config_path,
            datalayer_config_path,
            datalayer_credentials_path: credentials_path,
            ca_jobs: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn save_config_static(path: &PathBuf, config: &Config) -> io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        }
        let json = serde_json::to_string_pretty(config)?;
        fs::write(path, json)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        Ok(())
    }

    fn load_config(path: &PathBuf) -> Config {
        info!("[CONFIG-LOAD] Attempting to load config from: {:?}", path);
        if let Ok(content) = fs::read_to_string(path) {
            // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
            info!(
                "[CONFIG-LOAD] File read successfully, size: {} bytes",
                content.len()
            );
            if let Ok(config) = serde_json::from_str(&content) {
                info!("[CONFIG-LOAD] Config parsed successfully");
                return config;
            } else {
                warn!("[CONFIG-LOAD] Failed to parse JSON, using defaults");
            }
        } else {
            info!("[CONFIG-LOAD] Config file not found, using defaults");
        }
        Config::default()
    }

    fn save_config(&self, config: &Config) -> io::Result<()> {
        info!(
            "[CONFIG-SAVE] Saving configuration to: {:?}",
            self.config_path
        );
        info!(
            "[CONFIG-SAVE] Device ID: {}, Name: {}",
            config.device.id, config.device.name
        );
        info!(
            "[CONFIG-SAVE] C8y enabled: {}, AWS enabled: {}, Azure enabled: {}",
            config.c8y.enabled, config.aws.enabled, config.az.enabled
        );

        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        }
        let json = serde_json::to_string_pretty(config)?;
        fs::write(&self.config_path, json)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)

        info!("[CONFIG-SAVE] Configuration saved successfully");
        Ok(())
    }

    fn load_datalayer_config(&self) -> DatalayerConfig {
        info!(
            "[DL-CONFIG] Loading config from: {:?}",
            self.datalayer_config_path
        );

        match std::fs::read_to_string(&self.datalayer_config_path) {
            // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
            Ok(content) if content.trim().is_empty() => DatalayerConfig::default(),
            Ok(content) => match serde_json::from_str::<DatalayerConfig>(&content) {
                Ok(cfg) => {
                    info!(
                        "[DL-CONFIG] Loaded successfully: {} active mappings.",
                        cfg.mappings.len()
                    );
                    cfg
                }
                Err(e) => {
                    error!(
                        "[DL-CONFIG] JSON PARSE ERROR at line {}, column {}: {}",
                        e.line(),
                        e.column(),
                        e
                    );
                    DatalayerConfig::default()
                }
            },
            Err(e) => {
                warn!("[DL-CONFIG] Could not read datalayer-mappings.json: {}", e);
                DatalayerConfig::default()
            }
        }
    }

    fn save_datalayer_config(&self, cfg: &DatalayerConfig) -> io::Result<()> {
        if let Some(parent) = self.datalayer_config_path.parent() {
            fs::create_dir_all(parent)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        }
        let json = serde_json::to_string_pretty(cfg)?;
        fs::write(&self.datalayer_config_path, json)?; // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        info!(
            "[DL-CONFIG] Datalayer config saved to {:?}",
            self.datalayer_config_path
        );
        Ok(())
    }

    fn load_datalayer_credentials(&self) -> DatalayerCredentials {
        match std::fs::read_to_string(&self.datalayer_credentials_path) {
            // codeql[rust/path-injection] - path is derived from SNAP_COMMON env var (system-controlled by snapd, not user input)
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => DatalayerCredentials::default(),
        }
    }

    fn save_datalayer_credentials(&self, creds: &DatalayerCredentials) -> io::Result<()> {
        if let Some(parent) = self.datalayer_credentials_path.parent() {
            fs::create_dir_all(parent)?; // codeql[rust/path-injection] - path is derived from SNAP_COMMON env var (system-controlled by snapd, not user input)
        }
        let json = serde_json::to_string_pretty(creds)?;
        fs::write(&self.datalayer_credentials_path, &json)?; // codeql[rust/path-injection] - path is derived from SNAP_COMMON env var (system-controlled by snapd, not user input)
                                                             // Restrict permissions to owner-only (0600)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(
                // codeql[rust/path-injection] - path is derived from SNAP_COMMON env var (system-controlled by snapd, not user input)
                &self.datalayer_credentials_path,
                fs::Permissions::from_mode(0o600),
            );
        }
        info!(
            "[DL-CONFIG] Credentials saved to {:?} (mode 0600)",
            self.datalayer_credentials_path
        );
        Ok(())
    }
}
/// POST /api/datalayer/mappings/add  — Adds a single mapping
async fn add_datalayer_mapping(
    req: HttpRequest,
    body: web::Json<DatalayerMapping>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let mut new_mapping = body.into_inner();

    // Generate a UUID if none is present yet
    if new_mapping.id.is_empty() {
        new_mapping.id = uuid::Uuid::new_v4().to_string();
    }

    // Load config, add mapping, save config
    let mut cfg = data.load_datalayer_config();
    cfg.mappings.push(new_mapping.clone());

    if let Err(e) = data.save_datalayer_config(&cfg) {
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }

    info!("[DL-CONFIG] New mapping added: {}", new_mapping.id);
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "mapping": new_mapping})))
}

/// PUT /api/datalayer/mappings/{id}  — Updates an existing mapping
async fn update_datalayer_mapping(
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<DatalayerMapping>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let id = path.into_inner();
    let updated = body.into_inner();
    let mut cfg = data.load_datalayer_config();

    if let Some(m) = cfg.mappings.iter_mut().find(|m| m.id == id) {
        *m = updated.clone();
    } else {
        return Ok(HttpResponse::NotFound()
            .json(serde_json::json!({"success": false, "error": "Mapping not found"})));
    }

    if let Err(e) = data.save_datalayer_config(&cfg) {
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }

    info!("[DL-CONFIG] Mapping updated: {}", id);
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "mapping": updated})))
}

/// DELETE /api/datalayer/mappings/{id}  — Deletes a single mapping
async fn delete_datalayer_mapping(
    req: HttpRequest,
    path: web::Path<String>, // The ID comes from the URL
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let id_to_delete = path.into_inner();
    let mut cfg = data.load_datalayer_config();

    let initial_len = cfg.mappings.len();
    cfg.mappings.retain(|m| m.id != id_to_delete);

    // Only save if something was actually deleted
    if cfg.mappings.len() < initial_len {
        if let Err(e) = data.save_datalayer_config(&cfg) {
            return Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
        }
        info!("[DL-CONFIG] Mapping deleted: {}", id_to_delete);
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
}

// Authentication and Authorization

#[derive(Debug, Clone, PartialEq)]
enum UserRole {
    Admin,
    Editor,
    Viewer,
}

impl UserRole {
    fn from_header(role: &str) -> Self {
        match role.to_lowercase().as_str() {
            "admin" => UserRole::Admin,
            "editor" => UserRole::Editor,
            "viewer" => UserRole::Viewer,
            _ => UserRole::Viewer,
        }
    }

    fn can_read(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::Editor | UserRole::Viewer)
    }

    fn can_write(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::Editor)
    }

    fn can_execute(&self) -> bool {
        matches!(self, UserRole::Admin)
    }
}

/// Strip http:// or https:// prefix — tedge config set expects domain only
fn strip_url_scheme(url: &str) -> &str {
    if let Some(rest) = url.strip_prefix("https://") {
        rest
    } else if let Some(rest) = url.strip_prefix("http://") {
        rest
    } else {
        url
    }
}
// Returns 3 values: (user, role, token)
fn extract_user_info(req: &HttpRequest) -> (Option<String>, UserRole, Option<String>) {
    // Check X-Auth-Token (from Caddy) first, then the standard Authorization header
    let token = req
        .headers()
        .get("X-Auth-Token")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.replace("Bearer ", ""))
        .or_else(|| {
            req.headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.strip_prefix("Bearer "))
                .map(|s| s.to_string())
        });

    let user = req
        .headers()
        .get("X-WEBAUTH-USER")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let webauth_role = req
        .headers()
        .get("X-WEBAUTH-ROLE")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let via_proxy = req.headers().contains_key("x-forwarded-proto");

    let role = if !via_proxy || webauth_role.is_empty() || webauth_role == "None" {
        UserRole::Admin
    } else {
        UserRole::from_header(webauth_role)
    };

    // NOTE: this log line confirms whether token extraction is working
    if let Some(ref t) = token {
        if !t.is_empty() {
            info!("✓ Token extracted successfully (length: {} bytes)", t.len());
        }
    }

    (user, role, token)
}

// API Handlers

async fn get_status(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Insufficient permissions"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    let mut status = ServiceStatus {
        mosquitto: "unknown".to_string(),
        agent: "unknown".to_string(),
        bridge: "unknown".to_string(),
        watchdog: "unknown".to_string(),
        webserver: "unknown".to_string(),
        log_upload_manager: "unknown".to_string(),
        mapper_c8y: "unknown".to_string(),
        mapper_aws: "unknown".to_string(),
        mapper_az: "unknown".to_string(),
        c8y: "unknown".to_string(),
        aws: "unknown".to_string(),
        az: "unknown".to_string(),
    };

    if is_snap {
        // /proc/comm scanning is fast (sync) – only for short process names
        let check_process = |name: &str| -> bool {
            if let Ok(entries) = std::fs::read_dir("/proc") {
                for entry in entries.flatten() {
                    let comm_path = entry.path().join("comm");
                    if let Ok(comm) = std::fs::read_to_string(&comm_path) {
                        // codeql[rust/path-injection] - path is from /proc filesystem (kernel-controlled, not user input)
                        if comm.trim() == name {
                            return true;
                        }
                    }
                }
            }
            false
        };

        // Helper: async snapctl services check.
        // IMPORTANT: check the "Current" column == "active", NOT contains("active")
        // because "inactive" also contains the substring "active"!
        // snapctl output: "Service  Startup  Current  Notes" → col[2] must be exactly "active"
        let snapctl_active = |svc: &'static str| async move {
            let full = snap_svc(svc);
            match tokio::process::Command::new("snapctl")
                .args(["services", &full])
                .output()
                .await
            {
                Ok(o) => {
                    let stdout = String::from_utf8_lossy(&o.stdout);
                    let running = stdout.lines().skip(1).any(|line| {
                        line.split_whitespace()
                            .nth(2)
                            .map(|s| s == "active")
                            .unwrap_or(false)
                    });
                    if running {
                        "running"
                    } else {
                        "stopped"
                    }
                }
                _ => "stopped",
            }
        };

        let snap_dir = env::var("SNAP").unwrap_or_default();
        let snap_data_dir = env::var("SNAP_DATA").unwrap_or_else(|_| "/etc/tedge/..".to_string());
        let sub_bin = format!("{}/usr/bin/mosquitto_sub", snap_dir);

        // Run ALL service checks in parallel: snapctl × 6 + mosquitto_sub × 3
        let (
            watchdog_state,
            mapper_c8y_state,
            mapper_aws_state,
            mapper_az_state,
            webserver_state,
            log_mgr_state,
            c8y_conn,
            aws_conn,
            az_conn,
        ) = tokio::join!(
            snapctl_active("tedge-watchdog"),
            snapctl_active("tedge-mapper-c8y"),
            snapctl_active("tedge-mapper-aws"),
            snapctl_active("tedge-mapper-az"),
            snapctl_active("webserver"),
            snapctl_active("tedge-log-upload-manager"),
            check_bridge_state(sub_bin.clone(), snap_data_dir.clone(), "c8y"),
            check_bridge_state(sub_bin.clone(), snap_data_dir.clone(), "aws"),
            check_bridge_state(sub_bin, snap_data_dir, "az"),
        );
        status.mosquitto = if check_process("mosquitto") {
            "running"
        } else {
            "stopped"
        }
        .to_string();
        status.agent = if check_process("tedge-agent") {
            "running"
        } else {
            "stopped"
        }
        .to_string();
        status.bridge = if check_process("tedge-datalayer") {
            "running"
        } else {
            "stopped"
        }
        .to_string();
        status.watchdog = watchdog_state.to_string();
        status.mapper_c8y = mapper_c8y_state.to_string();
        status.mapper_aws = mapper_aws_state.to_string();
        status.mapper_az = mapper_az_state.to_string();
        status.webserver = webserver_state.to_string();
        status.log_upload_manager = log_mgr_state.to_string();
        status.c8y = c8y_conn.to_string();
        status.aws = aws_conn.to_string();
        status.az = az_conn.to_string();

        // Auto-record cert upload when c8y bridge is running (cert was accepted by C8y = it's trusted)
        if c8y_conn == "running" {
            let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
            if config
                .cert_upload
                .as_ref()
                .map(|u| !u.uploaded)
                .unwrap_or(true)
            {
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                config.cert_upload = Some(CertUploadStatus {
                    uploaded: true,
                    timestamp: Some(ts.to_string()),
                    cloud: Some("c8y".to_string()),
                });
                let _ = data.save_config(&config);
                info!("[STATUS] Auto-recorded cert_upload (c8y bridge running)");
            }
        }

        info!("[STATUS] mosquitto={} agent={} bridge={} watchdog={} mapper_c8y={} mapper_aws={} mapper_az={} c8y={} aws={} az={}",
            status.mosquitto, status.agent, status.bridge, status.watchdog,
            status.mapper_c8y, status.mapper_aws, status.mapper_az,
            status.c8y, status.aws, status.az);
    }

    // Zusätzliche Felder für die Mapper explizit ergänzen
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "mosquitto": status.mosquitto,
        "agent": status.agent,
        "bridge": status.bridge,
        "watchdog": status.watchdog,
        "webserver": status.webserver,
        "log_upload_manager": status.log_upload_manager,
        "c8y": status.c8y,
        "aws": status.aws,
        "az": status.az,
        "mapper_c8y": status.mapper_c8y,
        "mapper_aws": status.mapper_aws,
        "mapper_az": status.mapper_az
    })))
}

/// Liest einen einzelnen Wert via `tedge config get <key>`.
/// Gibt `None` zurück wenn der Befehl fehlschlägt oder leer ist.
fn tedge_config_get(key: &str) -> Option<String> {
    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        format!("{}/bin/tedge", snap)
    } else {
        "tedge".to_string()
    };
    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let tedge_config_dir = format!("{}/tedge", snap_data);

    let output = Command::new(&tedge_bin)
        .args(["--config-dir", &tedge_config_dir, "config", "get", key])
        .output()
        .ok()?;

    if output.status.success() {
        let val = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if val.is_empty() || val == "null" {
            None
        } else {
            Some(val)
        }
    } else {
        None
    }
}

async fn get_config(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Insufficient permissions"
        })));
    }

    let mut config = data
        .config
        .lock()
        .unwrap_or_else(|p| p.into_inner())
        .clone();
    let mut changed = false;

    // device.id immer aus dem Zertifikat-CN lesen — das ist die ID, die Cumulocity kennt.
    // tedge config get device.id kann von der Cert-CN abweichen (z.B. Seriennummer vs. Hostname).
    {
        let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
        let cert_path = format!("{}/tedge/device-certs/tedge-certificate.pem", snap_data);
        let cn = std::process::Command::new("openssl")
            .args(["x509", "-in", &cert_path, "-noout", "-subject"])
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    let s = String::from_utf8_lossy(&o.stdout).to_string();
                    // Beispiel: "subject=CN=ctrlx-VirtualControl-1, O=Thin Edge, OU=Device"
                    // oder: "subject= CN = ctrlx-VirtualControl-1"
                    s.split("CN")
                        .nth(1)
                        .and_then(|after| after.split_once('=').map(|x| x.1))
                        .map(|v| v.split(',').next().unwrap_or("").trim().to_string())
                        .filter(|v| !v.is_empty())
                } else {
                    None
                }
            });

        if let Some(cn_val) = cn {
            if config.device.id != cn_val {
                info!("[CONFIG] device.id aus Zertifikat-CN: {}", cn_val);
                config.device.id = cn_val.clone();
                if config.device.name.is_empty() || config.device.name == config.device.id {
                    config.device.name = cn_val;
                }
                changed = true;
            }
        } else if config.device.id.is_empty() {
            // Kein Zertifikat vorhanden: Vorschau-ID anzeigen.
            // Priorität: manage-device-id.sh get-serial → tedge config get device.id → hostname
            let snap = env::var("SNAP").unwrap_or_default();
            let script = format!("{}/scripts/manage-device-id.sh", snap);
            let preview_id = std::process::Command::new("bash")
                .args([&script, "get-serial"])
                .output()
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .filter(|s| !s.is_empty())
                .or_else(|| tedge_config_get("device.id"))
                .or_else(|| {
                    std::process::Command::new("hostname")
                        .output()
                        .ok()
                        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                        .filter(|s| !s.is_empty())
                        .map(|h| format!("ctrlx-{}", h))
                });

            if let Some(id) = preview_id {
                info!("[CONFIG] device.id Vorschau (kein Zertifikat): {}", id);
                config.device.id = id.clone();
                if config.device.name.is_empty() {
                    config.device.name = id;
                }
                changed = true;
            }
        }
    }

    // c8y.url aus tedge lesen wenn leer
    if config.c8y.url.as_deref().unwrap_or("").is_empty() {
        if let Some(url) = tedge_config_get("c8y.url") {
            info!("[CONFIG] c8y.url aus tedge gelesen: {}", url);
            config.c8y.url = Some(url);
            changed = true;
        }
    }

    // aws.url aus tedge lesen wenn leer
    if config.aws.url.as_deref().unwrap_or("").is_empty() {
        if let Some(url) = tedge_config_get("aws.url") {
            info!("[CONFIG] aws.url aus tedge gelesen: {}", url);
            config.aws.url = Some(url);
            changed = true;
        }
    }

    // az.url aus tedge lesen wenn leer
    if config.az.url.as_deref().unwrap_or("").is_empty() {
        if let Some(url) = tedge_config_get("az.url") {
            info!("[CONFIG] az.url aus tedge gelesen: {}", url);
            config.az.url = Some(url);
            changed = true;
        }
    }

    // Falls neue Werte gelesen wurden: auch in die JSON-Datei zurückschreiben
    if changed {
        let mut locked = data.config.lock().unwrap_or_else(|p| p.into_inner());
        *locked = config.clone();
        if let Err(e) = data.save_config(&locked) {
            warn!(
                "[CONFIG] Konnte angereicherte Konfiguration nicht speichern: {}",
                e
            );
        }
    }

    Ok(HttpResponse::Ok().json(config))
}

async fn save_c8y_config(
    req: HttpRequest,
    data: web::Data<AppState>,
    cloud_config: web::Json<C8yConfig>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - write access required"
        })));
    }

    let cloud = cloud_config.into_inner();

    // Apply configuration to thin-edge.io using tedge config set
    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        format!("{}/bin/tedge", snap)
    } else {
        "tedge".to_string()
    };

    let tedge_config_dir = if is_snap {
        let snap_data = env::var("SNAP_DATA").unwrap_or_default();
        format!("{}/tedge", snap_data)
    } else {
        "/etc/tedge".to_string()
    };

    // Set c8y.url if provided
    if let Some(url) = &cloud.url {
        if !url.is_empty() {
            let domain = strip_url_scheme(url);
            info!("Setting c8y.url to: {}", domain);
            let output = Command::new(&tedge_bin)
                .args([
                    "--config-dir",
                    &tedge_config_dir,
                    "config",
                    "set",
                    "c8y.url",
                    domain,
                ])
                .output();

            match output {
                Ok(result) if result.status.success() => {
                    info!("Successfully set c8y.url");
                }
                Ok(result) => {
                    let stderr = String::from_utf8_lossy(&result.stderr);
                    error!("Failed to set c8y.url: {}", stderr);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to set c8y.url: {}", stderr)
                    })));
                }
                Err(e) => {
                    error!("Failed to execute tedge config: {}", e);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to execute tedge config: {}", e)
                    })));
                }
            }
        }
    }

    // Save to local JSON config
    let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
    let mut cloud = cloud;
    // Force disabled when no URL is configured
    if cloud.url.as_deref().unwrap_or("").is_empty() {
        if cloud.enabled {
            warn!("[CONFIG] c8y mapper enabled but no URL set — forcing disabled");
        }
        cloud.enabled = false;
    }
    config.c8y = cloud;

    if let Err(e) = data.save_config(&config) {
        error!("Failed to save C8y config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }

    // Start or stop the Cumulocity mapper based on the enabled toggle.
    // Use --enable/--disable so startup state persists across snap updates.
    if is_snap {
        let (action, flag) = if config.c8y.enabled {
            ("start", "--enable")
        } else {
            ("stop", "--disable")
        };
        info!(
            "[CONFIG] {}ing tedge-mapper-c8y (enabled={})",
            action, config.c8y.enabled
        );
        match std::process::Command::new("snapctl")
            .args([action, flag, &snap_svc("tedge-mapper-c8y")])
            .output()
        {
            Ok(out) if out.status.success() => {
                info!("[CONFIG] tedge-mapper-c8y {}ped successfully", action);
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                error!(
                    "[CONFIG] snapctl {} tedge-mapper-c8y failed: {}",
                    action, stderr
                );
            }
            Err(e) => {
                error!("[CONFIG] Failed to run snapctl {}: {}", action, e);
            }
        }
    }

    let mapper_state = if config.c8y.enabled {
        "started"
    } else {
        "stopped"
    };
    info!(
        "Cumulocity configuration saved successfully (mapper {})",
        mapper_state
    );
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("Cumulocity configuration saved. Mapper {}.", mapper_state)
    })))
}

async fn save_aws_config(
    req: HttpRequest,
    data: web::Data<AppState>,
    cloud_config: web::Json<AwsConfig>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - write access required"
        })));
    }

    let cloud = cloud_config.into_inner();

    // Apply configuration to thin-edge.io using tedge config set
    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        format!("{}/bin/tedge", snap)
    } else {
        "tedge".to_string()
    };

    let tedge_config_dir = if is_snap {
        let snap_data = env::var("SNAP_DATA").unwrap_or_default();
        format!("{}/tedge", snap_data)
    } else {
        "/etc/tedge".to_string()
    };

    // Set aws.url if url is provided
    if let Some(endpoint) = &cloud.url {
        if !endpoint.is_empty() {
            let domain = strip_url_scheme(endpoint);
            info!("Setting aws.url to: {}", domain);
            let output = Command::new(&tedge_bin)
                .args([
                    "--config-dir",
                    &tedge_config_dir,
                    "config",
                    "set",
                    "aws.url",
                    domain,
                ])
                .output();

            match output {
                Ok(result) if result.status.success() => {
                    info!("Successfully set aws.url");
                }
                Ok(result) => {
                    let stderr = String::from_utf8_lossy(&result.stderr);
                    error!("Failed to set aws.url: {}", stderr);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to set aws.url: {}", stderr)
                    })));
                }
                Err(e) => {
                    error!("Failed to execute tedge config: {}", e);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to execute tedge config: {}", e)
                    })));
                }
            }
        }
    }

    // Save to local JSON config
    let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
    let mut cloud = cloud;
    // Force disabled when no URL is configured
    if cloud.url.as_deref().unwrap_or("").is_empty() {
        if cloud.enabled {
            warn!("[CONFIG] aws mapper enabled but no URL set — forcing disabled");
        }
        cloud.enabled = false;
    }
    config.aws = cloud;

    if let Err(e) = data.save_config(&config) {
        error!("Failed to save AWS config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }

    // Start or stop the AWS mapper based on the enabled toggle.
    // Use --enable/--disable so startup state persists across snap updates.
    if is_snap {
        let (action, flag) = if config.aws.enabled {
            ("start", "--enable")
        } else {
            ("stop", "--disable")
        };
        info!(
            "[CONFIG] {}ing tedge-mapper-aws (enabled={})",
            action, config.aws.enabled
        );
        match std::process::Command::new("snapctl")
            .args([action, flag, &snap_svc("tedge-mapper-aws")])
            .output()
        {
            Ok(out) if out.status.success() => {
                info!("[CONFIG] tedge-mapper-aws {}ped successfully", action);
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                error!(
                    "[CONFIG] snapctl {} tedge-mapper-aws failed: {}",
                    action, stderr
                );
            }
            Err(e) => {
                error!("[CONFIG] Failed to run snapctl {}: {}", action, e);
            }
        }
    }

    let mapper_state = if config.aws.enabled {
        "started"
    } else {
        "stopped"
    };
    info!(
        "AWS configuration saved successfully (mapper {})",
        mapper_state
    );
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("AWS configuration saved. Mapper {}.", mapper_state)
    })))
}

async fn save_az_config(
    req: HttpRequest,
    data: web::Data<AppState>,
    cloud_config: web::Json<AzConfig>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - write access required"
        })));
    }

    let cloud = cloud_config.into_inner();

    // Apply configuration to thin-edge.io using tedge config set
    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        format!("{}/bin/tedge", snap)
    } else {
        "tedge".to_string()
    };

    let tedge_config_dir = if is_snap {
        let snap_data = env::var("SNAP_DATA").unwrap_or_default();
        format!("{}/tedge", snap_data)
    } else {
        "/etc/tedge".to_string()
    };

    // Set az.url if url is provided
    if let Some(hub) = &cloud.url {
        if !hub.is_empty() {
            let domain = strip_url_scheme(hub);
            info!("Setting az.url to: {}", domain);
            let output = Command::new(&tedge_bin)
                .args([
                    "--config-dir",
                    &tedge_config_dir,
                    "config",
                    "set",
                    "az.url",
                    domain,
                ])
                .output();

            match output {
                Ok(result) if result.status.success() => {
                    info!("Successfully set az.url");
                }
                Ok(result) => {
                    let stderr = String::from_utf8_lossy(&result.stderr);
                    error!("Failed to set az.url: {}", stderr);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to set az.url: {}", stderr)
                    })));
                }
                Err(e) => {
                    error!("Failed to execute tedge config: {}", e);
                    return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": format!("Failed to execute tedge config: {}", e)
                    })));
                }
            }
        }
    }

    // Save to local JSON config
    let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
    let mut cloud = cloud;
    // Force disabled when no URL is configured
    if cloud.url.as_deref().unwrap_or("").is_empty() {
        if cloud.enabled {
            warn!("[CONFIG] az mapper enabled but no URL set — forcing disabled");
        }
        cloud.enabled = false;
    }
    config.az = cloud;

    if let Err(e) = data.save_config(&config) {
        error!("Failed to save Azure config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }

    // Start or stop the Azure mapper based on the enabled toggle.
    // Use --enable/--disable so startup state persists across snap updates.
    if is_snap {
        let (action, flag) = if config.az.enabled {
            ("start", "--enable")
        } else {
            ("stop", "--disable")
        };
        info!(
            "[CONFIG] {}ing tedge-mapper-az (enabled={})",
            action, config.az.enabled
        );
        match std::process::Command::new("snapctl")
            .args([action, flag, &snap_svc("tedge-mapper-az")])
            .output()
        {
            Ok(out) if out.status.success() => {
                info!("[CONFIG] tedge-mapper-az {}ped successfully", action);
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                error!(
                    "[CONFIG] snapctl {} tedge-mapper-az failed: {}",
                    action, stderr
                );
            }
            Err(e) => {
                error!("[CONFIG] Failed to run snapctl {}: {}", action, e);
            }
        }
    }

    let mapper_state = if config.az.enabled {
        "started"
    } else {
        "stopped"
    };
    info!(
        "Azure configuration saved successfully (mapper {})",
        mapper_state
    );
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": format!("Azure configuration saved. Mapper {}.", mapper_state)
    })))
}

async fn save_device_config(
    req: HttpRequest,
    data: web::Data<AppState>,
    device_config: web::Json<DeviceConfig>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);

    info!(
        "[CONFIG] Device config update by user: {:?}, role: {:?}",
        user, role
    );

    if !role.can_execute() {
        warn!("[CONFIG] Access denied - admin permissions required");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let new_config = device_config.into_inner();
    info!("[CONFIG] New device ID: {}", new_config.id);

    let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
    config.device = new_config;

    if let Err(e) = data.save_config(&config) {
        error!("[CONFIG] Failed to save device config: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }

    info!("[CONFIG] Device configuration saved successfully");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true
    })))
}

#[derive(Debug, Deserialize)]
struct RestartSingleServiceBody {
    service: String,
}

const ALLOWED_SERVICES: &[&str] = &[
    "mosquitto",
    "tedge-agent",
    "tedge-datalayer-bridge",
    "tedge-watchdog",
    "tedge-web-config",
    "tedge-log-upload-manager",
    "tedge-mapper-c8y",
    "tedge-mapper-aws",
    "tedge-mapper-az",
];

fn run_snapctl_service(action: &str, svc: &str) -> Result<HttpResponse> {
    let full = snap_svc(svc);
    match std::process::Command::new("snapctl")
        .args([action, &full])
        .output()
    {
        Ok(output) if output.status.success() => {
            Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "service": svc})))
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"success": false, "error": stderr})))
        }
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)}))),
    }
}

async fn start_single_service(
    req: HttpRequest,
    body: web::Json<RestartSingleServiceBody>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"success": false, "error": "Admin required"})));
    }
    let svc = body.service.trim().to_string();
    if !ALLOWED_SERVICES.contains(&svc.as_str()) {
        return Ok(HttpResponse::BadRequest()
            .json(serde_json::json!({"success": false, "error": "Unknown service"})));
    }
    if env::var("SNAP").is_err() {
        return Ok(HttpResponse::BadRequest().json(
            serde_json::json!({"success": false, "error": "Only available in snap environment"}),
        ));
    }
    info!("[START-SVC] Starting {} (user: {:?})", svc, user);
    run_snapctl_service("start", &svc)
}

async fn stop_single_service(
    req: HttpRequest,
    body: web::Json<RestartSingleServiceBody>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"success": false, "error": "Admin required"})));
    }
    let svc = body.service.trim().to_string();
    if !ALLOWED_SERVICES.contains(&svc.as_str()) {
        return Ok(HttpResponse::BadRequest()
            .json(serde_json::json!({"success": false, "error": "Unknown service"})));
    }
    if env::var("SNAP").is_err() {
        return Ok(HttpResponse::BadRequest().json(
            serde_json::json!({"success": false, "error": "Only available in snap environment"}),
        ));
    }
    info!("[STOP-SVC] Stopping {} (user: {:?})", svc, user);
    run_snapctl_service("stop", &svc)
}

async fn restart_single_service(
    req: HttpRequest,
    body: web::Json<RestartSingleServiceBody>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false, "error": "Admin required"
        })));
    }
    let svc = body.service.trim().to_string();
    if !ALLOWED_SERVICES.contains(&svc.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false, "error": "Unknown service"
        })));
    }
    if env::var("SNAP").is_err() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false, "error": "Only available in snap environment"
        })));
    }
    info!("[RESTART-SVC] Restarting {} (user: {:?})", svc, user);
    run_snapctl_service("restart", &svc)
}

async fn restart_services(req: HttpRequest) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);

    info!(
        "[RESTART] Service restart requested by user: {:?}, role: {:?}",
        user, role
    );

    if !role.can_execute() {
        warn!("[RESTART] Access denied - insufficient permissions");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        warn!("[RESTART] Not in snap environment, cannot restart services");
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Service restart only available in snap environment"
        })));
    }

    let services = vec![
        "tedge-agent",
        "tedge-mapper-c8y",
        "tedge-mapper-aws",
        "tedge-mapper-az",
        "tedge-watchdog",
    ];

    info!(
        "[RESTART] Restarting {} thin-edge.io services...",
        services.len()
    );
    for service in &services {
        info!("[RESTART]   - Restarting {}", service);
        match std::process::Command::new("snapctl")
            .args(["restart", &format!("{}.{}", snap_name(), service)])
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    info!("[RESTART]   ✓ {} restarted successfully", service);
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    error!("[RESTART]   ✗ {} restart failed: {}", service, stderr);
                }
            }
            Err(e) => {
                error!(
                    "[RESTART]   ✗ Failed to execute restart for {}: {}",
                    service, e
                );
            }
        }
    }
    info!("[RESTART] Service restart sequence completed");

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Service restart initiated"
    })))
}

#[derive(Debug, Deserialize)]
struct ConnectPath {
    cloud: String,
}

#[derive(Debug, Deserialize)]
struct SetMqttPortBody {
    port: u16,
}

/// POST /api/set-mqtt-port  — sets c8y.mqtt_service.enabled via tedge config set
/// Port 9883 → enabled=true, Port 8883 → enabled=false
async fn set_mqtt_port(
    req: HttpRequest,
    body: web::Json<SetMqttPortBody>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    if body.port != 8883 && body.port != 9883 {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Invalid port: only 8883 or 9883 allowed"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };
    // 9883 = MQTT Service enabled, 8883 = Core MQTT (service disabled)
    let enabled_str = if body.port == 9883 { "true" } else { "false" };
    let port = body.port;

    info!(
        "[MQTT-PORT] Setting c8y.mqtt_service.enabled={} port={}",
        enabled_str, port
    );
    let result = web::block(move || -> std::io::Result<std::process::Output> {
        // 1. Get c8y.url as base for deriving the correct MQTT hostname
        //    Port 8883 (MQTT Core)    → mqtt.<base-domain>  e.g. mqtt.eu-latest.cumulocity.com
        //    Port 9883 (MQTT Service) → <tenant-url>        e.g. acme.eu-latest.cumulocity.com
        let c8y_url = Command::new(&tedge_bin)
            .args([
                "--config-dir",
                &tedge_config_dir,
                "config",
                "get",
                "c8y.url",
            ])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .unwrap_or_default();

        // Derive correct MQTT host depending on port:
        // 9883 → tenant URL directly (acme.eu-latest.cumulocity.com)
        // 8883 → shared mqtt.* endpoint (mqtt.eu-latest.cumulocity.com)
        let mqtt_host = if port == 9883 {
            c8y_url.clone()
        } else {
            if let Some(dot_pos) = c8y_url.find('.') {
                format!("mqtt.{}", &c8y_url[dot_pos + 1..])
            } else {
                format!("mqtt.{}", c8y_url)
            }
        };

        // 2. Set c8y.mqtt = <correct-host>:<port>
        let new_mqtt = format!("{}:{}", mqtt_host, port);
        info!("[MQTT-PORT] Setting c8y.mqtt={}", new_mqtt);
        Command::new(&tedge_bin)
            .args([
                "--config-dir",
                &tedge_config_dir,
                "config",
                "set",
                "c8y.mqtt",
                &new_mqtt,
            ])
            .output()?;

        // 3. Set c8y.mqtt_service.enabled flag
        Command::new(&tedge_bin)
            .args([
                "--config-dir",
                &tedge_config_dir,
                "config",
                "set",
                "c8y.mqtt_service.enabled",
                enabled_str,
            ])
            .output()?;

        // 4. Always use built-in bridge mode.
        //    The built-in bridge uses a standard MQTT client connection (not the
        //    mosquitto proprietary bridge protocol), which is required for port 9883
        //    (MQTT Service) and also works correctly for port 8883.
        Command::new(&tedge_bin)
            .args([
                "--config-dir",
                &tedge_config_dir,
                "config",
                "set",
                "mqtt.bridge.built_in",
                "true",
            ])
            .output()
    })
    .await;

    match result {
        Ok(Ok(out)) if out.status.success() => {
            info!(
                "[MQTT-PORT] c8y.mqtt_service.enabled={} + c8y.mqtt port={} set successfully",
                enabled_str, port
            );
            // Also sync mqttServiceEnabled in datalayer-mappings.json so the
            // bridge service picks up the correct MQTT topic prefix immediately.
            let mut dl_cfg = data.load_datalayer_config();
            dl_cfg.mqtt_service_enabled = port == 9883;
            if let Err(e) = data.save_datalayer_config(&dl_cfg) {
                warn!(
                    "[MQTT-PORT] Could not update datalayer-mappings.json: {}",
                    e
                );
            }
            Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "port": port})))
        }
        Ok(Ok(out)) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            error!("[MQTT-PORT] Failed: {}", stderr);
            Ok(HttpResponse::Ok().json(serde_json::json!({"success": false, "error": stderr})))
        }
        Ok(Err(e)) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)}))),
    }
}

#[derive(Debug, Deserialize)]
struct UploadCertBody {
    username: String,
    password: String,
}

async fn upload_cert_c8y(
    req: HttpRequest,
    body: web::Json<UploadCertBody>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!(
        "[CERT-UPLOAD] Upload cert to c8y requested by user: {:?}",
        user
    );

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };

    let username = body.username.clone();
    let password = body.password.clone();
    info!("[CERT-UPLOAD] Running: tedge cert upload c8y --user [REDACTED]");

    let result = web::block(move || {
        Command::new(&tedge_bin)
            .args([
                "--config-dir",
                &tedge_config_dir,
                "cert",
                "upload",
                "c8y",
                "--user",
                &username,
                "--password",
                &password,
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?
            .wait_with_output()
    })
    .await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[CERT-UPLOAD] Success: {}", output);
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                {
                    let mut config = data.config.lock().unwrap_or_else(|p| p.into_inner());
                    config.cert_upload = Some(CertUploadStatus {
                        uploaded: true,
                        timestamp: Some(ts.to_string()),
                        cloud: Some("c8y".to_string()),
                    });
                    let _ = data.save_config(&config);
                }
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "output": output
                })))
            } else {
                warn!("[CERT-UPLOAD] Failed: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": false,
                    "output": output
                })))
            }
        }
        Ok(Err(e)) => {
            error!("[CERT-UPLOAD] Exec error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
        Err(e) => {
            error!("[CERT-UPLOAD] Blocking error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
    }
}

async fn connect_cloud(req: HttpRequest, path: web::Path<ConnectPath>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!(
        "[CONNECT] Connect to {} requested by user: {:?}, role: {:?}",
        path.cloud, user, role
    );

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let cloud = path.into_inner().cloud;
    if !matches!(cloud.as_str(), "c8y" | "aws" | "az") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": format!("Unknown cloud: {}", cloud)
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };

    info!("[CONNECT] Running: connect-wrapper.sh connect {}", cloud);
    let result = web::block(move || {
        if is_snap {
            let wrapper = format!(
                "{}/scripts/connect-wrapper.sh",
                env::var("SNAP").unwrap_or_default()
            );
            Command::new(&wrapper)
                .args(["connect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(["--config-dir", &tedge_config_dir, "connect", &cloud])
                .output()
        }
    })
    .await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[CONNECT] Success: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "output": output
                })))
            } else {
                warn!("[CONNECT] Failed: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": false,
                    "output": output
                })))
            }
        }
        Ok(Err(e)) => {
            error!("[CONNECT] Exec error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
        Err(e) => {
            error!("[CONNECT] Blocking error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
    }
}

async fn disconnect_cloud(req: HttpRequest, path: web::Path<ConnectPath>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!(
        "[DISCONNECT] Disconnect {} requested by user: {:?}, role: {:?}",
        path.cloud, user, role
    );

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let cloud = path.into_inner().cloud;
    if !matches!(cloud.as_str(), "c8y" | "aws" | "az") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": format!("Unknown cloud: {}", cloud)
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };

    info!(
        "[DISCONNECT] Running: connect-wrapper.sh disconnect {}",
        cloud
    );
    let result = web::block(move || {
        if is_snap {
            let wrapper = format!(
                "{}/scripts/connect-wrapper.sh",
                env::var("SNAP").unwrap_or_default()
            );
            Command::new(&wrapper)
                .args(["disconnect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(["--config-dir", &tedge_config_dir, "disconnect", &cloud])
                .output()
        }
    })
    .await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[DISCONNECT] Success: {}", output);
                Ok(HttpResponse::Ok()
                    .json(serde_json::json!({ "success": true, "output": output })))
            } else {
                warn!("[DISCONNECT] Failed: {}", output);
                Ok(HttpResponse::Ok()
                    .json(serde_json::json!({ "success": false, "output": output })))
            }
        }
        Ok(Err(e)) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
    }
}

async fn reconnect_cloud(req: HttpRequest, path: web::Path<ConnectPath>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!(
        "[RECONNECT] Reconnect {} requested by user: {:?}, role: {:?}",
        path.cloud, user, role
    );

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let cloud = path.into_inner().cloud;
    if !matches!(cloud.as_str(), "c8y" | "aws" | "az") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": format!("Unknown cloud: {}", cloud)
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };

    info!(
        "[RECONNECT] Running: connect-wrapper.sh reconnect {}",
        cloud
    );
    let result = web::block(move || {
        if is_snap {
            let wrapper = format!(
                "{}/scripts/connect-wrapper.sh",
                env::var("SNAP").unwrap_or_default()
            );
            Command::new(&wrapper)
                .args(["reconnect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(["--config-dir", &tedge_config_dir, "reconnect", &cloud])
                .output()
        }
    })
    .await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[RECONNECT] Success: {}", output);
                Ok(HttpResponse::Ok()
                    .json(serde_json::json!({ "success": true, "output": output })))
            } else {
                warn!("[RECONNECT] Failed: {}", output);
                Ok(HttpResponse::Ok()
                    .json(serde_json::json!({ "success": false, "output": output })))
            }
        }
        Ok(Err(e)) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
    }
}

async fn get_device_id(req: HttpRequest) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);

    info!(
        "[DEVICE-ID] Get device ID requested by user: {:?}, role: {:?}",
        user, role
    );

    if !role.can_read() {
        warn!("[DEVICE-ID] Access denied - insufficient permissions");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }

    // In snap mode the script lives in $SNAP/scripts/; in local dev try the workspace scripts/ dir.
    let script_path = {
        let snap_path = env::var("SNAP")
            .ok()
            .map(|s| PathBuf::from(s).join("scripts/manage-device-id.sh"));
        let local_path = std::env::current_exe().ok().and_then(|p| {
            p.ancestors()
                .nth(4)
                .map(|a| a.join("scripts/manage-device-id.sh"))
        });
        let hardcoded = PathBuf::from("/home/ubuntu/thin-edge-io-app/scripts/manage-device-id.sh");

        [snap_path, local_path, Some(hardcoded)]
            .into_iter()
            .flatten()
            .find(|p| p.exists())
    };

    let (system_serial, current) = if let Some(script_path) = script_path {
        info!("[DEVICE-ID] Using script: {:?}", script_path);
        let script_path_clone = script_path.clone();
        web::block(move || {
            let serial = Command::new(&script_path_clone)
                .arg("get-serial")
                .output()
                .ok()
                .and_then(|o| {
                    if o.status.success() {
                        String::from_utf8(o.stdout).ok()
                    } else {
                        None
                    }
                })
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // get-current exits 1 when no certificate → returns empty string
            let current = Command::new(&script_path)
                .arg("get-current")
                .output()
                .ok()
                .and_then(|o| {
                    if o.status.success() {
                        String::from_utf8(o.stdout).ok()
                    } else {
                        None
                    }
                })
                .map(|s| s.trim().to_string())
                .unwrap_or_default();

            (serial, current)
        })
        .await
        .unwrap_or_else(|_| ("unknown".to_string(), String::new()))
    } else {
        warn!("[DEVICE-ID] manage-device-id.sh not found – returning empty device info");
        ("unknown".to_string(), String::new())
    };

    // Derive has_certificate from the script result: get-current returns non-empty CN only if cert exists.
    // This avoids a hardcoded snap path and works in both snap and local-dev mode.
    let has_certificate = !current.is_empty();
    info!(
        "[DEVICE-ID] Serial: {}, Current: {}, Has cert: {}",
        system_serial, current, has_certificate
    );

    Ok(HttpResponse::Ok().json(DeviceIdInfo {
        current,
        system_serial,
        has_certificate,
    }))
}

#[derive(serde::Deserialize)]
struct CaRequestBody {
    device_name: String,
    otp: String,
}

async fn ca_cert_download(
    req: HttpRequest,
    body: web::Json<CaRequestBody>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);

    info!(
        "[CA-CERT] Certificate download requested by user: {:?}, role: {:?}",
        user, role
    );

    if !role.can_execute() {
        warn!("[CA-CERT] Access denied - admin permissions required");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        warn!("[CA-CERT] Not in snap environment");
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Certificate management only available in snap environment"
        })));
    }

    let device_name = body.device_name.trim().to_string();
    let otp = body.otp.clone();

    if device_name.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Device name cannot be empty"
        })));
    }

    // Validate device name: alphanumeric, dash, underscore, dot – no path traversal
    if device_name.len() > 64
        || !device_name
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.')
    {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Device name may only contain letters, digits, hyphens, underscores, and dots (max 64 chars)"
        })));
    }

    if otp.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "One-time password cannot be empty"
        })));
    }

    // Generate a unique job ID
    let job_id = format!(
        "{:x}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()
            ^ (std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as u32)
    );

    // Register job as pending
    {
        let mut jobs = data.ca_jobs.lock().unwrap_or_else(|e| e.into_inner());
        jobs.insert(
            job_id.clone(),
            CaJob {
                status: CaJobStatus::Pending,
                message: "Waiting for cloud approval…".to_string(),
            },
        );
    }

    let snap_name = env::var("SNAP_INSTANCE_NAME")
        .unwrap_or_else(|_| "ctrlx-cumulocity-thin-edge-io".to_string());
    let snap = env::var("SNAP").unwrap_or_default();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();
    let tedge_bin = PathBuf::from(&snap).join("bin/tedge");
    // Config dir is where manage-device-id.sh already ran `tedge config set device.key_path`
    // pointing to the ctrlX certificate store. We pass --config-dir so tedge cert download
    // finds the existing private key at $SNAP_COMMON/package-certificates/.../own/private/
    let tedge_config_dir = if snap_data.is_empty() {
        String::new()
    } else {
        format!("{}/tedge", snap_data)
    };
    let ca_jobs = data.ca_jobs.clone();
    let job_id_bg = job_id.clone();

    // Read c8y URL from app config – strip https:// prefix, tedge expects domain only
    let c8y_url = {
        let cfg = data.config.lock().unwrap_or_else(|e| e.into_inner());
        strip_url_scheme(&cfg.c8y.url.clone().unwrap_or_default()).to_string()
    };
    if c8y_url.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "C8y URL not configured – please set the Cloud Configuration URL first"
        })));
    }

    info!(
        "[CA-CERT] Starting background job {} for device: {} (config-dir: {})",
        job_id, device_name, tedge_config_dir
    );

    // Run tedge cert download in background – it blocks until cloud approves
    tokio::spawn(async move {
        // Ensure the device-certs directory exists – tedge cert create writes the CSR there.
        // setup-directories.sh creates this on fresh installs, but older snaps may be missing it.
        if !tedge_config_dir.is_empty() {
            let device_certs_dir = format!("{}/device-certs", tedge_config_dir);
            let _ = tokio::process::Command::new("sudo")
                .arg("mkdir")
                .arg("-p")
                .arg(&device_certs_dir)
                .stdin(Stdio::null())
                .output()
                .await;
        }

        // Step 1: `tedge cert create` – generates the CSR and (re)creates the self-signed cert.
        // Must run before `cert download` because download needs the CSR file.
        // Uses --config-dir so tedge finds the private key at the ctrlX cert store path
        // configured by manage-device-id.sh (device.key_path / device.cert_path).
        let mut create_cmd = tokio::process::Command::new("sudo");
        create_cmd
            .arg("snap")
            .arg("run")
            .arg(format!("{}.tedge", snap_name));
        if !tedge_config_dir.is_empty() {
            create_cmd.arg("--config-dir").arg(&tedge_config_dir);
        }
        let create_out = create_cmd
            .arg("cert")
            .arg("create")
            .arg("--device-id")
            .arg(&device_name)
            .env("TEDGE_C8Y_URL", &c8y_url)
            .stdin(Stdio::null())
            .output()
            .await;

        // Helper: decide if cert create result is acceptable to continue
        let cert_create_ok = match &create_out {
            Ok(o) if o.status.success() => {
                info!("[CA-CERT] Job {} – cert create succeeded", job_id_bg);
                true
            }
            Ok(o) => {
                let stderr = String::from_utf8_lossy(&o.stderr).to_string();
                let stdout = String::from_utf8_lossy(&o.stdout).to_string();
                let combined = format!("{}{}", stdout, stderr).trim().to_string();
                // "already exists" means key+cert are present – CSR will be re-generated
                if combined.to_lowercase().contains("already")
                    || combined.to_lowercase().contains("exists")
                {
                    info!(
                        "[CA-CERT] Job {} – cert already exists, continuing",
                        job_id_bg
                    );
                    true
                } else {
                    error!(
                        "[CA-CERT] Job {} – cert create failed: {}",
                        job_id_bg, combined
                    );
                    false
                }
            }
            Err(e) => {
                warn!(
                    "[CA-CERT] Job {} – snap cert create exec error: {}, trying direct binary",
                    job_id_bg, e
                );
                // Fallback: direct tedge binary
                let mut fb = tokio::process::Command::new(&tedge_bin);
                if !tedge_config_dir.is_empty() {
                    fb.arg("--config-dir").arg(&tedge_config_dir);
                }
                match fb
                    .arg("cert")
                    .arg("create")
                    .arg("--device-id")
                    .arg(&device_name)
                    .env("TEDGE_C8Y_URL", &c8y_url)
                    .stdin(Stdio::null())
                    .output()
                    .await
                {
                    Ok(o) if o.status.success() => {
                        info!(
                            "[CA-CERT] Job {} – cert create (fallback) succeeded",
                            job_id_bg
                        );
                        true
                    }
                    Ok(o) => {
                        let msg = format!(
                            "{}{}",
                            String::from_utf8_lossy(&o.stdout),
                            String::from_utf8_lossy(&o.stderr)
                        )
                        .trim()
                        .to_string();
                        if msg.to_lowercase().contains("already")
                            || msg.to_lowercase().contains("exists")
                        {
                            true
                        } else {
                            error!(
                                "[CA-CERT] Job {} – cert create (fallback) failed: {}",
                                job_id_bg, msg
                            );
                            false
                        }
                    }
                    Err(e2) => {
                        error!(
                            "[CA-CERT] Job {} – cert create (fallback) exec error: {}",
                            job_id_bg, e2
                        );
                        false
                    }
                }
            }
        };

        if !cert_create_ok {
            let err_msg = match &create_out {
                Ok(o) => format!(
                    "{}{}",
                    String::from_utf8_lossy(&o.stdout),
                    String::from_utf8_lossy(&o.stderr)
                )
                .trim()
                .to_string(),
                Err(e) => format!("Failed to execute tedge cert create: {}", e),
            };
            let mut jobs = ca_jobs.lock().unwrap_or_else(|e| e.into_inner());
            jobs.insert(
                job_id_bg,
                CaJob {
                    status: CaJobStatus::Error,
                    message: format!("tedge cert create failed: {}", err_msg),
                },
            );
            return;
        }

        // Step 2: download CA-signed certificate (blocks until cloud approves).
        // Pass c8y.url via environment variable override – avoids needing write
        // access to tedge's config file (TEDGE_C8Y_URL is respected by all tedge commands).
        let mut cmd = tokio::process::Command::new("sudo");
        cmd.arg("snap")
            .arg("run")
            .arg(format!("{}.tedge", snap_name));
        if !tedge_config_dir.is_empty() {
            cmd.arg("--config-dir").arg(&tedge_config_dir);
        }
        let output = cmd
            .arg("cert")
            .arg("download")
            .arg("c8y")
            .arg("--device-id")
            .arg(&device_name)
            .env("DEVICE_ONE_TIME_PASSWORD", &otp)
            .env("TEDGE_C8Y_URL", &c8y_url)
            .stdin(Stdio::null())
            .output()
            .await;

        // Fallback: direct tedge binary with --config-dir
        let output = match output {
            Err(_) => {
                let mut fb = tokio::process::Command::new(&tedge_bin);
                if !tedge_config_dir.is_empty() {
                    fb.arg("--config-dir").arg(&tedge_config_dir);
                }
                fb.arg("cert")
                    .arg("download")
                    .arg("c8y")
                    .arg("--device-id")
                    .arg(&device_name)
                    .env("DEVICE_ONE_TIME_PASSWORD", &otp)
                    .env("TEDGE_C8Y_URL", &c8y_url)
                    .stdin(Stdio::null())
                    .output()
                    .await
            }
            ok => ok,
        };

        let result = match output {
            Ok(out) if out.status.success() => {
                let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
                info!("[CA-CERT] Job {} succeeded for {}", job_id_bg, device_name);
                CaJob {
                    status: CaJobStatus::Success,
                    message: if stdout.is_empty() {
                        format!("Certificate downloaded for device: {}", device_name)
                    } else {
                        stdout
                    },
                }
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                let combined = format!("{}{}", stdout, stderr).trim().to_string();
                error!("[CA-CERT] Job {} failed: {}", job_id_bg, combined);
                CaJob {
                    status: CaJobStatus::Error,
                    message: combined,
                }
            }
            Err(e) => {
                error!("[CA-CERT] Job {} exec error: {}", job_id_bg, e);
                CaJob {
                    status: CaJobStatus::Error,
                    message: format!("Failed to execute tedge: {}", e),
                }
            }
        };

        let mut jobs = ca_jobs.lock().unwrap_or_else(|e| e.into_inner());
        jobs.insert(job_id_bg, result);
    });

    Ok(HttpResponse::Accepted().json(serde_json::json!({
        "success": true,
        "job_id": job_id,
        "message": "Certificate download started – waiting for cloud approval"
    })))
}

async fn ca_cert_status(
    req: HttpRequest,
    path: web::Path<String>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }

    let job_id = path.into_inner();
    let jobs = data.ca_jobs.lock().unwrap_or_else(|e| e.into_inner());

    match jobs.get(&job_id) {
        Some(job) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "job_id": job_id,
            "status": job.status,
            "message": job.message
        }))),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Job not found"
        }))),
    }
}

async fn set_device_id(
    req: HttpRequest,
    body: web::Json<SetDeviceIdRequest>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);

    info!(
        "[DEVICE-ID] Set device ID requested by user: {:?}, role: {:?}",
        user, role
    );

    if !role.can_execute() {
        warn!("[DEVICE-ID] Access denied - admin permissions required");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        warn!("[DEVICE-ID] Not in snap environment");
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Device ID management only available in snap environment"
        })));
    }

    let snap = env::var("SNAP").unwrap_or_default();
    let script_path = PathBuf::from(&snap).join("scripts/manage-device-id.sh");

    let device_id = body.device_id.trim();

    if device_id.is_empty() {
        warn!("[DEVICE-ID] Empty device ID provided");
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Device ID cannot be empty"
        })));
    }

    // Validate device ID: only allow safe characters valid for X.509 CN and file system
    // Allows alphanumeric, dash, underscore, dot (common in hostnames and serial numbers)
    if device_id.len() > 64
        || !device_id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.')
    {
        warn!("[DEVICE-ID] Invalid device ID: {}", device_id);
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Device ID may only contain letters, digits, hyphens, underscores, and dots (max 64 chars)"
        })));
    }

    info!("[DEVICE-ID] Setting device ID to: {}", device_id);
    info!("[DEVICE-ID] Executing: {:?} set {}", script_path, device_id);

    let output = Command::new(&script_path)
        .arg("set")
        .arg(device_id)
        .output();

    match output {
        Ok(output) if output.status.success() => {
            info!("Device ID set successfully");
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": format!("Device ID set to: {}", device_id),
                "device_id": device_id
            })))
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Failed to set device ID: {}", stderr);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to create certificate: {}", stderr)
            })))
        }
        Err(e) => {
            error!("Failed to execute device ID script: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to execute script: {}", e)
            })))
        }
    }
}

async fn recreate_certificate(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Certificate management only available in snap environment"
        })));
    }

    let snap = env::var("SNAP").unwrap_or_default();
    let script_path = PathBuf::from(&snap).join("scripts/manage-device-id.sh");

    info!("Recreating device certificate");

    let output = Command::new(&script_path).arg("recreate").output();

    match output {
        Ok(output) if output.status.success() => {
            info!("Certificate recreated successfully");
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": "Certificate recreated successfully"
            })))
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Failed to recreate certificate: {}", stderr);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to recreate certificate: {}", stderr)
            })))
        }
        Err(e) => {
            error!("Failed to execute certificate script: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to execute script: {}", e)
            })))
        }
    }
}

async fn create_certificate_auto(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);

    if !role.can_execute() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Certificate management only available in snap environment"
        })));
    }

    let snap = env::var("SNAP").unwrap_or_default();
    let script_path = PathBuf::from(&snap).join("scripts/manage-device-id.sh");

    info!("Creating certificate with auto-detected device ID");

    let output = Command::new(&script_path).arg("create").output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            info!("Certificate created successfully");
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": format!("Certificate created: {}", stdout.trim())
            })))
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Failed to create certificate: {}", stderr);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to create certificate: {}", stderr)
            })))
        }
        Err(e) => {
            error!("Failed to execute certificate script: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Failed to execute script: {}", e)
            })))
        }
    }
}

async fn show_certificate(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }

    let is_snap = env::var("SNAP").is_ok();
    let tedge_bin = if is_snap {
        format!("{}/bin/tedge", env::var("SNAP").unwrap_or_default())
    } else {
        "tedge".to_string()
    };
    let tedge_config_dir = if is_snap {
        format!("{}/tedge", env::var("SNAP_DATA").unwrap_or_default())
    } else {
        "/etc/tedge".to_string()
    };

    let output = tokio::time::timeout(
        Duration::from_secs(15),
        web::block(move || {
            Command::new(&tedge_bin)
                .args(["--config-dir", &tedge_config_dir, "cert", "show"])
                .output()
        }),
    )
    .await;

    let output = match output {
        Err(_) => {
            warn!("[CERT] tedge cert show timed out after 15s");
            return Ok(HttpResponse::RequestTimeout().json(serde_json::json!({
                "success": false,
                "error": "tedge cert show timed out"
            })));
        }
        Ok(inner) => inner,
    };

    match output {
        Ok(Ok(out)) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout).to_string();
            info!("[CERT] Certificate details fetched");
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "details": text
            })))
        }
        Ok(Ok(out)) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            warn!("[CERT] tedge cert show failed: {}", stderr);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": false,
                "details": if stdout.is_empty() { stderr } else { stdout }
            })))
        }
        Ok(Err(e)) => {
            error!("[CERT] exec error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
        Err(e) => {
            error!("[CERT] blocking error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
    }
}

#[derive(Debug, Deserialize)]
struct LogQuery {
    service: Option<String>,
    lines: Option<usize>,
}

#[derive(Debug, Serialize)]
struct LogResponse {
    lines: Vec<String>,
    service: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LogLevelConfig {
    levels: std::collections::HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct SetLogLevelRequest {
    service: String,
    level: String,
}

async fn get_logs(req: HttpRequest, query: web::Query<LogQuery>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let service = query
        .service
        .clone()
        .unwrap_or_else(|| "tedge-agent".to_string());
    let lines = query.lines.unwrap_or(100).min(500);
    let is_snap = env::var("SNAP").is_ok();

    if !is_snap {
        return Ok(HttpResponse::Ok().json(LogResponse {
            lines: vec!["[Logs only available in snap mode]".to_string()],
            service,
        }));
    }

    let snap_common = env::var("SNAP_COMMON").unwrap_or_else(|_| ".".to_string());

    // snap-hooks and tedge-mapper read from log files directly
    let file_log_service = match service.as_str() {
        "snap-hooks" => Some(format!("{}/tedge/log/snap-hooks.log", snap_common)),
        "tedge-mapper" => Some(format!("{}/tedge/log/tedge-mapper.log", snap_common)),
        _ => None,
    };

    if let Some(log_path) = file_log_service {
        let result = web::block(move || match std::fs::read_to_string(&log_path) {
            // codeql[rust/path-injection] - log_path is constructed from SNAP_COMMON env var (system-controlled by snapd, not user input)
            Ok(content) => {
                let all_lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
                let total = all_lines.len();
                let start = total.saturating_sub(lines);
                all_lines[start..].to_vec()
            }
            Err(e) => vec![format!("[Log-Datei nicht lesbar: {}]", e)],
        })
        .await;
        return match result {
            Ok(log_lines) => Ok(HttpResponse::Ok().json(LogResponse {
                lines: log_lines,
                service,
            })),
            Err(e) => Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("{}", e)}))),
        };
    }

    let snap_service = format!("ctrlx-cumulocity-thin-edge-io.{}", service);
    let lines_str = lines.to_string();

    let result = web::block(move || {
        // journalctl via log-observe interface (requires new snap build with log-observe in webserver plugs)
        let unit = format!("snap.{}.service", snap_service);
        info!("[LOGS] journalctl -u {} -n {}", unit, lines_str);

        let jctl_result = Command::new("journalctl")
            .args(["-u", &unit, "-n", &lines_str, "--no-pager", "--output=short-iso"])
            .output();

        match jctl_result {
            Ok(out) => {
                info!("[LOGS] journalctl exit={} stdout_bytes={} stderr={}",
                    out.status,
                    out.stdout.len(),
                    String::from_utf8_lossy(&out.stderr).trim()
                );
                if !out.stdout.is_empty() {
                    return String::from_utf8_lossy(&out.stdout).to_string();
                }
                // stdout empty — could be permission denied (old snap) or genuinely no entries
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                if stderr.contains("permission") || stderr.contains("insufficient") {
                    format!("[Keine Leseberechtigung für Logs]\nBitte neuen Snap installieren damit log-observe aktiv wird.\njournalctl: {}", stderr.trim())
                } else if !out.status.success() {
                    format!("[journalctl Fehler {}]\n{}", out.status, stderr.trim())
                } else {
                    format!("[Keine Log-Einträge für {}]", unit)
                }
            }
            Err(e) => {
                warn!("[LOGS] journalctl not found or exec error: {}", e);
                format!("[journalctl nicht ausführbar: {}]", e)
            }
        }
    }).await;

    match result {
        Ok(text) => {
            let log_lines: Vec<String> = text.lines().map(|s| s.to_string()).collect();
            info!("[LOGS] {} lines fetched for {}", log_lines.len(), service);
            Ok(HttpResponse::Ok().json(LogResponse {
                lines: log_lines,
                service,
            }))
        }
        Err(e) => {
            error!("[LOGS] Blocking error: {}", e);
            Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("{}", e)})))
        }
    }
}

async fn get_tedge_config_list(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let is_snap = env::var("SNAP").is_ok();
    let snap_bin = env::var("SNAP").unwrap_or_default();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();

    let result = web::block(move || {
        let tedge_bin_owned;
        let tedge_bin = if is_snap {
            tedge_bin_owned = format!("{}/bin/tedge", snap_bin);
            tedge_bin_owned.as_str()
        } else {
            "tedge"
        };
        let config_dir = if is_snap && !snap_data.is_empty() {
            format!("{}/tedge", snap_data)
        } else {
            "/etc/tedge".to_string()
        };
        let mut cmd = Command::new(tedge_bin);
        cmd.args(["--config-dir", &config_dir, "config", "list"]);
        info!("[TEDGE-CONFIG] Running: tedge config list");
        match cmd.output() {
            Ok(out) => {
                if out.status.success() {
                    String::from_utf8_lossy(&out.stdout).to_string()
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    format!(
                        "[Fehler beim Ausführen von 'tedge config list']\n{}",
                        stderr.trim()
                    )
                }
            }
            Err(e) => format!("[tedge nicht ausführbar: {}]", e),
        }
    })
    .await;

    match result {
        Ok(text) => Ok(HttpResponse::Ok().json(serde_json::json!({"output": text}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

async fn get_tedge_config_list_all(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }
    let is_snap = env::var("SNAP").is_ok();
    let snap_bin = env::var("SNAP").unwrap_or_default();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();
    let result = web::block(move || {
        let tedge_bin_owned;
        let tedge_bin = if is_snap {
            tedge_bin_owned = format!("{}/bin/tedge", snap_bin);
            tedge_bin_owned.as_str()
        } else {
            "tedge"
        };
        let config_dir = if is_snap && !snap_data.is_empty() {
            format!("{}/tedge", snap_data)
        } else {
            "/etc/tedge".to_string()
        };
        let mut cmd = Command::new(tedge_bin);
        cmd.args(["--config-dir", &config_dir, "config", "list", "--all"]);
        info!("[TEDGE-CONFIG] Running: tedge config list --all");
        match cmd.output() {
            Ok(out) => {
                if out.status.success() {
                    String::from_utf8_lossy(&out.stdout).to_string()
                } else {
                    format!("[Fehler]\n{}", String::from_utf8_lossy(&out.stderr).trim())
                }
            }
            Err(e) => format!("[tedge nicht ausführbar: {}]", e),
        }
    })
    .await;
    match result {
        Ok(text) => Ok(HttpResponse::Ok().json(serde_json::json!({"output": text}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

async fn get_tedge_config_list_doc(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }
    let is_snap = env::var("SNAP").is_ok();
    let snap_bin = env::var("SNAP").unwrap_or_default();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();
    let result = web::block(move || {
        let tedge_bin_owned;
        let tedge_bin = if is_snap {
            tedge_bin_owned = format!("{}/bin/tedge", snap_bin);
            tedge_bin_owned.as_str()
        } else {
            "tedge"
        };
        let config_dir = if is_snap && !snap_data.is_empty() {
            format!("{}/tedge", snap_data)
        } else {
            "/etc/tedge".to_string()
        };
        let mut cmd = Command::new(tedge_bin);
        cmd.args(["--config-dir", &config_dir, "config", "list", "--doc"]);
        info!("[TEDGE-CONFIG] Running: tedge config list --doc");
        match cmd.output() {
            Ok(out) => {
                if out.status.success() {
                    String::from_utf8_lossy(&out.stdout).to_string()
                } else {
                    format!("[Fehler]\n{}", String::from_utf8_lossy(&out.stderr).trim())
                }
            }
            Err(e) => format!("[tedge nicht ausführbar: {}]", e),
        }
    })
    .await;
    match result {
        Ok(text) => Ok(HttpResponse::Ok().json(serde_json::json!({"output": text}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

async fn get_tedge_bridge_inspect(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }
    let is_snap = env::var("SNAP").is_ok();
    let snap_bin = env::var("SNAP").unwrap_or_default();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();
    let result = web::block(move || {
        let tedge_bin_owned;
        let tedge_bin = if is_snap {
            tedge_bin_owned = format!("{}/bin/tedge", snap_bin);
            tedge_bin_owned.as_str()
        } else {
            "tedge"
        };
        let config_dir = if is_snap && !snap_data.is_empty() {
            format!("{}/tedge", snap_data)
        } else {
            "/etc/tedge".to_string()
        };
        let mut cmd = Command::new(tedge_bin);
        cmd.args(["--config-dir", &config_dir, "bridge", "inspect", "c8y"]);
        info!("[TEDGE-CONFIG] Running: tedge bridge inspect c8y");
        match cmd.output() {
            Ok(out) => {
                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                if !stdout.is_empty() {
                    stdout
                } else {
                    format!("[Fehler]\n{}", stderr.trim())
                }
            }
            Err(e) => format!("[tedge nicht ausführbar: {}]", e),
        }
    })
    .await;
    match result {
        Ok(text) => Ok(HttpResponse::Ok().json(serde_json::json!({"output": text}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

async fn get_build_info(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let snap = env::var("SNAP").unwrap_or_default();
    let snap_name = env::var("SNAP_NAME").unwrap_or_else(|_| "thin-edge-io".to_string());
    let is_snap = !snap.is_empty();

    let build_info_path = if is_snap {
        PathBuf::from(&snap).join("meta/build-info.txt")
    } else {
        PathBuf::from("../configs/build-info.txt")
    };

    let mut version = String::from("-");
    let mut build = String::from("-");
    let mut architecture = String::from("-");

    if let Ok(content) = fs::read_to_string(&build_info_path) {
        // codeql[rust/path-injection] - build_info_path is derived from SNAP env var (system-controlled by snapd, not user input)
        for line in content.lines() {
            if let Some(val) = line.strip_prefix("Version: ") {
                // Format: "2.0.0-2004.1149" (dash) oder legacy "2.0.0+build...." (plus)
                if let Some(sep) = val.find('-').or_else(|| val.find('+')) {
                    version = val[..sep].to_string();
                    build = val[sep + 1..].to_string();
                } else {
                    version = val.to_string();
                }
            } else if let Some(val) = line.strip_prefix("Architecture: ") {
                architecture = val.to_string();
            }
        }
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "version": version,
        "build": build,
        "architecture": architecture,
        "snap_name": snap_name
    })))
}

async fn get_me(req: HttpRequest) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    let role_str = match role {
        UserRole::Admin => "admin",
        UserRole::Editor => "editor",
        UserRole::Viewer => "viewer",
    };
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "user": user,
        "role": role_str
    })))
}

async fn get_log_level(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let log_levels_dir = format!("{}/log-levels", snap_data);
    let mut levels = std::collections::HashMap::new();

    if let Ok(entries) = std::fs::read_dir(&log_levels_dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str().map(|s| s.to_string()) {
                if let Ok(level) = std::fs::read_to_string(entry.path()) {
                    // codeql[rust/path-injection] - path is from read_dir of SNAP_DATA subdirectory (system-controlled, not user input)
                    levels.insert(name, level.trim().to_string());
                }
            }
        }
    }

    Ok(HttpResponse::Ok().json(LogLevelConfig { levels }))
}

async fn set_log_level(
    req: HttpRequest,
    body: web::Json<SetLogLevelRequest>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }

    let valid_levels = ["error", "warn", "info", "debug", "trace"];
    if !valid_levels.contains(&body.level.to_lowercase().as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Invalid log level"
        })));
    }

    // Allowlist to prevent path traversal via the service name field
    let valid_services = [
        "webserver",
        "bridge",
        "tedge",
        "tedge-mapper-c8y",
        "tedge-mapper-aws",
        "tedge-mapper-az",
        "tedge-watchdog",
        "tedge-log-upload-manager",
    ];
    if !valid_services.contains(&body.service.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "success": false,
            "error": "Invalid service name"
        })));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let log_levels_dir = format!("{}/log-levels", sanitize_snap_path(&snap_data));
    let _ = fs::create_dir_all(&log_levels_dir); // codeql[rust/path-injection] - log_levels_dir is derived from SNAP_DATA env var; service name is validated against allowlist above
    let level_file = format!("{}/{}", log_levels_dir, body.service);
    fs::write(&level_file, &body.level)?; // codeql[rust/path-injection] - level_file is derived from SNAP_DATA env var; service name is validated against allowlist above
    info!(
        "[LOG-LEVEL] Set {} = {} (RUST_LOG file)",
        body.service, body.level
    );

    // Restart service to apply new log level (only in snap)
    // Skip restart for "webserver" — would kill ourselves mid-request
    let is_snap = env::var("SNAP").is_ok();
    let svc = body.service.clone();
    if is_snap && svc != "webserver" {
        let snap_service = snap_svc(&svc);
        // Fire-and-forget via web::block so we don't block the async runtime
        actix_web::rt::spawn(async move {
            let _ = web::block(move || {
                Command::new("snapctl")
                    .args(["restart", &snap_service])
                    .output()
            })
            .await;
            info!("[LOG-LEVEL] Restarted {}", svc);
        });
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
}

// Token-based login (for ctrlX reverse proxy compatibility)
async fn token_login(req: HttpRequest) -> Result<HttpResponse> {
    // Extract token from query parameter
    let token = req
        .query_string()
        .split('&')
        .find(|s| s.starts_with("token="))
        .and_then(|s| s.strip_prefix("token="))
        .unwrap_or("");

    if token.is_empty() {
        info!("Login attempt without token, redirecting to home");
        return Ok(HttpResponse::Found()
            .insert_header(("Location", "/thin-edge-io/"))
            .finish());
    }

    info!("Token-based login initiated");

    // In ctrlX environment, the reverse proxy handles authentication
    // We just redirect to the main page with the token in the Authorization header
    // The browser will automatically include the token in subsequent requests
    Ok(HttpResponse::Found()
        .insert_header(("Location", "/thin-edge-io/"))
        .insert_header(("Cache-Control", "no-cache, no-store, must-revalidate"))
        .finish())
}

fn read_build_info() -> Option<String> {
    if let Ok(snap) = env::var("SNAP") {
        let build_info_path = PathBuf::from(&snap).join("meta/build-info.txt");
        if let Ok(content) = fs::read_to_string(&build_info_path) {
            // codeql[rust/path-injection] - build_info_path is derived from SNAP env var (system-controlled by snapd, not user input)
            // Extract version line (first line)
            if let Some(version_line) = content.lines().next() {
                return Some(version_line.to_string());
            }
        }
    }
    None
}

// ── Datalayer API handlers ────────────────────────────────────────────────────

/// Fetch a Bearer token from the ctrlX identity manager.
/// Returns the token string on success, None on failure.
async fn fetch_dl_token(
    client: &reqwest::Client,
    base_url: &str,
    username: &str,
    password: &str,
) -> Option<String> {
    if username.is_empty() || password.is_empty() {
        return None;
    }
    let url = format!(
        "{}/identity-manager/api/v2/auth/token",
        base_url.trim_end_matches('/')
    );
    let params = [
        ("grant_type", "password"),
        ("username", username),
        ("password", password),
    ];
    match client.post(&url).form(&params).send().await {
        Ok(r) if r.status().is_success() => {
            if let Ok(json) = r.json::<serde_json::Value>().await {
                json["access_token"].as_str().map(|s| s.to_string())
            } else {
                None
            }
        }
        Ok(r) => {
            warn!("[DL] Token fetch failed: HTTP {}", r.status());
            None
        }
        Err(e) => {
            warn!("[DL] Token fetch error: {}", e);
            None
        }
    }
}

async fn dl_client_and_token(
    cfg: &DatalayerConfig,
    creds: &DatalayerCredentials,
) -> (reqwest::Client, Option<String>) {
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(cfg.accept_invalid_certs)
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    // 1. Automatischer Auth-Versuch, wenn Zugangsdaten vorhanden sind
    if let (Some(username), Some(password)) = (&creds.username, &creds.password) {
        if let Some(t) = fetch_dl_token(&client, &cfg.base_url, username, password).await {
            return (client, Some(t));
        }
    }

    // 2. Fallback: Statischer Token aus den Credentials
    (client, creds.token.clone())
}

/// GET /api/datalayer/config  — returns config (password + token masked)
async fn get_datalayer_config(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let cfg = web::block(move || {
        let cfg = data.load_datalayer_config();
        let creds = data.load_datalayer_credentials();
        (cfg, creds)
    })
    .await
    .map_err(actix_web::error::ErrorInternalServerError)?;

    let (cfg, creds) = cfg;

    // Return config + masked credentials (never send plaintext password to client)
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "enabled": cfg.enabled,
        "baseUrl": cfg.base_url,
        "pollIntervalMs": cfg.poll_interval_ms,
        "acceptInvalidCerts": cfg.accept_invalid_certs,
        "mappings": cfg.mappings,
        "username": creds.username.as_deref().unwrap_or(""),
        "password": if creds.password.is_some() { "***" } else { "" },
        "token": if creds.token.is_some() { "***" } else { "" },
    })))
}

#[derive(Debug, Deserialize)]
struct SaveDatalayerConfigBody {
    pub enabled: bool,
    pub base_url: String,
    pub poll_interval_ms: u64,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub password: String,
    #[serde(default)]
    pub token: String,
    #[serde(default = "dl_default_true")]
    pub accept_invalid_certs: bool,
}

fn dl_default_true() -> bool {
    true
}

/// POST /api/datalayer/config  — save connection settings
async fn save_datalayer_config_handler(
    req: HttpRequest,
    body: web::Json<SaveDatalayerConfigBody>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let mut cfg = data.load_datalayer_config();

    cfg.enabled = body.enabled;
    // base_url nur überschreiben, wenn nicht leer
    if !body.base_url.trim().is_empty() {
        cfg.base_url = body.base_url.clone();
    } else if cfg.base_url.trim().is_empty() {
        // Falls bisher auch leer, auf Default setzen
        cfg.base_url = "https://localhost".to_string();
    }

    // FIX 1: Expliziter Cast nach u32
    cfg.poll_interval_ms = body.poll_interval_ms.max(500) as u32;

    // FIX 2: Zuweisung des neuen Feldes
    cfg.accept_invalid_certs = body.accept_invalid_certs;

    // Credentials separat speichern (nicht in datalayer-mappings.json)
    let mut creds = data.load_datalayer_credentials();
    if !body.username.is_empty() && body.username != "***" {
        creds.username = Some(body.username.clone());
    }
    if !body.password.is_empty() && body.password != "***" {
        creds.password = Some(body.password.clone());
    }
    if !body.token.is_empty() && body.token != "***" {
        creds.token = Some(body.token.clone());
    }
    if let Err(e) = data.save_datalayer_credentials(&creds) {
        error!("[DL-CONFIG] Credentials save failed: {}", e);
    }

    if let Err(e) = data.save_datalayer_config(&cfg) {
        error!("[DL-CONFIG] Save failed: {}", e);
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
}

/// GET /api/datalayer/mappings  — return all mappings
async fn get_datalayer_mappings(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let cfg = web::block(move || data.load_datalayer_config())
        .await
        .map_err(actix_web::error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"mappings": cfg.mappings})))
}

/// GET /api/datalayer/raw-config  — Lädt die JSON-Datei als rohen Text (für Debugging)
async fn get_raw_datalayer_config(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    // Wir lesen die Datei einfach nur als String und schicken sie direkt zurück,
    // OHNE sie durch den serde_json Parser zu jagen!
    match std::fs::read_to_string(&data.datalayer_config_path) {
        // codeql[rust/path-injection] - path is derived from SNAP_DATA env var (system-controlled by snapd, not user input)
        Ok(content) => {
            Ok(HttpResponse::Ok()
                .content_type("application/json") // Sagt dem Browser, dass es JSON ist
                .body(content))
        }
        Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Konnte datalayer-mappings.json nicht von der Festplatte lesen: {}", e)
        }))),
    }
}

/// POST /api/datalayer/mappings  — replace all mappings
async fn save_datalayer_mappings(
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let mappings: Vec<DatalayerMapping> = match serde_json::from_value(
        body.get("mappings")
            .cloned()
            .unwrap_or(serde_json::Value::Array(vec![])),
    ) {
        Ok(m) => m,
        Err(e) => {
            return Ok(HttpResponse::BadRequest()
                .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
        }
    };
    let mut cfg = data.load_datalayer_config();
    cfg.mappings = mappings;
    if let Err(e) = data.save_datalayer_config(&cfg) {
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "count": cfg.mappings.len()})))
}

/// GET /api/license-status — returns whether a valid license is currently held.
/// Used by the UI to show/hide the license warning banner on page load.
async fn get_license_status(req: HttpRequest, _data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().finish());
    }

    let has_license = std::path::Path::new(LICENSE_ID_FILE).exists()
        && std::fs::read_to_string(LICENSE_ID_FILE) // codeql[rust/path-injection] - LICENSE_ID_FILE is a compile-time constant path, not user input
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "licensed": has_license,
        "required": LICENSE_NAMES[0],
    })))
}

/// HTTP GET über einen Unix-Domain-Socket. Gibt (HTTP-Status, Body) zurück.
async fn unix_socket_get(
    socket_path: &str,
    api_path: &str,
) -> std::result::Result<(u16, String), String> {
    unix_socket_request(socket_path, "GET", api_path, None).await
}

async fn unix_socket_post(
    socket_path: &str,
    api_path: &str,
    body: &str,
) -> std::result::Result<(u16, String), String> {
    unix_socket_request(socket_path, "POST", api_path, Some(body)).await
}

async fn unix_socket_delete(
    socket_path: &str,
    api_path: &str,
) -> std::result::Result<(u16, String), String> {
    unix_socket_request(socket_path, "DELETE", api_path, None).await
}

/// Generische HTTP-Anfrage über Unix-Domain-Socket. Gibt (HTTP-Status, Body) zurück.
async fn unix_socket_request(
    socket_path: &str,
    method: &str,
    api_path: &str,
    body: Option<&str>,
) -> std::result::Result<(u16, String), String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::UnixStream;

    let mut stream = UnixStream::connect(socket_path)
        .await
        .map_err(|e| format!("connect '{}': {}", socket_path, e))?;

    let request = if let Some(payload) = body {
        format!(
            "{} {} HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nAccept: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            method, api_path, payload.len(), payload
        )
    } else {
        format!(
            "{} {} HTTP/1.1\r\nHost: localhost\r\nAccept: application/json\r\nConnection: close\r\n\r\n",
            method, api_path
        )
    };

    stream
        .write_all(request.as_bytes())
        .await
        .map_err(|e| format!("write: {}", e))?;

    let mut buf = Vec::new();
    stream
        .read_to_end(&mut buf)
        .await
        .map_err(|e| format!("read: {}", e))?;

    let text = String::from_utf8_lossy(&buf).to_string();

    // HTTP-Status aus erster Zeile parsen: "HTTP/1.1 200 OK"
    let status: u16 = text
        .lines()
        .next()
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    // Body nach \r\n\r\n extrahieren
    let body = if let Some(pos) = text.find("\r\n\r\n") {
        text[pos + 4..].to_string()
    } else if let Some(pos) = text.find("\n\n") {
        text[pos + 2..].to_string()
    } else {
        text
    };

    Ok((status, body))
}

/// Lizenznamen die geprüft werden: app-spezifische Lizenz + ctrlX COREvirtual 4H-Demo
const LICENSE_NAMES: &[&str] = &[
    "SWL-XCx-RUN-DLACCESSNRTxx-NNNN", // Hauptlizenz (Data Layer Access NRT)
    "SWL_XCB_ENGINEERING_4H",         // ctrlX COREvirtual 4h Engineering Demo (Bosch)
    "SWL_XCR_ENGINEERING_4H",         // ctrlX CORE 4h Engineering Demo (Rexroth)
];

/// Engineering/Demo-Lizenzen sind device-weit gehalten und können nicht per acquire geholt werden.
/// Sie werden nur in capabilities geprüft (count > 0, startsInSeconds <= 0, expiresInSeconds > 0).
const ENGINEERING_LICENSE_NAMES: &[&str] = &["SWL_XCB_ENGINEERING_4H", "SWL_XCR_ENGINEERING_4H"];

/// Prüft ob eine Engineering-Lizenz aktiv in den capabilities vorhanden ist.
/// Gibt den Lizenznamen zurück wenn gefunden, sonst None.
async fn check_engineering_license_in_capabilities(socket_path: &str) -> Option<String> {
    match unix_socket_get(socket_path, "/license-manager/api/v1/capabilities").await {
        Ok((200, body)) => {
            let arr: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
            let items = arr.as_array().cloned().unwrap_or_default();
            for item in &items {
                let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("");
                let count = item.get("count").and_then(|v| v.as_i64()).unwrap_or(0);
                let starts_in = item
                    .get("startsInSeconds")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0);
                let expires_in = item
                    .get("expiresInSeconds")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(-1);
                if ENGINEERING_LICENSE_NAMES.contains(&name)
                    && count > 0
                    && starts_in <= 0
                    && expires_in != 0
                {
                    return Some(name.to_string());
                }
            }
            None
        }
        Ok((status, body)) => {
            warn!(
                "[LICENSE] GET /capabilities HTTP {}: {}",
                status,
                &body[..body.len().min(200)]
            );
            None
        }
        Err(e) => {
            warn!("[LICENSE] GET /capabilities socket error: {}", e);
            None
        }
    }
}
/// Datei in /tmp für die gehaltene Lizenz-ID (überlebt App-Restart, nicht Reboot)
const LICENSE_ID_FILE: &str = "/tmp/ctrlx-cumulocity-thin-edge-io.license";

/// Versucht eine Lizenz über den Unix-Socket zu acquiren.
/// Gibt die Lizenz-ID zurück wenn erfolgreich, sonst None.
async fn acquire_license(socket_path: &str, license_name: &str) -> Option<String> {
    // Try with version "1.0" first, then without version (for engineering/demo licenses)
    let payloads = [
        format!(r#"{{"name":"{}","version":"1.0"}}"#, license_name),
        format!(r#"{{"name":"{}"}}"#, license_name),
    ];
    for payload in &payloads {
        match unix_socket_post(socket_path, "/license-manager/api/v1/license", payload).await {
            Ok((200, body)) => {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body) {
                    if let Some(id) = val.get("id").and_then(|v| v.as_str()) {
                        return Some(id.to_string());
                    }
                }
                warn!(
                    "[LICENSE] POST /license HTTP 200 but no id in response: {}",
                    &body[..body.len().min(200)]
                );
                // Try next payload variant
            }
            Ok((status, body)) => {
                warn!(
                    "[LICENSE] POST /license '{}' HTTP {}: {}",
                    license_name,
                    status,
                    &body[..body.len().min(200)]
                );
                // Try next payload variant
            }
            Err(e) => {
                warn!(
                    "[LICENSE] POST /license '{}' socket error: {}",
                    license_name, e
                );
                // Try next payload variant
            }
        }
    }
    None
}

/// Gibt eine gehaltene Lizenz frei.
async fn release_license(socket_path: &str, license_id: &str) {
    let path = format!("/license-manager/api/v1/license/{}", license_id);
    match unix_socket_delete(socket_path, &path).await {
        Ok((204, _)) => info!("[LICENSE] Released license id={}", license_id),
        Ok((status, body)) => warn!(
            "[LICENSE] Release HTTP {}: {}",
            status,
            &body[..body.len().min(200)]
        ),
        Err(e) => warn!("[LICENSE] Release socket error: {}", e),
    }
    let _ = std::fs::remove_file(LICENSE_ID_FILE);
}

/// Hintergrund-Task: Lizenz acquiren, stündlich neu prüfen, bei Fehlen warnen.
/// Läuft so lange bis der Prozess beendet wird (kein Shutdown-Signal nötig).
async fn run_license_loop(socket_path: String) {
    info!(
        "[LICENSE] License enforcement loop started, socket={}",
        socket_path
    );

    let mut current_id: Option<String> = None;

    // Beim Start: eventuell noch gehaltene ID aus /tmp laden und zuerst freigeben
    if let Ok(old_id) = std::fs::read_to_string(LICENSE_ID_FILE) {
        // codeql[rust/path-injection] - LICENSE_ID_FILE is a compile-time constant path, not user input
        let old_id = old_id.trim().to_string();
        if !old_id.is_empty() && !old_id.starts_with("engineering:") {
            info!(
                "[LICENSE] Releasing stale license id={} from previous run",
                old_id
            );
            release_license(&socket_path, &old_id).await;
        } else if old_id.starts_with("engineering:") {
            // Engineering license marker — nothing to release, just remove the file
            let _ = std::fs::remove_file(LICENSE_ID_FILE);
        }
    }

    loop {
        // Lizenz-Socket vorhanden?
        if !std::path::Path::new(&socket_path).exists() {
            warn!(
                "[LICENSE] licensing-service socket not found at '{}' — plug not connected?",
                socket_path
            );
        } else {
            // Bestehende Lizenz freigeben (re-acquire Zyklus)
            if let Some(ref id) = current_id.take() {
                release_license(&socket_path, id).await;
            }

            // Nacheinander alle Lizenznamen probieren
            let mut acquired = false;
            for &license_name in LICENSE_NAMES {
                if let Some(id) = acquire_license(&socket_path, license_name).await {
                    info!("[LICENSE] Acquired license '{}' id={}", license_name, id);
                    // ID in /tmp persistieren für Release bei Shutdown
                    let _ = std::fs::write(LICENSE_ID_FILE, &id); // codeql[rust/path-injection] - LICENSE_ID_FILE is a compile-time constant path, not user input
                    current_id = Some(id);
                    acquired = true;
                    break;
                }
            }

            if !acquired {
                // Engineering-Lizenzen sind device-weit gehalten (availableCount=0) und
                // können nicht per acquire geholt werden — nur capabilities prüfen.
                if let Some(eng_name) =
                    check_engineering_license_in_capabilities(&socket_path).await
                {
                    info!("[LICENSE] Engineering license '{}' found in capabilities — device is in engineering mode", eng_name);
                    let marker = format!("engineering:{}", eng_name);
                    // codeql[rust/path-injection] - LICENSE_ID_FILE is a compile-time constant path, not user input
                    let _ = std::fs::write(LICENSE_ID_FILE, &marker);
                    // Engineering licenses expire — re-check after 5 minutes
                    tokio::time::sleep(std::time::Duration::from_secs(300)).await;
                    continue;
                }
                warn!(
                    "[LICENSE] No license available! Required: {}. App continues but license is missing.",
                    LICENSE_NAMES[0]
                );
            }
        }

        // Stündlich neu prüfen (SDK-Empfehlung: periodisch prüfen)
        tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
    }
}

/// GET /api/licenses — proxy ctrlX licensing-manager API server-side via Unix socket (native Rust).
async fn get_licenses(req: HttpRequest, _data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().finish());
    }

    // The licensing manager API is available via Unix domain socket only.
    // Socket path: $SNAP_DATA/licensing-service/licensing-service.sock
    // API endpoint: GET /license-manager/api/v1/capabilities
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();
    let socket_path = if !snap_data.is_empty() {
        format!("{}/licensing-service/licensing-service.sock", snap_data)
    } else {
        "/tmp/licensing-service.sock".to_string()
    };

    match unix_socket_get(&socket_path, "/license-manager/api/v1/capabilities").await {
        Ok((status, body)) => {
            warn!(
                "[LICENSES] HTTP {} raw={}",
                status,
                &body[..body.len().min(500)]
            );
            if status == 200 {
                let json: serde_json::Value = serde_json::from_str(&body).unwrap_or(
                    serde_json::json!({"error": format!("non-JSON from licensing socket: {}", &body[..body.len().min(200)])}),
                );
                Ok(HttpResponse::Ok().json(json))
            } else {
                Ok(HttpResponse::ServiceUnavailable()
                    .json(serde_json::json!({"error": format!("licensing API returned HTTP {}: {}", status, &body[..body.len().min(200)])})))
            }
        }
        Err(e) => {
            warn!("[LICENSES] socket error: {}", e);
            Ok(HttpResponse::ServiceUnavailable()
                .json(serde_json::json!({"error": format!("licensing socket unavailable: {}", e)})))
        }
    }
}

#[derive(Debug, Deserialize)]
struct BrowseQuery {
    #[serde(default)]
    path: String,
}
/// GET /api/datalayer/browse?path=...  — proxy browse request to ctrlX Datalayer REST
async fn browse_datalayer(
    req: HttpRequest,
    query: web::Query<BrowseQuery>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    // 1. Extrahiere Token aus dem Header (Browser-Request)
    let (_user, role, extracted_token) = extract_user_info(&req);

    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().finish());
    }

    let cfg = data.load_datalayer_config();
    let creds = data.load_datalayer_credentials();

    if cfg.base_url.is_empty() {
        return Ok(HttpResponse::ServiceUnavailable()
            .json(serde_json::json!({"error": "Datalayer base_url not configured"})));
    }

    // 2. Pfad für ctrlX aufbereiten
    let path = query.path.trim_start_matches('/').trim_end_matches('/');
    let url = if path.is_empty() {
        format!(
            "{}/automation/api/v2/nodes?type=browse",
            cfg.base_url.trim_end_matches('/')
        )
    } else {
        format!(
            "{}/automation/api/v2/nodes/{}?type=browse",
            cfg.base_url.trim_end_matches('/'),
            path
        )
    };

    // 3. Client holen (dieser holt bei Bedarf ein neues Token via User/Passwort!)
    let (http_client, stored_token) = dl_client_and_token(&cfg, &creds).await;
    let mut req_builder = http_client.get(&url);

    // Priorität: Token vom Browser > Token vom Backend (User/Passwort)
    if let Some(t) = extracted_token.or(stored_token) {
        req_builder = req_builder.bearer_auth(t);
    }

    match req_builder.send().await {
        Ok(resp) => {
            let status = resp.status();
            let body: serde_json::Value = resp
                .json()
                .await
                .unwrap_or(serde_json::json!({"error": "invalid response"}));
            Ok(HttpResponse::build(
                actix_web::http::StatusCode::from_u16(status.as_u16())
                    .unwrap_or(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR),
            )
            .json(body))
        }
        Err(e) => {
            Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": e.to_string()})))
        }
    }
}

/// GET /api/datalayer/node?path=...  — read single node value
async fn read_datalayer_node(
    req: HttpRequest,
    query: web::Query<BrowseQuery>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let cfg = data.load_datalayer_config();
    let creds = data.load_datalayer_credentials();
    if cfg.base_url.is_empty() {
        return Ok(HttpResponse::ServiceUnavailable()
            .json(serde_json::json!({"error": "Datalayer base_url not configured"})));
    }

    // Bearer-Token aus dem Request-Header extrahieren (Proxy-Token hat Priorität)

    // Bearer-Token aus X-Auth-Token oder Authorization Header extrahieren (X-Auth-Token hat Priorität)
    let bearer_token = req
        .headers()
        .get("X-Auth-Token")
        .and_then(|v| v.to_str().ok())
        .or_else(|| {
            req.headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.strip_prefix("Bearer "))
        })
        .map(|s| s.to_string());

    let (http_client, token) = dl_client_and_token(&cfg, &creds).await;

    let path = query.path.trim_matches('/');
    let url = format!(
        "{}/automation/api/v2/nodes/{}?type=all",
        cfg.base_url.trim_end_matches('/'),
        path
    );

    let mut req_builder = http_client.get(&url);
    // Priorität: Proxy-Token > gespeicherter Token
    if let Some(t) = bearer_token.or(token) {
        req_builder = req_builder.bearer_auth(t);
    }

    match req_builder.send().await {
        Ok(resp) => {
            let status = resp.status();
            let body: serde_json::Value = resp
                .json()
                .await
                .unwrap_or(serde_json::json!({"error": "invalid response"}));
            Ok(HttpResponse::build(
                actix_web::http::StatusCode::from_u16(status.as_u16())
                    .unwrap_or(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR),
            )
            .json(body))
        }
        Err(e) => {
            warn!("[DL-NODE] Request failed: {}", e);
            Ok(HttpResponse::ServiceUnavailable()
                .json(serde_json::json!({"error": format!("{}", e)})))
        }
    }
}

/// GET /api/inventory  — reads inventory.json from SNAP_DATA (= /var/snap/.../current)
async fn get_inventory(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let path = format!("{}/tedge/device/inventory.json", snap_data);
    // If file doesn't exist, try to generate it via update-inventory.sh
    if !std::path::Path::new(&path).exists() {
        let snap_dir = env::var("SNAP").unwrap_or_default();
        let script = format!("{}/scripts/update-inventory.sh", snap_dir);
        if std::path::Path::new(&script).exists() {
            info!("[INVENTORY] File not found, running update-inventory.sh");
            let _ = web::block(move || Command::new("bash").arg(&script).status()).await;
        }
    }

    match std::fs::read_to_string(&path) {
        // codeql[rust/path-injection] - path is constructed from SNAP_DATA env var (system-controlled by snapd, not user input)
        Ok(content) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "content": content,
            "path": path
        }))),
        Err(e) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "content": "{}",
            "path": path,
            "error": format!("{}", e)
        }))),
    }
}

/// POST /api/inventory  — saves inventory.json and publishes all fragments to MQTT
async fn save_and_publish_inventory(
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"success": false, "error": "Insufficient permissions"})));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let snap_dir = env::var("SNAP").unwrap_or_default();

    let content = match body.get("content").and_then(|v| v.as_str()) {
        Some(c) => c.to_string(),
        None => {
            return Ok(HttpResponse::BadRequest()
                .json(serde_json::json!({"success": false, "error": "Missing content"})))
        }
    };

    // Validate JSON
    let parsed: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "error": format!("Invalid JSON: {}", e)
            })))
        }
    };

    // Save to SNAP_DATA path (= /var/snap/.../current)
    let path = format!("{}/tedge/device/inventory.json", snap_data);

    if let Some(parent) = std::path::Path::new(&path).parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            // codeql[rust/path-injection] - path is constructed from SNAP_DATA env var (system-controlled by snapd, not user input)
            return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("Cannot create directory: {}", e)
            })));
        }
    }
    if let Err(e) = std::fs::write(&path, &content) {
        // codeql[rust/path-injection] - path is constructed from SNAP_DATA env var (system-controlled by snapd, not user input)
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Save failed: {}", e)
        })));
    }

    // Publish each top-level fragment to MQTT
    let pub_bin = format!("{}/usr/bin/mosquitto_pub", snap_dir);
    let pub_bin = if std::path::Path::new(&pub_bin).exists() {
        pub_bin
    } else {
        "mosquitto_pub".to_string()
    };

    let mut published = vec![];
    let mut errors = vec![];

    if let serde_json::Value::Object(map) = &parsed {
        for (key, value) in map {
            let topic = format!("te/device/main///twin/{}", key);
            let payload = value.to_string();
            let t = topic.clone();
            let p = payload.clone();
            let bin = pub_bin.clone();
            let result = web::block(move || {
                Command::new(&bin)
                    .args(["-h", "127.0.0.1", "-p", "1883", "-r", "-t", &t, "-m", &p])
                    .stdin(Stdio::null())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .spawn()?
                    .wait_with_output()
            })
            .await;
            match result {
                Ok(Ok(out)) if out.status.success() => published.push(key.clone()),
                _ => errors.push(key.clone()),
            }
        }
    }

    info!(
        "[INVENTORY] Saved and published {} fragments, {} errors",
        published.len(),
        errors.len()
    );
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "published": published,
        "errors": errors,
        "path": path
    })))
}

// ── Flows Management API ─────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct SaveFlowFileBody {
    content: String,
}

/// Validates a mapper name: only alphanumeric, dash, underscore, dot — no path traversal.
fn validate_mapper_name(mapper: &str) -> bool {
    !mapper.is_empty()
        && !mapper.contains("..")
        && mapper
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.')
}

/// Validates a flow directory name: only alphanumeric, dash, underscore — no dots or path separators.
fn validate_flow_dir_name(name: &str) -> bool {
    !name.is_empty()
        && !name.contains("..")
        && !name.contains('/')
        && !name.contains('\\')
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Validates a flow file name: must be *.js, *.toml, or *.toml.template — no path separators.
fn validate_flow_file_name(name: &str) -> bool {
    !name.is_empty()
        && !name.contains('/')
        && !name.contains('\\')
        && !name.contains("..")
        && (name.ends_with(".js") || name.ends_with(".toml") || name.ends_with(".toml.template"))
}

/// GET /api/flows?mapper=<name>  — lists flow directories and their files
async fn list_flows(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let mapper = req
        .query_string()
        .split('&')
        .find(|s| s.starts_with("mapper="))
        .and_then(|s| s.strip_prefix("mapper="))
        .unwrap_or("")
        .to_string();

    if !validate_mapper_name(&mapper) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid mapper name"}))
        );
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    // codeql[rust/path-injection] - mapper is validated via validate_mapper_name
    let flows_dir = format!("{}/tedge/mappers/{}/flows", snap_data, mapper);

    let mut flows: Vec<serde_json::Value> = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&flows_dir) {
        // codeql[rust/path-injection] - flows_dir constructed from validated mapper name
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let flow_name = match path.file_name().and_then(|n| n.to_str()) {
                Some(n) if validate_flow_dir_name(n) => n.to_string(),
                _ => continue,
            };
            let mut files: Vec<serde_json::Value> = Vec::new();
            if let Ok(file_entries) = std::fs::read_dir(&path) {
                // codeql[rust/path-injection] - path is inside validated flows_dir
                for fentry in file_entries.flatten() {
                    let fpath = fentry.path();
                    if !fpath.is_file() {
                        continue;
                    }
                    let fname = match fpath.file_name().and_then(|n| n.to_str()) {
                        Some(n) if validate_flow_file_name(n) => n.to_string(),
                        _ => continue,
                    };
                    if let Ok(content) = std::fs::read_to_string(&fpath) {
                        // codeql[rust/path-injection] - fpath is inside validated flow dir
                        files.push(serde_json::json!({"name": fname, "content": content}));
                    }
                }
            }
            files.sort_by(|a, b| {
                let rank = |n: &str| -> u8 {
                    match n {
                        "flow.toml" => 0,
                        "params.toml" => 1,
                        n if n.ends_with(".toml") => 2,
                        n if n.ends_with(".js") => 3,
                        _ => 4,
                    }
                };
                let an = a["name"].as_str().unwrap_or("");
                let bn = b["name"].as_str().unwrap_or("");
                rank(an).cmp(&rank(bn)).then(an.cmp(bn))
            });
            flows.push(serde_json::json!({"name": flow_name, "files": files}));
        }
    }
    flows.sort_by(|a, b| {
        a["name"]
            .as_str()
            .unwrap_or("")
            .cmp(b["name"].as_str().unwrap_or(""))
    });

    Ok(HttpResponse::Ok().json(serde_json::json!({"flows": flows})))
}

/// POST /api/flows/file?mapper=<m>&flow=<f>&file=<n>  — saves a file within a flow directory
async fn save_flow_file(
    req: HttpRequest,
    body: web::Json<SaveFlowFileBody>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let qs = req.query_string().to_string();
    let mapper = qs
        .split('&')
        .find(|s| s.starts_with("mapper="))
        .and_then(|s| s.strip_prefix("mapper="))
        .unwrap_or("")
        .to_string();
    let flow = qs
        .split('&')
        .find(|s| s.starts_with("flow="))
        .and_then(|s| s.strip_prefix("flow="))
        .unwrap_or("")
        .to_string();
    let file = qs
        .split('&')
        .find(|s| s.starts_with("file="))
        .and_then(|s| s.strip_prefix("file="))
        .unwrap_or("")
        .to_string();

    if !validate_mapper_name(&mapper) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid mapper name"}))
        );
    }
    if !validate_flow_dir_name(&flow) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid flow name"}))
        );
    }
    if !validate_flow_file_name(&file) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid file name. Allowed: *.js, *.toml, *.toml.template"
        })));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    // codeql[rust/path-injection] - mapper, flow, file are all validated above
    let flow_dir = format!("{}/tedge/mappers/{}/flows/{}", snap_data, mapper, flow);
    let _ = std::fs::create_dir_all(&flow_dir);
    let file_path = format!("{}/{}", flow_dir, file);

    match std::fs::write(&file_path, &body.content) {
        // codeql[rust/path-injection] - file_path constructed from validated components
        Ok(_) => {
            info!("[FLOWS] Saved {}/{}/{}", mapper, flow, file);
            Ok(
                HttpResponse::Ok()
                    .json(serde_json::json!({"ok": true, "flow": flow, "file": file})),
            )
        }
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

/// DELETE /api/flows?mapper=<m>&flow=<f>  — deletes an entire flow directory
async fn delete_flow_dir(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let qs = req.query_string().to_string();
    let mapper = qs
        .split('&')
        .find(|s| s.starts_with("mapper="))
        .and_then(|s| s.strip_prefix("mapper="))
        .unwrap_or("")
        .to_string();
    let flow = qs
        .split('&')
        .find(|s| s.starts_with("flow="))
        .and_then(|s| s.strip_prefix("flow="))
        .unwrap_or("")
        .to_string();

    if !validate_mapper_name(&mapper) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid mapper name"}))
        );
    }
    if !validate_flow_dir_name(&flow) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid flow name"}))
        );
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    // codeql[rust/path-injection] - mapper and flow are validated above
    let flow_dir = format!("{}/tedge/mappers/{}/flows/{}", snap_data, mapper, flow);

    match std::fs::remove_dir_all(&flow_dir) {
        // codeql[rust/path-injection] - flow_dir constructed from validated components
        Ok(_) => {
            info!("[FLOWS] Deleted flow directory: {}/{}", mapper, flow);
            Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Flow not found"})))
        }
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

/// DELETE /api/flows/file?mapper=<m>&flow=<f>&file=<n>  — deletes a single file from a flow
async fn delete_flow_file_handler(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let qs = req.query_string().to_string();
    let mapper = qs
        .split('&')
        .find(|s| s.starts_with("mapper="))
        .and_then(|s| s.strip_prefix("mapper="))
        .unwrap_or("")
        .to_string();
    let flow = qs
        .split('&')
        .find(|s| s.starts_with("flow="))
        .and_then(|s| s.strip_prefix("flow="))
        .unwrap_or("")
        .to_string();
    let file = qs
        .split('&')
        .find(|s| s.starts_with("file="))
        .and_then(|s| s.strip_prefix("file="))
        .unwrap_or("")
        .to_string();

    if !validate_mapper_name(&mapper) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid mapper name"}))
        );
    }
    if !validate_flow_dir_name(&flow) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid flow name"}))
        );
    }
    if !validate_flow_file_name(&file) {
        return Ok(
            HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid file name"}))
        );
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    // codeql[rust/path-injection] - mapper, flow, file are all validated above
    let file_path = format!(
        "{}/tedge/mappers/{}/flows/{}/{}",
        snap_data, mapper, flow, file
    );

    match std::fs::remove_file(&file_path) {
        // codeql[rust/path-injection] - file_path constructed from validated components
        Ok(_) => {
            info!("[FLOWS] Deleted file: {}/{}/{}", mapper, flow, file);
            Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "File not found"})))
        }
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

/// GET /api/snapconfig?file=<name>  — reads an allowed snap config file
async fn get_snap_config_file(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let file_name = req
        .query_string()
        .split('&')
        .find(|s| s.starts_with("file="))
        .and_then(|s| s.strip_prefix("file="))
        .unwrap_or("")
        .to_string();

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let snap_common = env::var("SNAP_COMMON").unwrap_or_else(|_| snap_data.clone());
    let path = match resolve_snap_config_path(&file_name, &snap_data, &snap_common) {
        Some(p) => p,
        None => {
            return Ok(HttpResponse::BadRequest().json(
                serde_json::json!({"error": format!("Unknown config file: {}", file_name)}),
            ));
        }
    };

    match std::fs::read_to_string(&path) {
        // codeql[rust/path-injection] - path is resolved via allowlist in resolve_snap_config_path (not direct user input)
        Ok(content) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "file": file_name,
            "path": path,
            "content": content
        }))),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            // File does not exist yet — create it with a sensible default
            let default = default_snap_config_content(&file_name);
            if let Some(parent) = std::path::Path::new(&path).parent() {
                let _ = std::fs::create_dir_all(parent); // codeql[rust/path-injection] - path is resolved via allowlist in resolve_snap_config_path (not direct user input)
            }
            match std::fs::write(&path, &default) { // codeql[rust/path-injection] - path is resolved via allowlist in resolve_snap_config_path (not direct user input)
                Ok(_) => {
                    info!("[SNAP-CONFIG] Created default file: {}", path);
                    Ok(HttpResponse::Ok().json(serde_json::json!({
                        "file": file_name,
                        "path": path,
                        "content": default
                    })))
                }
                Err(we) => Ok(HttpResponse::Ok().json(serde_json::json!({
                    "file": file_name,
                    "path": path,
                    "content": "",
                    "error": format!("Datei existiert noch nicht und konnte nicht erstellt werden: {}", we)
                })))
            }
        }
        Err(e) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "file": file_name,
            "path": path,
            "content": "",
            "error": format!("{}", e)
        }))),
    }
}

/// Returns sensible default content for a newly created snap config file
fn default_snap_config_content(file_name: &str) -> String {
    match file_name {
        "datalayer-mappings.json" => "[]".to_string(),
        f if f.ends_with(".json") => "{}".to_string(),
        _ => String::new(),
    }
}

#[derive(Debug, Deserialize)]
struct SaveSnapConfigBody {
    file: String,
    content: String,
}

/// POST /api/snapconfig  — writes an allowed snap config file
async fn save_snap_config_file(
    req: HttpRequest,
    body: web::Json<SaveSnapConfigBody>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let snap_common = env::var("SNAP_COMMON").unwrap_or_else(|_| snap_data.clone());
    let path = match resolve_snap_config_path(&body.file, &snap_data, &snap_common) {
        Some(p) => p,
        None => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "error": format!("Unknown config file: {}", body.file)
            })));
        }
    };

    if let Some(parent) = std::path::Path::new(&path).parent() {
        let _ = std::fs::create_dir_all(parent); // codeql[rust/path-injection] - path is resolved via allowlist in resolve_snap_config_path (not direct user input)
    }
    match std::fs::write(&path, &body.content) {
        // codeql[rust/path-injection] - path is resolved via allowlist in resolve_snap_config_path (not direct user input)
        Ok(_) => {
            info!("[SNAP-CONFIG] Saved {}", body.file);
            Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
        }
        Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("{}", e)
        }))),
    }
}

/// Whitelist-based path resolver — only allows known safe config files
fn resolve_snap_config_path(file_name: &str, snap_data: &str, snap_common: &str) -> Option<String> {
    match file_name {
        "tedge-log-plugin.toml" => {
            Some(format!("{}/tedge/plugins/tedge-log-plugin.toml", snap_data))
        }
        "tedge-configuration-plugin.toml" => Some(format!(
            "{}/tedge/plugins/tedge-configuration-plugin.toml",
            snap_data
        )),
        "tedge.toml" => Some(format!("{}/tedge/tedge.toml", snap_data)),
        "inventory.json" => Some(format!("{}/tedge/device/inventory.json", snap_data)),
        "snap-inventory.json" => Some(format!("{}/snap-inventory.json", snap_data)),
        "tedge-web-config.json" => Some(format!("{}/tedge-web-config.json", snap_common)),
        "datalayer-mappings.json" => {
            // liegt direkt in SNAP_DATA (nicht in einem Unterordner)
            Some(format!("{}/datalayer-mappings.json", snap_data))
        }
        _ => None,
    }
}

/// GET /api/datalayer/status  — connection status
async fn get_datalayer_status(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    let cfg = data.load_datalayer_config();
    let creds = data.load_datalayer_credentials();
    let mapping_count = cfg.mappings.len();
    let active_count = cfg.mappings.iter().filter(|m| m.enabled).count();

    if !cfg.enabled || cfg.base_url.is_empty() {
        return Ok(HttpResponse::Ok().json(serde_json::json!({
            "enabled": cfg.enabled,
            "connected": false,
            "base_url": cfg.base_url,
            "mapping_count": mapping_count,
            "active_mappings": active_count,
        })));
    }

    // Token-Extraktion (X-Auth-Token hat Vorrang)
    let bearer_token = req
        .headers()
        .get("X-Auth-Token")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.replace("Bearer ", ""))
        .or_else(|| {
            req.headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.strip_prefix("Bearer "))
                .map(|s| s.to_string())
        });

    let (http_client, stored_token) = dl_client_and_token(&cfg, &creds).await;

    // ctrlX API Pfad (Prüfe ob /automation/... oder /admin/...)
    let url = format!(
        "{}/admin/api/v2/nodes?type=browse",
        cfg.base_url.trim_end_matches('/')
    );

    let mut req_builder = http_client.get(&url);

    if let Some(t) = bearer_token.clone().or(stored_token) {
        debug!("Datalayer-Request mit Token (Länge: {})", t.len());
        req_builder = req_builder.bearer_auth(t);
    }

    let (connected, http_status, connect_error) = match req_builder.send().await {
        Ok(r) => {
            let s = r.status().as_u16();
            if s == 401 {
                warn!("Datalayer Zugriff verweigert (401) - Token ungültig?");
            }
            (r.status().is_success(), Some(s), None)
        }
        Err(e) => {
            error!("Datalayer Verbindungsfehler: {}", e);
            (false, None, Some(e.to_string()))
        }
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "enabled": cfg.enabled,
        "connected": connected,
        "http_status": http_status,
        "connect_error": connect_error,
        "base_url": cfg.base_url,
        "mapping_count": mapping_count,
        "active_mappings": active_count,
        "poll_interval_ms": cfg.poll_interval_ms,
    })))
}

// ─── Mapping Mode API ────────────────────────────────────────────────────────

/// Returns the current mapping mode:
/// - "bridge"  → Datalayer Bridge Mappings active (transform ≠ Raw, enabled=true, direction=dl_to_tedge)
/// - "flows"   → Tedge Flows active (ctrlx-* flow dirs present in SNAP_DATA)
/// - "both"    → Both active simultaneously (conflict / double-publishing)
/// - "none"    → Neither active
async fn get_mapping_mode(
    req: HttpRequest,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let dl_cfg = data.load_datalayer_config();
    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());

    // Bridge active: datalayer enabled AND at least one active transform mapping
    let bridge_active = dl_cfg.enabled && dl_cfg.mappings.iter().any(|m| {
        m.enabled
            && m.direction == MappingDirection::DatalayerToTedge
            && m.transform != MappingTransform::Raw
    });

    // Flows active: ctrlx-* flow directories exist under SNAP_DATA/tedge/mappers/c8y/flows/
    let flows_base = PathBuf::from(&snap_data).join("tedge/mappers/c8y/flows");
    let flow_dirs = ["ctrlx-measurements", "ctrlx-events", "ctrlx-alarms"];
    let flows_active = flow_dirs.iter().any(|d| flows_base.join(d).is_dir());

    let mode = match (bridge_active, flows_active) {
        (true, true)  => "both",
        (true, false) => "bridge",
        (false, true) => "flows",
        (false, false) => "none",
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "mode": mode,
        "bridge_active": bridge_active,
        "flows_active": flows_active,
    })))
}

#[derive(serde::Deserialize)]
struct SetMappingModeRequest {
    mode: String, // "bridge" | "flows" | "none"
}

/// Switch mapping mode:
/// - "bridge" → disable flows (remove ctrlx-* dirs), keep bridge mappings as-is
/// - "flows"  → disable bridge transform mappings (set enabled=false for all non-Raw dl_to_tedge)
/// - "none"   → disable both
async fn set_mapping_mode(
    req: HttpRequest,
    data: web::Data<AppState>,
    body: web::Json<SetMappingModeRequest>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let flows_base = PathBuf::from(&snap_data).join("tedge/mappers/c8y/flows");
    let flow_dirs = ["ctrlx-measurements", "ctrlx-events", "ctrlx-alarms"];

    match body.mode.as_str() {
        "bridge" => {
            // Disable flows: rename ctrlx-* dirs to ctrlx-*.disabled
            for dir in &flow_dirs {
                let src = flows_base.join(dir);
                let dst = flows_base.join(format!("{}.disabled", dir));
                if src.exists() {
                    if let Err(e) = std::fs::rename(&src, &dst) {
                        warn!("[MAPPING-MODE] Could not disable flow {}: {}", dir, e);
                    } else {
                        info!("[MAPPING-MODE] Flow disabled: {}", dir);
                    }
                }
            }
        }
        "flows" => {
            // Re-enable flows: rename ctrlx-*.disabled back
            for dir in &flow_dirs {
                let src = flows_base.join(format!("{}.disabled", dir));
                let dst = flows_base.join(dir);
                if src.exists() {
                    if let Err(e) = std::fs::rename(&src, &dst) {
                        warn!("[MAPPING-MODE] Could not enable flow {}: {}", dir, e);
                    } else {
                        info!("[MAPPING-MODE] Flow enabled: {}", dir);
                    }
                }
            }
            // Disable bridge transform mappings (set enabled=false for non-Raw dl_to_tedge)
            let mut dl_cfg = data.load_datalayer_config();
            for m in dl_cfg.mappings.iter_mut() {
                if m.direction == MappingDirection::DatalayerToTedge
                    && m.transform != MappingTransform::Raw
                {
                    m.enabled = false;
                }
            }
            if let Err(e) = data.save_datalayer_config(&dl_cfg) {
                warn!("[MAPPING-MODE] Could not save datalayer config: {}", e);
            }
        }
        "none" => {
            // Disable both
            for dir in &flow_dirs {
                let src = flows_base.join(dir);
                let dst = flows_base.join(format!("{}.disabled", dir));
                if src.exists() {
                    let _ = std::fs::rename(&src, &dst);
                }
            }
            let mut dl_cfg = data.load_datalayer_config();
            for m in dl_cfg.mappings.iter_mut() {
                if m.direction == MappingDirection::DatalayerToTedge
                    && m.transform != MappingTransform::Raw
                {
                    m.enabled = false;
                }
            }
            let _ = data.save_datalayer_config(&dl_cfg);
        }
        _ => {
            return Ok(HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Invalid mode. Use: bridge, flows, none"})));
        }
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "mode": body.mode})))
}

/// Sanitize a path derived from environment variables (e.g. SNAP_DATA) to prevent
/// path traversal: remove any `..` components before constructing file paths.
fn sanitize_snap_path(path: &str) -> String {
    use std::path::Component;
    let sanitized: std::path::PathBuf = std::path::Path::new(path)
        .components()
        .filter(|c| !matches!(c, Component::ParentDir))
        .collect();
    sanitized.to_string_lossy().into_owned()
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Logging initialisieren
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    let is_snap = env::var("SNAP").is_ok();
    let snap_data =
        sanitize_snap_path(&env::var("SNAP_DATA").unwrap_or_else(|_| String::from(".")));

    // Credentials and web config in SNAP_COMMON — survives snap updates
    let snap_common =
        sanitize_snap_path(&env::var("SNAP_COMMON").unwrap_or_else(|_| snap_data.clone()));

    let config_path = if is_snap {
        // Use SNAP_COMMON so cert_upload and cloud config survive snap updates
        PathBuf::from(&snap_common).join("tedge-web-config.json")
    } else {
        PathBuf::from("./tedge-web-config.json")
    };

    let datalayer_config_path = if is_snap {
        PathBuf::from(&snap_data).join("datalayer-mappings.json")
    } else {
        PathBuf::from("./datalayer-mappings.json")
    };

    // Credentials in SNAP_COMMON speichern – bleibt über Snap-Updates erhalten
    // (snap_common already defined above)
    let credentials_path = if is_snap {
        PathBuf::from(&snap_common).join("datalayer-credentials.json")
    } else {
        PathBuf::from("./datalayer-credentials.json")
    };

    let web_root = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        PathBuf::from(&snap).join("web/www")
    } else {
        PathBuf::from("./www")
    };

    info!("thin-edge.io Configuration Webserver (Rust) gestartet");
    info!("Snap-Modus: {}", is_snap);
    if let Some(build) = read_build_info() {
        info!("Build-Info: {}", build);
    }
    info!("Web root: {:?}", web_root);
    info!("Config file: {:?}", config_path);

    let app_state = web::Data::new(AppState::new(
        config_path,
        datalayer_config_path,
        credentials_path,
    ));

    let server = HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(middleware::Logger::new("%a %r %s %b %T ms"))
            .wrap(middleware::Compress::default())
            // Root-Redirect: / → /thin-edge-io/
            .route(
                "/",
                web::get().to(|| async {
                    HttpResponse::Found()
                        .insert_header(("Location", "/thin-edge-io/"))
                        .finish()
                }),
            )
            // Lokaler Fallback (falls du auf dem PC entwickelst)
            .service(Files::new("/local", web_root.clone()).index_file("index.html"))
            // Alles, was über den ctrlX Proxy kommt, liegt unter /thin-edge-io
            .service(
                web::scope("/thin-edge-io")
                    // Die API liegt jetzt unter /thin-edge-io/api/...
                    .service(
                        web::scope("/api")
                            .route("/status", web::get().to(get_status))
                            .route("/config", web::get().to(get_config))
                            .route("/config/c8y", web::post().to(save_c8y_config))
                            .route("/config/aws", web::post().to(save_aws_config))
                            .route("/config/az", web::post().to(save_az_config))
                            .route("/config/device", web::post().to(save_device_config))
                            .route("/restart", web::post().to(restart_services))
                            .route("/restart-service", web::post().to(restart_single_service))
                            .route("/start-service", web::post().to(start_single_service))
                            .route("/stop-service", web::post().to(stop_single_service))
                            .route("/connect/{cloud}", web::post().to(connect_cloud))
                            .route("/disconnect/{cloud}", web::post().to(disconnect_cloud))
                            .route("/reconnect/{cloud}", web::post().to(reconnect_cloud))
                            .route("/set-mqtt-port", web::post().to(set_mqtt_port))
                            .route("/cert/upload/c8y", web::post().to(upload_cert_c8y))
                            .route("/device-id", web::get().to(get_device_id))
                            .route("/device-id", web::post().to(set_device_id))
                            .route("/device-id/ca-request", web::post().to(ca_cert_download))
                            .route(
                                "/device-id/ca-request/{job_id}",
                                web::get().to(ca_cert_status),
                            )
                            .route("/device-id/recreate", web::post().to(recreate_certificate))
                            .route(
                                "/device-id/create-auto",
                                web::post().to(create_certificate_auto),
                            )
                            .route("/device-id/cert-info", web::get().to(show_certificate))
                            .route("/logs", web::get().to(get_logs))
                            .route("/tedge-config-list", web::get().to(get_tedge_config_list))
                            .route(
                                "/tedge-config-list-all",
                                web::get().to(get_tedge_config_list_all),
                            )
                            .route(
                                "/tedge-config-list-doc",
                                web::get().to(get_tedge_config_list_doc),
                            )
                            .route(
                                "/tedge-bridge-inspect",
                                web::get().to(get_tedge_bridge_inspect),
                            )
                            .route(
                                "/mapping-mode",
                                web::get().to(get_mapping_mode),
                            )
                            .route(
                                "/mapping-mode",
                                web::post().to(set_mapping_mode),
                            )
                            .route("/me", web::get().to(get_me))
                            .route("/build-info", web::get().to(get_build_info))
                            .route("/log-level", web::get().to(get_log_level))
                            .route("/log-level", web::post().to(set_log_level))
                            .route("/snapconfig", web::get().to(get_snap_config_file))
                            .route("/snapconfig", web::post().to(save_snap_config_file))
                            .route("/inventory", web::get().to(get_inventory))
                            .route("/inventory", web::post().to(save_and_publish_inventory))
                            .route("/licenses", web::get().to(get_licenses))
                            .route("/license-status", web::get().to(get_license_status))
                            // Flows API
                            .route("/flows", web::get().to(list_flows))
                            .route("/flows", web::delete().to(delete_flow_dir))
                            .route("/flows/file", web::post().to(save_flow_file))
                            .route("/flows/file", web::delete().to(delete_flow_file_handler))
                            // Datalayer API
                            .service(
                                web::scope("/datalayer")
                                    .route("/status", web::get().to(get_datalayer_status))
                                    .route("/config", web::get().to(get_datalayer_config))
                                    .route("/config", web::post().to(save_datalayer_config_handler))
                                    .route("/raw-config", web::get().to(get_raw_datalayer_config))
                                    .route("/mappings", web::get().to(get_datalayer_mappings))
                                    .route("/mappings", web::post().to(save_datalayer_mappings))
                                    .route("/mappings/add", web::post().to(add_datalayer_mapping))
                                    .route(
                                        "/mappings/{id}",
                                        web::put().to(update_datalayer_mapping),
                                    )
                                    .route(
                                        "/mappings/{id}",
                                        web::delete().to(delete_datalayer_mapping),
                                    )
                                    .route("/browse", web::get().to(browse_datalayer))
                                    .route("/node", web::get().to(read_datalayer_node)),
                            ),
                    )
                    // Login liegt unter /thin-edge-io/login
                    .route("/login", web::get().to(token_login))
                    // Static Files GANZ AM ENDE DES SCOPES! (Wichtig für Actix Routing)
                    .service(Files::new("/", web_root.clone()).index_file("index.html")),
            )
    });

    if is_snap {
        let snap_data_lic = std::env::var("SNAP_DATA").unwrap_or_default();
        let socket_path = format!("{}/licensing-service/licensing-service.sock", snap_data_lic);
        tokio::spawn(run_license_loop(socket_path));
    }

    if is_snap {
        let snap_data = std::env::var("SNAP_DATA")
            .unwrap_or_else(|_| String::from("/var/snap/thin-edge-io/current"));

        // Unterordner "thin-edge-io" für den ctrlX Proxy-Standard (package-run/<snapname>/web.sock)
        let sock_dir = format!("{}/package-run/thin-edge-io", snap_data);
        let socket_path = format!("{}/web.sock", sock_dir);

        // Verzeichnis anlegen (jetzt inklusive Unterordner)
        if let Err(e) = std::fs::create_dir_all(&sock_dir) {
            warn!("Konnte Verzeichnis {} nicht erstellen: {}", sock_dir, e);
        }

        let _ = std::fs::remove_file(&socket_path);

        info!("Starte Server auf Unix-Socket: {}", socket_path);

        let bound_server = server.bind_uds(&socket_path)?;

        // Berechtigungen auf 777 (Wichtig, damit der Proxy-User zugreifen darf)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&socket_path, std::fs::Permissions::from_mode(0o777));
        }

        bound_server.run().await
    } else {
        let port = std::env::var("WEB_PORT").unwrap_or_else(|_| "8888".to_string());
        let bind = format!("0.0.0.0:{}", port);
        info!("Starte Server auf http://{}", bind);
        server.bind(&bind)?.run().await
    }
}
