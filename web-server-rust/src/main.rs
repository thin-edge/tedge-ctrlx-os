use actix_files::Files;
use actix_web::{middleware, web, App, HttpRequest, HttpResponse, HttpServer, Result};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeviceConfig {
    id: String,
    #[serde(default)]
    name: String,
    #[serde(rename = "type", default)]
    device_type: String,
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
                device_type: "ctrlX-CORE".to_string(),
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
    // Step 1: check if bridge config exists at all
    let bridge_conf = format!("{}/tedge/mosquitto-conf/{}-bridge.conf", snap_data, cloud);
    if !std::path::Path::new(&bridge_conf).exists() {
        return "inactive";
    }

    let bridge_name = match cloud {
        "c8y" => "edge_to_c8y",
        "aws" => "edge_to_aws",
        "az"  => "edge_to_az",
        _     => return "unknown",
    };

    // mapper service name (used both as fallback and as proxy for bridge state)
    let mapper_svc = match cloud {
        "c8y" => "thin-edge-io.tedge-mapper-c8y",
        "aws" => "thin-edge-io.tedge-mapper-aws",
        "az"  => "thin-edge-io.tedge-mapper-az",
        _     => return "unknown",
    };

    // Step 2: if mosquitto_sub is available, query $SYS/broker/connection/<name>/state.
    // Note: $SYS topics are only published at sys_interval (default 10s) or on state change.
    // If mosquitto_sub times out or returns an ambiguous result, fall through to Step 3.
    if std::path::Path::new(&sub_bin).exists() {
        let topic = format!("$SYS/broker/connection/{}/state", bridge_name);
        let result = tokio::time::timeout(
            std::time::Duration::from_secs(4),
            tokio::process::Command::new(&sub_bin)
                .args(["-h", "127.0.0.1", "-p", "1883", "-t", &topic, "-C", "1", "-W", "3"])
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .output(),
        ).await;

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
    match std::process::Command::new("snapctl").args(["services", mapper_svc]).output() {
        Ok(o) if String::from_utf8_lossy(&o.stdout).contains("active") => "running",
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

struct AppState {
    config: Mutex<Config>,
    config_path: PathBuf,
    datalayer_config_path: PathBuf,
}

impl AppState {
    fn new(config_path: PathBuf, datalayer_config_path: PathBuf) -> Self {
        info!("[INIT] Loading configuration from: {:?}", config_path);
        let config = Self::load_config(&config_path);
        info!("[INIT] Configuration loaded successfully");
        // Lege initiale Default-Datei an, falls sie nicht existiert
        if !config_path.exists() {
            info!("[INIT] Creating initial default config at: {:?}", config_path);
            if let Err(e) = Self::save_config_static(&config_path, &config) {
                warn!("[INIT] Failed to write initial config file: {}", e);
            }
        }

        // Datalayer-Konfigurationsdatei mit Defaults anlegen, falls sie fehlt
        if !datalayer_config_path.exists() {
            info!("[INIT] Creating initial datalayer config at: {:?}", datalayer_config_path);
            let default_dl = DatalayerConfig::default_internal();
            if let Some(parent) = datalayer_config_path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            match std::fs::write(&datalayer_config_path, serde_json::to_string_pretty(&default_dl).unwrap()) {
                Ok(_) => info!("[INIT] Datalayer config written with defaults."),
                Err(e) => warn!("[INIT] Failed to write datalayer config: {}", e),
            }
        }

        AppState {
            config: Mutex::new(config),
            config_path,
            datalayer_config_path,
        }
    }

    fn save_config_static(path: &PathBuf, config: &Config) -> io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(config)?;
        fs::write(path, json)?;
        Ok(())
    }

    fn load_config(path: &PathBuf) -> Config {
        info!("[CONFIG-LOAD] Attempting to load config from: {:?}", path);
        if let Ok(content) = fs::read_to_string(path) {
            info!("[CONFIG-LOAD] File read successfully, size: {} bytes", content.len());
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
        info!("[CONFIG-SAVE] Saving configuration to: {:?}", self.config_path);
        info!("[CONFIG-SAVE] Device ID: {}, Name: {}, Type: {}", config.device.id, config.device.name, config.device.device_type);
        info!("[CONFIG-SAVE] C8y enabled: {}, AWS enabled: {}, Azure enabled: {}", 
              config.c8y.enabled, config.aws.enabled, config.az.enabled);
        
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(config)?;
        fs::write(&self.config_path, json)?;
        
        info!("[CONFIG-SAVE] Configuration saved successfully");
        Ok(())
    }

    fn load_datalayer_config(&self) -> DatalayerConfig {
            let snap_data = std::env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
            // Pfad an deinen Snap anpassen (x4, x5 etc. war in deinen Logs zu sehen)
            let path = std::path::PathBuf::from(snap_data).join("datalayer-mappings.json");
            
            if let Ok(content) = std::fs::read_to_string(path) {
                serde_json::from_str(&content).unwrap_or_else(|_| DatalayerConfig::default_internal())
            } else {
                DatalayerConfig::default_internal()
            }
        }

    fn save_datalayer_config(&self, cfg: &DatalayerConfig) -> io::Result<()> {
        if let Some(parent) = self.datalayer_config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(cfg)?;
        fs::write(&self.datalayer_config_path, json)?;
        info!("[DL-CONFIG] Datalayer config saved to {:?}", self.datalayer_config_path);
        Ok(())
    }
}

// ── ctrlX Datalayer structs ───────────────────────────────────────────────────

fn dl_default_true() -> bool { true }


#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
enum MappingTransform {
    Raw,
    Measurement,
    Event,
    Alarm,
}
impl Default for MappingTransform {
    fn default() -> Self { MappingTransform::Measurement }
}



#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatalayerMapping {
    pub id: String,
    #[serde(alias = "datalayer_path")]
    pub path: String,
    #[serde(alias = "tedge_topic")]
    pub topic: String,
    pub transform: String,
    pub field_name: Option<String>,
    pub unit: Option<String>,
    #[serde(default = "dl_default_true")]
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DatalayerConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(rename = "baseUrl", default)]
    pub base_url: String,
    #[serde(rename = "pollIntervalMs", default = "default_poll_interval")]
    pub poll_interval_ms: u32,
    #[serde(default)]
    pub mappings: Vec<DatalayerMapping>,
    pub username: Option<String>,
    pub password: Option<String>,
    #[serde(default)]
    pub token: Option<String>,
    // NEU: Dieses Feld hinzufügen
    #[serde(rename = "acceptInvalidCerts", default)]
    pub accept_invalid_certs: bool,
}
impl DatalayerConfig {
    fn default_internal() -> Self {
        Self {
            enabled: false,
            base_url: "https://localhost".to_string(),
            poll_interval_ms: 5000,
            mappings: vec![],
            username: None,
            password: None,
            token: None,
            accept_invalid_certs: true,
        }
    }
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
fn default_poll_interval() -> u32 { 
    5000 
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
// Rückgabetyp auf 3 Werte ändern: (User, Rolle, Token)
fn extract_user_info(req: &HttpRequest) -> (Option<String>, UserRole, Option<String>) {
    // Prüfe erst X-Auth-Token (von Caddy), dann den Standard Authorization Header
    let token = req.headers()
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

    let user = req.headers().get("X-WEBAUTH-USER").and_then(|v| v.to_str().ok()).map(|s| s.to_string());
    let webauth_role = req.headers().get("X-WEBAUTH-ROLE").and_then(|v| v.to_str().ok()).unwrap_or("");
    let via_proxy = req.headers().contains_key("x-forwarded-proto");

    let role = if !via_proxy {
        UserRole::Admin
    } else if webauth_role.is_empty() || webauth_role == "None" {
        UserRole::Admin
    } else {
        UserRole::from_header(webauth_role)
    };

    // WICHTIG: Hier sehen wir im Log, ob es jetzt klappt
    if let Some(ref t) = token {
        if !t.is_empty() {
             info!("✓ Token erfolgreich extrahiert (Länge: {} Bytes)", t.len());
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
        mapper_c8y: "unknown".to_string(),
        mapper_aws: "unknown".to_string(),
        mapper_az: "unknown".to_string(),
        c8y: "unknown".to_string(),
        aws: "unknown".to_string(),
        az: "unknown".to_string(),
    };

    if is_snap {
        // systemctl is blocked by AppArmor in strict snap → check via /proc/*/comm
        let check_process = |name: &str| -> &'static str {
            if let Ok(entries) = std::fs::read_dir("/proc") {
                for entry in entries.flatten() {
                    let comm_path = entry.path().join("comm");
                    if let Ok(comm) = std::fs::read_to_string(&comm_path) {
                        if comm.trim() == name {
                            return "running";
                        }
                    }
                }
            }
            "stopped"
        };
        // Like check_process but returns "inactive" (neutral) instead of "stopped" (error)
        // for optional services that may not be started yet
        let _check_optional = |name: &str| -> &'static str {
            if let Ok(entries) = std::fs::read_dir("/proc") {
                for entry in entries.flatten() {
                    let comm_path = entry.path().join("comm");
                    if let Ok(comm) = std::fs::read_to_string(&comm_path) {
                        if comm.trim() == name {
                            return "running";
                        }
                    }
                }
            }
            "inactive"
        };

        status.mosquitto = check_process("mosquitto").to_string();
        status.agent = check_process("tedge-agent").to_string();
        status.bridge = check_process("tedge-datalayer").to_string(); // /proc/comm truncates to 15 chars
        // watchdog-wrapper.sh is a bash script → /proc/comm shows "bash", not "tedge-watchdog"
        // Use snapctl services to reliably detect the running state instead
        status.watchdog = {
            let out = std::process::Command::new("snapctl")
                .args(["services", "thin-edge-io.tedge-watchdog"])
                .output();
            match out {
                Ok(o) if String::from_utf8_lossy(&o.stdout).contains("active") => "running",
                _ => "inactive",
            }
        }.to_string();

        // Mapper process checks via snapctl (column 2)
        // /proc/comm truncates to 15 chars: "tedge-mapper-c8y" → "tedge-mapper-c8" → check_process fails
        let check_snapctl = |svc: &str| -> &'static str {
            let full = format!("thin-edge-io.{}", svc);
            match std::process::Command::new("snapctl").args(["services", &full]).output() {
                Ok(o) if String::from_utf8_lossy(&o.stdout).contains("active") => "running",
                _ => "stopped",
            }
        };
        status.mapper_c8y = check_snapctl("tedge-mapper-c8y").to_string();
        status.mapper_aws = check_snapctl("tedge-mapper-aws").to_string();
        status.mapper_az  = check_snapctl("tedge-mapper-az").to_string();

        // Cloud connection checks via $SYS/broker/connection/<name>/state (column 3)
        // Uses mosquitto_sub; runs all 3 in parallel to avoid cumulative timeout
        let snap_dir = env::var("SNAP").unwrap_or_default();
        let snap_data_dir = env::var("SNAP_DATA").unwrap_or_else(|_| "/etc/tedge/..".to_string());
        let sub_bin = format!("{}/usr/bin/mosquitto_sub", snap_dir);

        let (c8y_conn, aws_conn, az_conn) = tokio::join!(
            check_bridge_state(sub_bin.clone(), snap_data_dir.clone(), "c8y"),
            check_bridge_state(sub_bin.clone(), snap_data_dir.clone(), "aws"),
            check_bridge_state(sub_bin,          snap_data_dir,         "az"),
        );
        status.c8y = c8y_conn.to_string();
        status.aws = aws_conn.to_string();
        status.az  = az_conn.to_string();

        // Auto-record cert upload when c8y bridge is running (cert was accepted by C8y = it's trusted)
        if c8y_conn == "running" {
            let mut config = data.config.lock().unwrap();
            if config.cert_upload.as_ref().map(|u| !u.uploaded).unwrap_or(true) {
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs()).unwrap_or(0);
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
        "c8y": status.c8y,
        "aws": status.aws,
        "az": status.az,
        "mapper_c8y": status.c8y,
        "mapper_aws": status.aws,
        "mapper_az": status.az
    })))
}

