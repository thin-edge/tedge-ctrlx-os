use log::{info, warn};
#[cfg(feature = "mqtt")]
use paho_mqtt as mqtt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
#[cfg(feature = "mqtt")]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(feature = "mqtt")]
use std::sync::Arc;
use std::time::Instant;
#[cfg(feature = "mqtt")]
#[allow(unused_imports)]
use uuid::Uuid;

// --- Config Structs ---

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum MappingTransform {
    Raw,
    #[default]
    Measurement,
    Event,
    Alarm,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum MappingDirection {
    #[serde(rename = "dl_to_tedge")]
    DatalayerToTedge,
    #[serde(rename = "tedge_to_dl")]
    TedgeToDatalayer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatalayerMapping {
    #[serde(default = "generate_uuid")]
    pub id: String,
    #[serde(rename = "path", alias = "datalayer_path")]
    pub path: String,
    #[serde(rename = "topic", alias = "tedge_topic")]
    pub topic: String,
    #[serde(default = "default_direction")]
    pub direction: MappingDirection,
    pub transform: MappingTransform,
    pub field_name: Option<String>,
    pub unit: Option<String>,
    #[serde(default = "default_true")]
    pub enabled: bool,
    /// Which pipeline handles this mapping: "datalayer" (bridge) or "flow" (tedge-flows).
    /// Used by the UI to label mappings; the bridge skips mappings with mapping_type == "flow".
    #[serde(default = "default_mapping_type")]
    pub mapping_type: String,
}

// Helper function for Serde
fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn default_direction() -> MappingDirection {
    MappingDirection::DatalayerToTedge
}
fn default_mapping_type() -> String {
    "datalayer".to_string()
}
fn default_true() -> bool {
    true
}
fn default_poll_interval() -> u32 {
    5000
}

/// Formats Unix seconds + milliseconds as an ISO-8601 UTC string
/// e.g. "2026-04-21T09:30:00.123Z"
#[allow(dead_code)]
fn format_iso8601(secs: u64, millis: u32) -> String {
    // Calendar calculation without external crate
    let mut days = secs / 86400;
    let time_of_day = secs % 86400;
    let h = time_of_day / 3600;
    let m = (time_of_day % 3600) / 60;
    let s = time_of_day % 60;

    // Gregorian calendar starting from 1970-01-01
    let mut year = 1970u32;
    loop {
        let leap =
            (year.is_multiple_of(4) && !year.is_multiple_of(100)) || year.is_multiple_of(400);
        let days_in_year = if leap { 366 } else { 365 };
        if days < days_in_year {
            break;
        }
        days -= days_in_year;
        year += 1;
    }
    let leap = (year.is_multiple_of(4) && !year.is_multiple_of(100)) || year.is_multiple_of(400);
    let month_days: [u64; 12] = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut month = 1u32;
    for &md in &month_days {
        if days < md {
            break;
        }
        days -= md;
        month += 1;
    }
    let day = days + 1;
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        year, month, day, h, m, s, millis
    )
}

impl DatalayerMapping {
    pub fn effective_field_name(&self) -> String {
        if let Some(name) = &self.field_name {
            if !name.is_empty() {
                return name.clone();
            }
        }
        self.path
            .trim_end_matches('/')
            .rsplit('/')
            .next()
            .unwrap_or("value")
            .to_string()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatalayerConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(rename = "baseUrl", default)]
    pub base_url: String,
    #[serde(rename = "pollIntervalMs", default = "default_poll_interval")]
    pub poll_interval_ms: u32,
    #[serde(default)]
    pub mappings: Vec<DatalayerMapping>,
    #[serde(rename = "acceptInvalidCerts", default)]
    pub accept_invalid_certs: bool,
    /// Read from tedge config: c8y.mqtt_service.enabled
    #[serde(rename = "mqttServiceEnabled", default)]
    pub mqtt_service_enabled: bool,
    /// Hardware UUID of the device (ctrlx-<uuid>) — populated at startup
    #[serde(rename = "deviceExternalId", default)]
    pub device_external_id: String,
}

/// Credentials stored separately in datalayer-credentials.json (mode 0600)
/// Never mixed into datalayer-mappings.json
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DatalayerCredentials {
    pub username: Option<String>,
    pub password: Option<String>,
    pub token: Option<String>,
}

impl Default for DatalayerConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            base_url: "https://localhost".to_string(),
            poll_interval_ms: 5000,
            mappings: Vec::new(),
            accept_invalid_certs: false,
            mqtt_service_enabled: false,
            device_external_id: String::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct DatalayerNodeValue {
    #[serde(rename = "type")]
    pub node_type: Option<String>,
    pub value: Option<Value>,
}

// --- Datalayer Engine ---

pub struct DatalayerEngine {
    config_path: PathBuf,
    credentials_path: PathBuf,
    config: DatalayerConfig,
    credentials: DatalayerCredentials,
    http_client: Client,
    last_values: HashMap<String, Value>,
    pub cached_token: Option<String>,
    token_fail_until: Option<Instant>,
}

impl DatalayerEngine {
    pub fn new(config_path: PathBuf) -> Self {
        let credentials_path = config_path
            .parent()
            .unwrap_or_else(|| std::path::Path::new("."))
            .join("datalayer-credentials.json");
        let config = Self::load_config(&config_path);
        let credentials = Self::load_credentials(&credentials_path);
        if config.accept_invalid_certs {
            log::warn!("[DATALAYER] TLS certificate verification is DISABLED — only use in trusted network environments");
        }
        let http_client = reqwest::Client::builder()
            .danger_accept_invalid_certs(config.accept_invalid_certs)
            .build()
            .unwrap_or_default();
        Self {
            config_path,
            credentials_path,
            config,
            credentials,
            http_client,
            last_values: HashMap::new(),
            cached_token: None,
            token_fail_until: None,
        }
    }

    /// Like `new`, but overrides device_external_id and mqtt_service_enabled
    pub fn new_with_overrides(
        config_path: PathBuf,
        device_external_id: String,
        mqtt_service_enabled: bool,
    ) -> Self {
        let mut engine = Self::new(config_path);
        engine.config.device_external_id = device_external_id;
        engine.config.mqtt_service_enabled = mqtt_service_enabled;
        engine
    }

    pub fn load_credentials(path: &PathBuf) -> DatalayerCredentials {
        match fs::read_to_string(path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => DatalayerCredentials::default(),
        }
    }

    pub fn load_config(path: &PathBuf) -> DatalayerConfig {
        match fs::read_to_string(path) {
            Ok(content) => match serde_json::from_str(&content) {
                Ok(cfg) => cfg,
                Err(e) => {
                    log::error!("[DATALAYER] JSON parse error in config: {}", e);
                    DatalayerConfig::default()
                }
            },
            Err(e) => {
                log::warn!("[DATALAYER] Could not read config: {}", e);
                DatalayerConfig::default()
            }
        }
    }

    pub fn reload_config(&mut self) {
        // Preserve runtime values that are not read from file
        let device_external_id = self.config.device_external_id.clone();
        let mqtt_service_enabled = self.config.mqtt_service_enabled;
        self.config = Self::load_config(&self.config_path);
        // Restore runtime values
        self.config.device_external_id = device_external_id;
        self.config.mqtt_service_enabled = mqtt_service_enabled;
        self.credentials = Self::load_credentials(&self.credentials_path);
    }
    pub fn is_enabled(&self) -> bool {
        self.config.enabled && !self.config.base_url.is_empty()
    }

    pub async fn fetch_token(&mut self) -> bool {
        // Backoff: don't retry for 60s after a failure to avoid log spam
        if let Some(until) = self.token_fail_until {
            if Instant::now() < until {
                return false;
            }
        }

        // Try to logout any existing session first to free up the session slot.
        // Only attempt logout if we actually have a cached token — otherwise
        // we'd just be firing a DELETE with no bearer token which does nothing.
        if self.cached_token.is_some() {
            self.logout_token().await;
        }

        let user = match &self.credentials.username {
            Some(u) if !u.is_empty() => u.clone(),
            _ => return false,
        };
        let pass = self.credentials.password.clone().unwrap_or_default();
        let url = format!(
            "{}/identity-manager/api/v2/auth/token",
            self.config.base_url.trim_end_matches('/')
        );
        let params = [
            ("grant_type", "password"),
            ("username", user.as_str()),
            ("password", pass.as_str()),
        ];

        match self.http_client.post(&url).form(&params).send().await {
            Ok(r) => {
                let status = r.status();
                if status.is_success() {
                    match r.json::<Value>().await {
                        Ok(j) => {
                            if let Some(t) = j["access_token"].as_str() {
                                self.cached_token = Some(t.to_string());
                                self.token_fail_until = None;
                                info!("[DATALAYER] Token refreshed successfully");
                                return true;
                            }
                            warn!("[DATALAYER] Token fetch: success but no 'access_token' in response: {}", j);
                        }
                        Err(e) => {
                            warn!("[DATALAYER] Token fetch: could not parse response JSON: {e}")
                        }
                    }
                } else {
                    let body = r.text().await.unwrap_or_default();
                    warn!("[DATALAYER] Token fetch failed: HTTP {status} — {body}");
                    // For "Too many sessions" (HTTP 400) use a longer backoff to
                    // give the ctrlX time to expire old sessions on its own.
                    let backoff_secs = if status.as_u16() == 400 { 300 } else { 60 };
                    self.token_fail_until =
                        Some(Instant::now() + std::time::Duration::from_secs(backoff_secs));
                    return false;
                }
                // Back off for 60s before retrying
                self.token_fail_until = Some(Instant::now() + std::time::Duration::from_secs(60));
                false
            }
            Err(e) => {
                warn!("[DATALAYER] Token fetch failed: connection error — {e}");
                self.token_fail_until = Some(Instant::now() + std::time::Duration::from_secs(60));
                false
            }
        }
    }

    fn effective_token(&self) -> String {
        self.cached_token
            .clone()
            .or_else(|| self.credentials.token.clone())
            .unwrap_or_default()
    }

    /// Logs out the current session to free up the session slot
    pub async fn logout_token(&mut self) {
        let token = match &self.cached_token {
            Some(t) if !t.is_empty() => t.clone(),
            _ => return,
        };
        let url = format!(
            "{}/identity-manager/api/v2/auth/token",
            self.config.base_url.trim_end_matches('/')
        );
        let _ = self
            .http_client
            .delete(&url)
            .bearer_auth(&token)
            .send()
            .await;
        self.cached_token = None;
        info!("[DATALAYER] Session logged out");
    }

    pub async fn poll_mappings(&mut self) -> Vec<(String, String, String, Option<String>)> {
        // Returns (mapping_id, topic, raw_value, node_type)
        let mut to_publish = Vec::new();

        // Automatic token refresh if needed
        if self.cached_token.is_none() && self.credentials.username.is_some() {
            self.fetch_token().await;
        }

        let mappings = self.config.mappings.clone();
        for mapping in mappings
            .iter()
            .filter(|m| m.enabled && m.direction == MappingDirection::DatalayerToTedge)
        {
            let url = format!(
                "{}/automation/api/v2/nodes/{}?type=all",
                self.config.base_url.trim_end_matches('/'),
                mapping.path.replace('+', "%2B")
            );

            let token = self.effective_token();
            let mut req = self.http_client.get(&url);
            if !token.is_empty() {
                req = req.bearer_auth(&token);
            }

            match req.send().await {
                Err(e) => {
                    warn!(
                        "[DATALAYER] HTTP request failed for '{}': {}",
                        mapping.path, e
                    );
                    continue;
                }
                Ok(resp) => {
                    if resp.status() == 401 {
                        // Token expired — clear cache but respect existing backoff.
                        // Only reset the backoff if there is none yet (first 401).
                        self.cached_token = None;
                        if self.token_fail_until.is_none() {
                            self.token_fail_until = None; // allow immediate retry once
                        }
                        // Fetch a new token and retry immediately (only if no backoff active)
                        if self.credentials.username.is_some() {
                            self.fetch_token().await;
                            let new_token = self.effective_token();
                            let mut retry_req = self.http_client.get(&url);
                            if !new_token.is_empty() {
                                retry_req = retry_req.bearer_auth(&new_token);
                            }
                            if let Ok(retry_resp) = retry_req.send().await {
                                if let Ok(node) = retry_resp.json::<DatalayerNodeValue>().await {
                                    let val = node.value.unwrap_or(Value::Null);
                                    let should_publish = match mapping.transform {
                                        MappingTransform::Measurement | MappingTransform::Raw => {
                                            true
                                        }
                                        _ => self.last_values.get(&mapping.id) != Some(&val),
                                    };
                                    if should_publish {
                                        self.last_values.insert(mapping.id.clone(), val.clone());
                                        to_publish.push((
                                            mapping.id.clone(),
                                            mapping.topic.clone(),
                                            val.to_string(),
                                            node.node_type.clone(),
                                        ));
                                    }
                                }
                            }
                        } else {
                            warn!(
                                "[DATALAYER] 401 for '{}' but no credentials configured",
                                mapping.path
                            );
                        }
                        continue;
                    }
                    let status = resp.status();
                    if !status.is_success() {
                        warn!(
                            "[DATALAYER] HTTP {} for path '{}' url='{}'",
                            status, mapping.path, url
                        );
                        continue;
                    }
                    match resp.json::<DatalayerNodeValue>().await {
                        Err(e) => {
                            warn!("[DATALAYER] JSON parse error for '{}': {}", mapping.path, e);
                        }
                        Ok(node) => {
                            let node_type = node.node_type.clone();
                            let val = node.value.unwrap_or(Value::Null);
                            let should_publish = match mapping.transform {
                                MappingTransform::Measurement | MappingTransform::Raw => true,
                                _ => self.last_values.get(&mapping.id) != Some(&val),
                            };
                            if should_publish {
                                info!(
                                    "[DATALAYER] Publishing '{}' → topic '{}' val={}",
                                    mapping.path, mapping.topic, val
                                );
                                self.last_values.insert(mapping.id.clone(), val.clone());
                                to_publish.push((
                                    mapping.id.clone(),
                                    mapping.topic.clone(),
                                    val.to_string(),
                                    node_type,
                                ));
                            }
                        }
                    }
                }
            }
        }
        to_publish
    }

    /// Returns true when token auth is configured but currently in a failure backoff
    pub fn is_token_failing(&self) -> bool {
        if self
            .credentials
            .username
            .as_deref()
            .map(|u| !u.is_empty())
            .unwrap_or(false)
        {
            if let Some(until) = self.token_fail_until {
                return Instant::now() < until;
            }
        }
        false
    }
}

// --- Loops & Handler ---
#[cfg(feature = "mqtt")]
pub async fn run_datalayer_loop(
    mut engine: DatalayerEngine,
    mqtt_client: Arc<tokio::sync::Mutex<Option<mqtt::AsyncClient>>>,
    shutdown: Arc<AtomicBool>,
) {
    info!("[DATALAYER] Loop started");
    const HEALTH_TOPIC: &str = "te/device/main/service/tedge-datalayer-bridge/status/health";
    let pid = std::process::id();
    let mut health_tick: u32 = 0;
    while !shutdown.load(Ordering::Relaxed) {
        engine.reload_config();

        // Publish health every ~30s (every 6 poll cycles at 5000ms default)
        health_tick += 1;
        if health_tick == 1 || health_tick.is_multiple_of(6) {
            let time = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs_f64();
            let health_status = if engine.is_token_failing() {
                "down"
            } else {
                "up"
            };
            let health_msg = format!(r#"{{"pid":{pid},"status":"{health_status}","time":{time}}}"#);
            let guard = mqtt_client.lock().await;
            if let Some(cli) = guard.as_ref() {
                let _ = cli
                    .publish(mqtt::Message::new_retained(
                        HEALTH_TOPIC,
                        health_msg.as_str(),
                        1,
                    ))
                    .await;
            }
            drop(guard);
        }

        if engine.is_enabled() {
            let messages = engine.poll_mappings().await;
            let guard = mqtt_client.lock().await;
            if let Some(cli) = guard.as_ref() {
                for (mapping_id, _topic, payload, node_type) in messages {
                    // 1. Look up the mapping by ID (not by topic, as multiple mappings can share the same topic)
                    if let Some(mapping) =
                        engine.config.mappings.iter().find(|m| m.id == mapping_id)
                    {
                        // Determine the display name (fallback to ID if field_name is empty)
                        let field_name = mapping.effective_field_name();

                        // 2. Apply the transform
                        let (final_topic, final_payload) = match mapping.transform {
                            MappingTransform::Measurement => {
                                // Parse payload from Data Layer (removes surrounding quotes)
                                let mut parsed_value: serde_json::Value =
                                    serde_json::from_str(&payload)
                                        .unwrap_or_else(|_| serde_json::json!(payload));

                                // If the Data Layer sends an object (e.g. {"rSimuTemp": 26.0}),
                                // extract only the numeric value
                                if let Some(obj) = parsed_value.as_object() {
                                    if let Some(val) = obj.values().next() {
                                        parsed_value = val.clone();
                                    }
                                }

                                // Build JSON: {"memfree-mb": 7432.3, "unit": "MB", "time": "...", "externalId": "..."}
                                // Include unit as a top-level field if present, omit otherwise
                                let mut json_obj = serde_json::json!({ &field_name: parsed_value });
                                if let Some(unit) = &mapping.unit {
                                    if !unit.is_empty() {
                                        json_obj["unit"] = serde_json::json!(unit);
                                    }
                                }
                                // UTC timestamp in ISO-8601 format
                                let now = std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_millis();
                                let secs = now / 1000;
                                let millis = now % 1000;
                                let ts = format_iso8601(secs as u64, millis as u32);
                                json_obj["time"] = serde_json::json!(ts);
                                // Include externalId when using MQTT Service (port 9883)
                                if mapping.topic.starts_with("c8y/mqtt/out/")
                                    && !engine.config.device_external_id.is_empty()
                                {
                                    json_obj["externalId"] =
                                        serde_json::json!(engine.config.device_external_id.clone());
                                }
                                let json_data = json_obj.to_string();

                                // Use the topic configured in the UI
                                (mapping.topic.clone(), json_data)
                            }
                            MappingTransform::Event => {
                                let parsed_value: serde_json::Value =
                                    serde_json::from_str(&payload)
                                        .unwrap_or_else(|_| serde_json::json!(payload));

                                if mapping.topic.starts_with("c8y/mqtt/out/") {
                                    // MQTT Service (9883): full C8y event format
                                    let time = parsed_value
                                        .get("timestamp")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or_default()
                                        .to_string();
                                    let event_type = format!(
                                        "c8y_{}",
                                        node_type.as_deref().unwrap_or("ctrlx_Event")
                                    );

                                    let mut json_obj = serde_json::json!({
                                        "Text": parsed_value,
                                        "type": event_type,
                                        "time": time
                                    });
                                    if !engine.config.device_external_id.is_empty() {
                                        json_obj["externalId"] = serde_json::json!(engine
                                            .config
                                            .device_external_id
                                            .clone());
                                    }
                                    (mapping.topic.clone(), json_obj.to_string())
                                } else {
                                    // Core MQTT (8883): publish to dl/ for flow processing
                                    let mut json_obj =
                                        serde_json::json!({ &field_name: parsed_value });
                                    let now = std::time::SystemTime::now()
                                        .duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_millis();
                                    json_obj["time"] = serde_json::json!(format_iso8601(
                                        (now / 1000) as u64,
                                        (now % 1000) as u32
                                    ));
                                    let ev_topic = format!("dl/device/main///e/{}", field_name);
                                    (ev_topic, json_obj.to_string())
                                }
                            }
                            MappingTransform::Alarm => {
                                let parsed_value: serde_json::Value =
                                    serde_json::from_str(&payload)
                                        .unwrap_or_else(|_| serde_json::json!(payload));

                                if mapping.topic.starts_with("c8y/mqtt/out/") {
                                    // MQTT Service (9883): full C8y alarm format
                                    let severity = parsed_value
                                        .get("severity")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("MAJOR")
                                        .to_string();
                                    let time = parsed_value
                                        .get("timestamp")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or_default()
                                        .to_string();
                                    let alarm_type = format!(
                                        "c8y_{}",
                                        node_type.as_deref().unwrap_or("ctrlx_Alarm")
                                    );

                                    let mut json_obj = serde_json::json!({
                                        "Text": parsed_value,
                                        "severity": severity,
                                        "status": "ACTIVE",
                                        "type": alarm_type,
                                        "time": time
                                    });
                                    if !engine.config.device_external_id.is_empty() {
                                        json_obj["externalId"] = serde_json::json!(engine
                                            .config
                                            .device_external_id
                                            .clone());
                                    }
                                    (mapping.topic.clone(), json_obj.to_string())
                                } else {
                                    // Core MQTT (8883): publish to dl/ for flow processing
                                    let mut json_obj =
                                        serde_json::json!({ &field_name: parsed_value });
                                    if let Some(sev) =
                                        parsed_value.get("severity").and_then(|v| v.as_str())
                                    {
                                        json_obj["severity"] = serde_json::json!(sev);
                                    }
                                    let now = std::time::SystemTime::now()
                                        .duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_millis();
                                    json_obj["time"] = serde_json::json!(format_iso8601(
                                        (now / 1000) as u64,
                                        (now % 1000) as u32
                                    ));
                                    let al_topic = format!("dl/device/main///a/{}", field_name);
                                    (al_topic, json_obj.to_string())
                                }
                            }
                            _ => {
                                // For "flow" mapping_type: publish to dl/device/main///m/<field>
                                // The "dl/" prefix is a dedicated datalayer-to-flow namespace:
                                // - Flows subscribe to "dl/+/+/+/+/m/+" (not "te/+/+/+/+/m/+")
                                // - Flows transform and re-publish to "te/device/main///m/<field>"
                                // - The c8y mapper built-in then adds source.id and forwards to C8y
                                // This avoids device-ID lookups in flow scripts and infinite loops.
                                let mut parsed_value: serde_json::Value =
                                    serde_json::from_str(&payload)
                                        .unwrap_or_else(|_| serde_json::json!(payload));
                                if let Some(obj) = parsed_value.as_object() {
                                    if let Some(val) = obj.values().next() {
                                        parsed_value = val.clone();
                                    }
                                }
                                let mut json_obj = serde_json::json!({ &field_name: parsed_value });
                                if let Some(unit) = &mapping.unit {
                                    if !unit.is_empty() {
                                        json_obj["unit"] = serde_json::json!(unit);
                                    }
                                }
                                let now = std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_millis();
                                json_obj["time"] = serde_json::json!(format_iso8601(
                                    (now / 1000) as u64,
                                    (now % 1000) as u32
                                ));
                                let dl_topic = format!("dl/device/main///m/{}", field_name);
                                (dl_topic, json_obj.to_string())
                            }
                        };

                        // 3. Publish the message
                        let _ = cli
                            .publish(mqtt::Message::new(final_topic, final_payload, 0))
                            .await;
                    }
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(
            engine.config.poll_interval_ms as u64,
        ))
        .await;
    }
}

#[cfg(feature = "mqtt")]
pub async fn handle_mqtt_message(
    msg: &mqtt::Message,
    config: &DatalayerConfig,
    credentials: &DatalayerCredentials,
    http_client: &Client,
) {
    let topic = msg.topic();
    if let Some(m) = config.mappings.iter().find(|m| {
        m.topic == topic && m.direction == MappingDirection::TedgeToDatalayer && m.enabled
    }) {
        let url = format!(
            "{}/automation/api/v2/nodes/{}",
            config.base_url.trim_end_matches('/'),
            m.path.trim_start_matches('/')
        );
        let mut req = http_client.put(&url).body(msg.payload_str().to_string());
        let token = credentials.token.clone().unwrap_or_default();
        if !token.is_empty() {
            req = req.bearer_auth(token);
        }
        let _ = req.send().await;
    }
}