async fn get_config(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Insufficient permissions"
        })));
    }
    
    let config = data.config.lock().unwrap();
    Ok(HttpResponse::Ok().json(config.clone()))
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
                .args(&["--config-dir", &tedge_config_dir, "config", "set", "c8y.url", domain])
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
    let mut config = data.config.lock().unwrap();
    config.c8y = cloud;
    
    if let Err(e) = data.save_config(&config) {
        error!("Failed to save C8y config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }
    
    info!("Cumulocity configuration saved successfully");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Cumulocity configuration saved. Please restart services to apply changes."
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
                .args(&["--config-dir", &tedge_config_dir, "config", "set", "aws.url", domain])
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
    let mut config = data.config.lock().unwrap();
    config.aws = cloud;
    
    if let Err(e) = data.save_config(&config) {
        error!("Failed to save AWS config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }
    
    info!("AWS configuration saved successfully");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "AWS configuration saved. Please restart services to apply changes."
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
                .args(&["--config-dir", &tedge_config_dir, "config", "set", "az.url", domain])
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
    let mut config = data.config.lock().unwrap();
    config.az = cloud;
    
    if let Err(e) = data.save_config(&config) {
        error!("Failed to save Azure config to JSON: {}", e);
        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
            "success": false,
            "error": format!("Failed to save configuration: {}", e)
        })));
    }
    
    info!("Azure configuration saved successfully");
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Azure configuration saved. Please restart services to apply changes."
    })))
}

async fn save_device_config(
    req: HttpRequest,
    data: web::Data<AppState>,
    device_config: web::Json<DeviceConfig>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    
    info!("[CONFIG] Device config update by user: {:?}, role: {:?}", user, role);
    
    if !role.can_execute() {
        warn!("[CONFIG] Access denied - admin permissions required");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions - admin access required"
        })));
    }
    
    let new_config = device_config.into_inner();
    info!("[CONFIG] New device ID: {}, Type: {}", new_config.id, new_config.device_type);
    
    let mut config = data.config.lock().unwrap();
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

async fn restart_services(req: HttpRequest) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    
    info!("[RESTART] Service restart requested by user: {:?}, role: {:?}", user, role);
    
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

    info!("[RESTART] Restarting {} thin-edge.io services...", services.len());
    for service in &services {
        info!("[RESTART]   - Restarting {}", service);
        match std::process::Command::new("snapctl")
            .args(&["restart", &format!("thin-edge-io.{}", service)])
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
                error!("[RESTART]   ✗ Failed to execute restart for {}: {}", service, e);
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
struct TestMessageBody {
    #[serde(rename = "type")]
    msg_type: String, // "measurement" | "event" | "alarm"
}

#[derive(Debug, Deserialize)]
struct UploadCertBody {
    username: String,
    password: String,
}

async fn upload_cert_c8y(req: HttpRequest, body: web::Json<UploadCertBody>, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!("[CERT-UPLOAD] Upload cert to c8y requested by user: {:?}", user);

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
    info!("[CERT-UPLOAD] Running: tedge cert upload c8y --user {}", username);

    let result = web::block(move || {
        Command::new(&tedge_bin)
            .args(&[
                "--config-dir", &tedge_config_dir,
                "cert", "upload", "c8y",
                "--user", &username,
                "--password", &password,
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?
            .wait_with_output()
    }).await;

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
                    let mut config = data.config.lock().unwrap();
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
    info!("[CONNECT] Connect to {} requested by user: {:?}, role: {:?}", path.cloud, user, role);

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
            let wrapper = format!("{}/scripts/connect-wrapper.sh", env::var("SNAP").unwrap_or_default());
            Command::new(&wrapper)
                .args(&["connect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(&["--config-dir", &tedge_config_dir, "connect", &cloud])
                .output()
        }
    }).await;

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
    info!("[DISCONNECT] Disconnect {} requested by user: {:?}, role: {:?}", path.cloud, user, role);

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

    info!("[DISCONNECT] Running: connect-wrapper.sh disconnect {}", cloud);
    let result = web::block(move || {
        if is_snap {
            let wrapper = format!("{}/scripts/connect-wrapper.sh", env::var("SNAP").unwrap_or_default());
            Command::new(&wrapper)
                .args(&["disconnect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(&["--config-dir", &tedge_config_dir, "disconnect", &cloud])
                .output()
        }
    }).await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[DISCONNECT] Success: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({ "success": true, "output": output })))
            } else {
                warn!("[DISCONNECT] Failed: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({ "success": false, "output": output })))
            }
        }
        Ok(Err(e)) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
        Err(e)    => Ok(HttpResponse::InternalServerError().json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
    }
}

async fn reconnect_cloud(req: HttpRequest, path: web::Path<ConnectPath>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!("[RECONNECT] Reconnect {} requested by user: {:?}, role: {:?}", path.cloud, user, role);

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

    info!("[RECONNECT] Running: connect-wrapper.sh reconnect {}", cloud);
    let result = web::block(move || {
        if is_snap {
            let wrapper = format!("{}/scripts/connect-wrapper.sh", env::var("SNAP").unwrap_or_default());
            Command::new(&wrapper)
                .args(&["reconnect", &cloud])
                .env("SNAP", env::var("SNAP").unwrap_or_default())
                .env("SNAP_DATA", env::var("SNAP_DATA").unwrap_or_default())
                .env("SNAP_COMMON", env::var("SNAP_COMMON").unwrap_or_default())
                .env("TEDGE_CONFIG_DIR", &tedge_config_dir)
                .output()
        } else {
            Command::new(&tedge_bin)
                .args(&["--config-dir", &tedge_config_dir, "reconnect", &cloud])
                .output()
        }
    }).await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("{}{}", stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[RECONNECT] Success: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({ "success": true, "output": output })))
            } else {
                warn!("[RECONNECT] Failed: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({ "success": false, "output": output })))
            }
        }
        Ok(Err(e)) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
        Err(e)    => Ok(HttpResponse::InternalServerError().json(serde_json::json!({ "success": false, "error": format!("{}", e) }))),
    }
}

async fn publish_test_message(req: HttpRequest, body: web::Json<TestMessageBody>) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    info!("[TEST-MSG] Test message requested by user: {:?}, type: {}", user, body.msg_type);

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

    let now_secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let (topic, payload) = match body.msg_type.as_str() {
        "measurement" => (
            "te/device/main///m/test".to_string(),
            format!(r#"{{"temperature":{:.1},"time":"{}"}}"#,
                20.0 + (now_secs % 10) as f64,
                chrono_like_ts(now_secs),
            ),
        ),
        "event" => (
            "te/device/main///e/test_event".to_string(),
            format!(r#"{{"text":"Test event from thin-edge.io web config","time":"{}"}}"#,
                chrono_like_ts(now_secs),
            ),
        ),
        "alarm" => (
            "te/device/main///a/test_alarm".to_string(),
            format!(r#"{{"severity":"warning","text":"Test alarm from thin-edge.io web config","time":"{}"}}"#,
                chrono_like_ts(now_secs),
            ),
        ),
        other => {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                "success": false,
                "error": format!("Unknown message type: {}", other)
            })));
        }
    };

    info!("[TEST-MSG] Publishing to topic: {} payload: {}", topic, payload);
    let topic_display = topic.clone();
    let payload_display = payload.clone();
    let result = web::block(move || {
        Command::new(&tedge_bin)
            .args(&["--config-dir", &tedge_config_dir, "mqtt", "pub", &topic, &payload])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?
            .wait_with_output()
    }).await;

    match result {
        Ok(Ok(out)) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let output = format!("Topic: {}\nPayload: {}\n{}{}", topic_display, payload_display, stdout, stderr).trim().to_string();
            if out.status.success() {
                info!("[TEST-MSG] Published successfully");
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "output": output
                })))
            } else {
                warn!("[TEST-MSG] Publish failed: {}", output);
                Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": false,
                    "output": output
                })))
            }
        }
        Ok(Err(e)) => {
            error!("[TEST-MSG] Exec error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
        Err(e) => {
            error!("[TEST-MSG] Blocking error: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "success": false,
                "error": format!("{}", e)
            })))
        }
    }
}

/// Format Unix timestamp as ISO-8601 string (no chrono dependency)
fn chrono_like_ts(secs: u64) -> String {
    // Basic ISO-8601 UTC without chrono: delegate to a simple formatter
    // We compute year/month/day/hour/min/sec from unix timestamp
    let mut s = secs;
    let sec = s % 60; s /= 60;
    let min = s % 60; s /= 60;
    let hour = s % 24; s /= 24;
    // Days since epoch (1970-01-01)
    let mut days = s as u32;
    let mut year = 1970u32;
    loop {
        let dy = if (year % 4 == 0 && year % 100 != 0) || year % 400 == 0 { 366 } else { 365 };
        if days < dy { break; }
        days -= dy;
        year += 1;
    }
    let leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    let months = if leap {
        [31u32,29,31,30,31,30,31,31,30,31,30,31]
    } else {
        [31u32,28,31,30,31,30,31,31,30,31,30,31]
    };
    let mut month = 0u32;
    for (i, &dm) in months.iter().enumerate() {
        if days < dm { month = i as u32 + 1; break; }
        days -= dm;
    }
    let day = days + 1;
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, hour, min, sec)
}

async fn get_device_id(req: HttpRequest) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    
    info!("[DEVICE-ID] Get device ID requested by user: {:?}, role: {:?}", user, role);
    
    if !role.can_read() {
        warn!("[DEVICE-ID] Access denied - insufficient permissions");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "success": false,
            "error": "Insufficient permissions"
        })));
    }
    
    // In snap mode the script lives in $SNAP/scripts/; in local dev try the workspace scripts/ dir.
    let script_path = {
        let snap_path = env::var("SNAP").ok()
            .map(|s| PathBuf::from(s).join("scripts/manage-device-id.sh"));
        let local_path = std::env::current_exe().ok()
            .and_then(|p| p.ancestors().nth(4).map(|a| a.join("scripts/manage-device-id.sh")));
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
                .and_then(|o| if o.status.success() { String::from_utf8(o.stdout).ok() } else { None })
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // get-current exits 1 when no certificate → returns empty string
            let current = Command::new(&script_path)
                .arg("get-current")
                .output()
                .ok()
                .and_then(|o| if o.status.success() { String::from_utf8(o.stdout).ok() } else { None })
                .map(|s| s.trim().to_string())
                .unwrap_or_default();

            (serial, current)
        }).await.unwrap_or_else(|_| ("unknown".to_string(), String::new()))
    } else {
        warn!("[DEVICE-ID] manage-device-id.sh not found – returning empty device info");
        ("unknown".to_string(), String::new())
    };

    // Derive has_certificate from the script result: get-current returns non-empty CN only if cert exists.
    // This avoids a hardcoded snap path and works in both snap and local-dev mode.
    let has_certificate = !current.is_empty();
    info!("[DEVICE-ID] Serial: {}, Current: {}, Has cert: {}", system_serial, current, has_certificate);
    
    Ok(HttpResponse::Ok().json(DeviceIdInfo {
        current,
        system_serial,
        has_certificate,
    }))
}

async fn set_device_id(
    req: HttpRequest,
    body: web::Json<SetDeviceIdRequest>,
) -> Result<HttpResponse> {
    let (user, role, _token) = extract_user_info(&req);
    
    info!("[DEVICE-ID] Set device ID requested by user: {:?}, role: {:?}", user, role);
    
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
    
    let output = Command::new(&script_path)
        .arg("recreate")
        .output();
    
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
    
    let output = Command::new(&script_path)
        .arg("create")
        .output();
    
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
                .args(&["--config-dir", &tedge_config_dir, "cert", "show"])
                .output()
        }),
    ).await;

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

    let snap_service = format!("thin-edge-io.{}", service);
    let lines_str = lines.to_string();

    let result = web::block(move || {
        // journalctl via log-observe interface (requires new snap build with log-observe in webserver plugs)
        let unit = format!("snap.{}.service", snap_service);
        info!("[LOGS] journalctl -u {} -n {}", unit, lines_str);

        let jctl_result = Command::new("journalctl")
            .args(&["-u", &unit, "-n", &lines_str, "--no-pager", "--output=short-iso"])
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
            Ok(HttpResponse::Ok().json(LogResponse { lines: log_lines, service }))
        }
        Err(e) => {
            error!("[LOGS] Blocking error: {}", e);
            Ok(HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": format!("{}", e)})))
        }
    }
}

fn parse_system_toml_log_section(
    content: &str,
) -> std::collections::HashMap<String, String> {
    let mut levels = std::collections::HashMap::new();
    let mut in_log = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed == "[log]" {
            in_log = true;
            continue;
        }
        if trimmed.starts_with('[') {
            in_log = false;
            continue;
        }
        if in_log {
            if let Some((key, val)) = trimmed.split_once('=') {
                let key = key.trim().to_string();
                let val = val.trim().trim_matches('"').to_string();
                levels.insert(key, val);
            }
        }
    }
    levels
}

fn update_system_toml_level(content: &str, service: &str, level: &str) -> String {
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
    let mut in_log = false;
    let mut found_key = false;
    let mut log_section_end: Option<usize> = None;
    let mut has_log_section = false;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed == "[log]" {
            in_log = true;
            has_log_section = true;
            continue;
        }
        if trimmed.starts_with('[') && in_log && log_section_end.is_none() {
            log_section_end = Some(i);
            in_log = false;
            continue;
        }
        if in_log {
            if let Some((key, _)) = trimmed.split_once('=') {
                if key.trim() == service {
                    lines[i] = format!("{} = \"{}\"", service, level);
                    found_key = true;
                    break;
                }
            }
        }
    }

    if !found_key {
        let new_entry = format!("{} = \"{}\"", service, level);
        if has_log_section {
            let insert_pos = log_section_end.unwrap_or(lines.len());
            lines.insert(insert_pos, new_entry);
        } else {
            lines.push(String::new());
            lines.push("[log]".to_string());
            lines.push(new_entry);
        }
    }

    lines.join("\n")
}

async fn get_tedge_config_list(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden()
            .json(serde_json::json!({"error": "Insufficient permissions"})));
    }

    let is_snap = env::var("SNAP").is_ok();
    let snap_data = env::var("SNAP_DATA").unwrap_or_default();

    let result = web::block(move || {
        let tedge_bin = if is_snap {
            "/snap/thin-edge-io/current/bin/tedge"
        } else {
            "tedge"
        };

        let mut cmd = Command::new(tedge_bin);
        if is_snap && !snap_data.is_empty() {
            cmd.args(&["--config-dir", &snap_data]);
        }
        cmd.arg("config").arg("list");

        info!("[TEDGE-CONFIG] Running: tedge config list");
        match cmd.output() {
            Ok(out) => {
                if out.status.success() {
                    String::from_utf8_lossy(&out.stdout).to_string()
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    format!("[Fehler beim Ausführen von 'tedge config list']\n{}", stderr.trim())
                }
            }
            Err(e) => format!("[tedge nicht ausführbar: {}]", e),
        }
    }).await;

    match result {
        Ok(text) => Ok(HttpResponse::Ok().json(serde_json::json!({"output": text}))),
        Err(e) => Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": format!("{}", e)}))),
    }
}

async fn get_build_info(req: HttpRequest) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"})));
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
        for line in content.lines() {
            if let Some(val) = line.strip_prefix("Version: ") {
                if let Some(plus) = val.find('+') {
                    version = val[..plus].to_string();
                    build = val[plus + 1..].to_string();
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
    let path = format!("{}/tedge/system.toml", snap_data);
    let content = fs::read_to_string(&path).unwrap_or_default();
    let levels = parse_system_toml_log_section(&content);
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

    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| ".".to_string());
    let path = format!("{}/tedge/system.toml", snap_data);
    let content = fs::read_to_string(&path).unwrap_or_default();
    let new_content = update_system_toml_level(&content, &body.service, &body.level);

    if let Some(parent) = std::path::Path::new(&path).parent() {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&path, new_content)?;
    info!("[LOG-LEVEL] Set {} = {}", body.service, body.level);

    // Restart service to apply new log level (only in snap)
    // Skip restart for "webserver" — would kill ourselves mid-request
    let is_snap = env::var("SNAP").is_ok();
    let svc = body.service.clone();
    if is_snap && svc != "webserver" {
        let snap_svc = format!("thin-edge-io.{}", svc);
        // Fire-and-forget via web::block so we don't block the async runtime
        actix_web::rt::spawn(async move {
            let _ = web::block(move || {
                Command::new("snapctl").args(&["restart", &snap_svc]).output()
            }).await;
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
    let url = format!("{}/identity-manager/api/v2/auth/token", base_url.trim_end_matches('/'));
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
        Ok(r) => { warn!("[DL] Token fetch failed: HTTP {}", r.status()); None }
        Err(e) => { warn!("[DL] Token fetch error: {}", e); None }
    }
}

async fn dl_client_and_token(cfg: &DatalayerConfig) -> (reqwest::Client, Option<String>) {
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    // 1. Automatischer Auth-Versuch, wenn Zugangsdaten vorhanden sind
    if let (Some(username), Some(password)) = (&cfg.username, &cfg.password) {
        if let Some(t) = fetch_dl_token(&client, &cfg.base_url, username, password).await {
            return (client, Some(t));
        }
    }

    // 2. Fallback: Statischer Token aus der Konfiguration
    // Da cfg.token bereits ein Option<String> ist, geben wir es direkt zurück.
    // Wir klonen es nur, um die Besitzverhältnisse zu wahren.
    (client, cfg.token.clone())
}

/// GET /api/datalayer/config  — returns config (password + token masked)
async fn get_datalayer_config(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    
    let mut cfg = data.load_datalayer_config();
    
    // Anmeldedaten niemals im Klartext an den Client senden
    // Wir prüfen, ob der Wert vorhanden (is_some) ist und maskieren ihn dann
    if cfg.password.is_some() { 
        cfg.password = Some("***".to_string()); 
    }
    
    if cfg.token.is_some() { 
        cfg.token = Some("***".to_string()); 
    }
    
    Ok(HttpResponse::Ok().json(cfg))
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

    // FIX 3: Mit Some() verpacken, da Zieltyp Option<String> ist
    if !body.username.is_empty() && body.username != "***" {
        cfg.username = Some(body.username.clone());
    }
    if !body.password.is_empty() && body.password != "***" {
        cfg.password = Some(body.password.clone());
    }
    if !body.token.is_empty() && body.token != "***" {
        cfg.token = Some(body.token.clone());
    }

    if let Err(e) = data.save_datalayer_config(&cfg) {
        error!("[DL-CONFIG] Save failed: {}", e);
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }
    
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
}

/// GET /api/datalayer/mappings  — return all mappings
async fn get_datalayer_mappings(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let cfg = data.load_datalayer_config();
    Ok(HttpResponse::Ok().json(serde_json::json!({"mappings": cfg.mappings})))
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
        body.get("mappings").cloned().unwrap_or(serde_json::Value::Array(vec![])),
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

#[derive(Debug, Deserialize)]
struct AddMappingBody {
    pub datalayer_path: String,
    pub tedge_topic: String,
    #[serde(default)]
    pub transform: MappingTransform,
    pub field_name: Option<String>,
    pub unit: Option<String>,     // Wichtig: Option
}

/// POST /api/datalayer/mappings/add  — add one mapping, return its id
async fn add_datalayer_mapping(
    req: HttpRequest,
    body: web::Json<AddMappingBody>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }

    if body.datalayer_path.is_empty() || body.tedge_topic.is_empty() {
        return Ok(HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "datalayer_path and tedge_topic required"})));
    }

    // Mapping-Objekt erstellen - NUR Felder nutzen, die in 'struct DatalayerMapping' stehen
    let mapping = DatalayerMapping {
        id: Uuid::new_v4().to_string(),
        path: body.datalayer_path.clone(), // Mappt Browser 'datalayer_path' auf Struktur 'path'
        topic: body.tedge_topic.clone(),   // Mappt Browser 'tedge_topic' auf Struktur 'topic'
        transform: format!("{:?}", body.transform).to_lowercase(),
        field_name: body.field_name.clone(),
        unit: body.unit.clone(),
        enabled: true,
    };

    let id = mapping.id.clone();
    let mut cfg = data.load_datalayer_config();
    cfg.mappings.push(mapping);

    if let Err(e) = data.save_datalayer_config(&cfg) {
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }
    
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "id": id})))
}

/// DELETE /api/datalayer/mappings/{id}
async fn delete_datalayer_mapping(
    req: HttpRequest,
    path: web::Path<MappingIdPath>,
    data: web::Data<AppState>,
) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    let mut cfg = data.load_datalayer_config();
    let before = cfg.mappings.len();
    cfg.mappings.retain(|m| m.id != path.id);
    let removed = before - cfg.mappings.len();
    if let Err(e) = data.save_datalayer_config(&cfg) {
        return Ok(HttpResponse::InternalServerError()
            .json(serde_json::json!({"success": false, "error": format!("{}", e)})));
    }
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true, "removed": removed})))
}

#[derive(Debug, Deserialize)]
struct BrowseQuery {
    #[serde(default)]
    path: String,
}
#[derive(Debug, Deserialize)]
struct MappingIdPath {
    pub id: String,
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
    
    // 2. Pfad für ctrlX aufbereiten
    let path = query.path.trim_start_matches('/').trim_end_matches('/');
    let url = if path.is_empty() {
        format!("{}/automation/api/v2/nodes?type=browse", cfg.base_url.trim_end_matches('/'))
    } else {
        format!("{}/automation/api/v2/nodes/{}?type=browse", cfg.base_url.trim_end_matches('/'), path)
    };

    // 3. Client holen (dieser holt bei Bedarf ein neues Token via User/Passwort!)
    let (http_client, stored_token) = dl_client_and_token(&cfg).await;
    let mut req_builder = http_client.get(&url);

    // Priorität: Token vom Browser > Token vom Backend (User/Passwort)
    if let Some(t) = extracted_token.or(stored_token) {
        req_builder = req_builder.bearer_auth(t);
    }

    match req_builder.send().await {
        Ok(resp) => {
            let status = resp.status();
            let body: serde_json::Value = resp.json().await.unwrap_or(serde_json::json!({"error": "invalid response"}));
            Ok(HttpResponse::build(actix_web::http::StatusCode::from_u16(status.as_u16()).unwrap()).json(body))
        }
        Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({"error": e.to_string()})))
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

    let (http_client, token) = dl_client_and_token(&cfg).await;

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
            Ok(HttpResponse::build(actix_web::http::StatusCode::from_u16(status.as_u16()).unwrap())
                .json(body))
        }
        Err(e) => {
            warn!("[DL-NODE] Request failed: {}", e);
            Ok(HttpResponse::ServiceUnavailable()
                .json(serde_json::json!({"error": format!("{}", e)})))
        }
    }
}

/// GET /api/datalayer/status  — connection status
async fn get_datalayer_status(req: HttpRequest, data: web::Data<AppState>) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_read() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    
    let cfg = data.load_datalayer_config();
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
    let bearer_token = req.headers().get("X-Auth-Token")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.replace("Bearer ", ""))
        .or_else(|| {
            req.headers().get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.strip_prefix("Bearer "))
                .map(|s| s.to_string())
        });

    let (http_client, stored_token) = dl_client_and_token(&cfg).await;
    
    // ctrlX API Pfad (Prüfe ob /automation/... oder /admin/...)
    let url = format!("{}/admin/api/v2/nodes?type=browse", cfg.base_url.trim_end_matches('/'));
    
    let mut req_builder = http_client.get(&url);
    
    if let Some(t) = bearer_token.clone().or(stored_token) {
        debug!("Datalayer-Request mit Token (Länge: {})", t.len());
        req_builder = req_builder.bearer_auth(t);
    }

    let (connected, http_status, connect_error) = match req_builder.send().await {
        Ok(r) => {
            let s = r.status().as_u16();
            if s == 401 { warn!("Datalayer Zugriff verweigert (401) - Token ungültig?"); }
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



#[actix_web::main]
async fn main() -> io::Result<()> {
    // Logging initialisieren
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    let is_snap = env::var("SNAP").is_ok();
    let snap_data = env::var("SNAP_DATA").unwrap_or_else(|_| String::from("."));

    let config_path = if is_snap {
        PathBuf::from(&snap_data).join("tedge-web-config.json")
    } else {
        PathBuf::from("./tedge-web-config.json")
    };

    let datalayer_config_path = if is_snap {
        PathBuf::from(&snap_data).join("datalayer-mappings.json")
    } else {
        PathBuf::from("./datalayer-mappings.json")
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

    let app_state = web::Data::new(AppState::new(config_path, datalayer_config_path));

let server = HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(middleware::Logger::new("%a %r %s %b %T ms"))
            .wrap(middleware::Compress::default())
            // Root-Redirect: / → /thin-edge-io/
            .route("/", web::get().to(|| async {
                HttpResponse::Found()
                    .insert_header(("Location", "/thin-edge-io/"))
                    .finish()
            }))
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
                            .route("/connect/{cloud}", web::post().to(connect_cloud))
                            .route("/disconnect/{cloud}", web::post().to(disconnect_cloud))
                            .route("/reconnect/{cloud}", web::post().to(reconnect_cloud))
                            .route("/test-message", web::post().to(publish_test_message))
                            .route("/cert/upload/c8y", web::post().to(upload_cert_c8y))
                            .route("/device-id", web::get().to(get_device_id))
                            .route("/device-id", web::post().to(set_device_id))
                            .route("/device-id/recreate", web::post().to(recreate_certificate))
                            .route("/device-id/create-auto", web::post().to(create_certificate_auto))
                            .route("/device-id/cert-info", web::get().to(show_certificate))
                            .route("/logs", web::get().to(get_logs))
                            .route("/tedge-config-list", web::get().to(get_tedge_config_list))
                            .route("/me", web::get().to(get_me))
                            .route("/build-info", web::get().to(get_build_info))
                            .route("/log-level", web::get().to(get_log_level))
                            .route("/log-level", web::post().to(set_log_level))
                            // Datalayer API
                            .route("/datalayer/status", web::get().to(get_datalayer_status))
                            .route("/datalayer/config", web::get().to(get_datalayer_config))
                            .route("/datalayer/config", web::post().to(save_datalayer_config_handler))
                            .route("/datalayer/mappings", web::get().to(get_datalayer_mappings))
                            .route("/datalayer/mappings", web::post().to(save_datalayer_mappings))
                            .route("/datalayer/mappings/add", web::post().to(add_datalayer_mapping))
                            .route("/datalayer/mappings/{id}", web::delete().to(delete_datalayer_mapping))
                            .route("/datalayer/browse", web::get().to(browse_datalayer))
                            .route("/datalayer/node", web::get().to(read_datalayer_node))
                    )
                    // Login liegt unter /thin-edge-io/login
                    .route("/login", web::get().to(token_login))
                    
                    // Static Files GANZ AM ENDE DES SCOPES! (Wichtig für Actix Routing)
                    .service(Files::new("/", web_root.clone()).index_file("index.html"))
            )
    });

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
        let bind = "0.0.0.0:8888";
        info!("Starte Server auf http://{}", bind);
        server.bind(bind)?.run().await
    }
}
