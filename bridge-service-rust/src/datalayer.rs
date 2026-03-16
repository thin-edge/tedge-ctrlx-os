// ctrlX Datalayer REST client and mapping engine
//
// Reads configured node mappings, polls ctrlX Datalayer via REST API,
// and publishes results to thin-edge.io MQTT topics.

use anyhow::{Context, Result};
use log::{debug, error, info, warn};
use paho_mqtt as mqtt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

// ── Mapping config structs ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MappingTransform {
    /// Publish raw JSON value as-is on the tedge topic
    Raw,
    /// Publish as thin-edge measurement: { "<name>": <value> }
    Measurement,
    /// Publish as thin-edge event
    Event,
    /// Publish as thin-edge alarm
    Alarm,
}

impl Default for MappingTransform {
    fn default() -> Self {
        MappingTransform::Measurement
    }
}

fn default_true() -> bool {
    true
}

fn default_poll_interval() -> u64 {
    5000
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatalayerMapping {
    pub id: String,
    /// ctrlX Datalayer node path, e.g. "plc/app/Application/activity/variables/Temp"
    pub datalayer_path: String,
    /// thin-edge.io MQTT topic, e.g. "te/device/main///m/plc"
    pub tedge_topic: String,
    /// How to transform the Datalayer value before publishing
    #[serde(default)]
    pub transform: MappingTransform,
    /// Measurement / event / alarm field name (used for Measurement and Event transforms)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub field_name: Option<String>,
    /// Physical unit hint (e.g. "°C"), stored in metadata only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

impl DatalayerMapping {

    /// Returns the MQTT field name: explicit field_name or last path segment
    pub fn effective_field_name(&self) -> String {
        if let Some(name) = &self.field_name {
            if !name.is_empty() {
                return name.clone();
            }
        }
        self.datalayer_path
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
    /// Base URL of the ctrlX device REST API, e.g. "https://localhost" or "https://192.168.1.1"
    #[serde(default)]
    pub base_url: String,
    /// Polling interval in milliseconds
    #[serde(default = "default_poll_interval")]
    pub poll_interval_ms: u64,
    /// ctrlX username for automatic token generation (recommended)
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub username: String,
    /// ctrlX password for automatic token generation
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub password: String,
    /// Static bearer token (optional fallback; auto-token takes priority if username set)
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub token: String,
    /// Accept self-signed TLS certificates (for development / internal access)
    #[serde(default = "default_true")]
    pub accept_invalid_certs: bool,
    #[serde(default)]
    pub mappings: Vec<DatalayerMapping>,
}

impl Default for DatalayerConfig {
    fn default() -> Self {
        DatalayerConfig {
            enabled: false,
            base_url: "https://localhost".to_string(),
            poll_interval_ms: 5000,
            username: String::new(),
            password: String::new(),
            token: String::new(),
            accept_invalid_certs: true,
            mappings: Vec::new(),
        }
    }
}

// ── Datalayer REST value response ─────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct DatalayerNodeValue {
    /// e.g. "double", "float", "int8", "bool", "string", "object"
    #[serde(rename = "type")]
    #[allow(dead_code)]
    pub value_type: Option<String>,
    pub value: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct DatalayerNodeInfo {
    pub path: String,
    #[serde(rename = "type")]
    pub value_type: Option<String>,
    pub value: Option<Value>,
    pub error: Option<String>,
}

// ── Datalayer engine ────────────────────────────────────────────────────────

pub struct DatalayerEngine {
    config_path: PathBuf,
    config: DatalayerConfig,
    http_client: Client,
    /// Last known values per mapping id (for change detection)
    last_values: HashMap<String, Value>,
    /// Cached auto-fetched token (from identity manager)
    cached_token: Option<String>,
}

impl DatalayerEngine {
    pub fn new(config_path: PathBuf) -> Self {
        let config = Self::load_config(&config_path);
        let http_client = Self::build_http_client(config.accept_invalid_certs);
        DatalayerEngine {
            config_path,
            config,
            http_client,
            last_values: HashMap::new(),
            cached_token: None,
        }
    }

    /// Fetch a Bearer token from the ctrlX identity manager using username + password.
    /// Stores the result in `self.cached_token`.
    async fn fetch_token(&mut self) -> bool {
        if self.config.username.is_empty() || self.config.password.is_empty() {
            return false;
        }
        let url = format!(
            "{}/identity-manager/api/v2/auth/token",
            self.config.base_url.trim_end_matches('/')
        );
        let params = [
            ("grant_type", "password"),
            ("username", self.config.username.as_str()),
            ("password", self.config.password.as_str()),
        ];
        match self.http_client.post(&url).form(&params).send().await {
            Ok(r) if r.status().is_success() => {
                if let Ok(json) = r.json::<Value>().await {
                    if let Some(token) = json["access_token"].as_str() {
                        self.cached_token = Some(token.to_string());
                        info!("[DATALAYER] Token auto-fetched from identity manager");
                        return true;
                    }
                }
                warn!("[DATALAYER] Token response has no access_token field");
                false
            }
            Ok(r) => {
                warn!("[DATALAYER] Token fetch failed: HTTP {}", r.status());
                false
            }
            Err(e) => {
                warn!("[DATALAYER] Token fetch error: {}", e);
                false
            }
        }
    }

    /// Returns the effective Bearer token: cached auto-token > static token
    fn effective_token(&self) -> &str {
        if let Some(t) = &self.cached_token {
            return t.as_str();
        }
        self.config.token.as_str()
    }

    fn build_http_client(accept_invalid_certs: bool) -> Client {
        reqwest::Client::builder()
            .danger_accept_invalid_certs(accept_invalid_certs)
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_default()
    }

    pub fn load_config(path: &PathBuf) -> DatalayerConfig {
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(cfg) = serde_json::from_str::<DatalayerConfig>(&content) {
                return cfg;
            } else {
                warn!("[DATALAYER] Failed to parse config at {:?}, using defaults", path);
            }
        }
        DatalayerConfig::default()
    }

    /// Reload config from disk (called periodically)
    pub fn reload_config(&mut self) {
        let new_cfg = Self::load_config(&self.config_path);
        if new_cfg.accept_invalid_certs != self.config.accept_invalid_certs {
            self.http_client = Self::build_http_client(new_cfg.accept_invalid_certs);
        }
        // If credentials changed, invalidate cached token
        if new_cfg.username != self.config.username || new_cfg.password != self.config.password {
            self.cached_token = None;
        }
        self.config = new_cfg;
    }

    pub fn is_enabled(&self) -> bool {
        self.config.enabled && !self.config.base_url.is_empty()
    }

    pub fn poll_interval(&self) -> Duration {
        Duration::from_millis(self.config.poll_interval_ms.max(500))
    }

    /// Read one Datalayer node value via REST API (auto-retries once on 401 after token refresh)
    pub async fn read_node(&mut self, path: &str) -> Result<DatalayerNodeValue> {
        for attempt in 0..2u8 {
            // On second attempt after 401: re-fetch token
            if attempt == 1 {
                if !self.fetch_token().await {
                    anyhow::bail!("Authentication failed for node '{}'", path);
                }
            }

            let encoded_path = path.replace('+', "%2B");
            let url = format!(
                "{}/automation/api/v2/nodes/{}?type=all",
                self.config.base_url.trim_end_matches('/'),
                encoded_path
            );

            let token = self.effective_token().to_string();
            let mut req = self.http_client.get(&url);
            if !token.is_empty() {
                req = req.bearer_auth(&token);
            }

            let resp = req.send().await.context("HTTP request failed")?;
            let status = resp.status();

            if status == reqwest::StatusCode::UNAUTHORIZED && attempt == 0 {
                self.cached_token = None;
                continue; // retry with fresh token
            }
            if !status.is_success() {
                anyhow::bail!("HTTP {} for node '{}'", status, path);
            }
            let node: DatalayerNodeValue =
                resp.json().await.context("Failed to parse response")?;
            return Ok(node);
        }
        anyhow::bail!("read_node '{}': exhausted retries", path)
    }

    /// Browse Datalayer nodes at a path (returns child paths)
    #[allow(dead_code)]
    pub async fn browse_nodes(&self, path: &str) -> Result<Vec<DatalayerNodeInfo>> {
        let encoded_path = if path.is_empty() || path == "/" {
            String::new()
        } else {
            path.replace('+', "%2B")
        };
        let url = if encoded_path.is_empty() {
            format!(
                "{}/automation/api/v2/nodes?type=browse",
                self.config.base_url.trim_end_matches('/')
            )
        } else {
            format!(
                "{}/automation/api/v2/nodes/{}?type=browse",
                self.config.base_url.trim_end_matches('/'),
                encoded_path
            )
        };

        let token = self.effective_token().to_string();
        let mut req = self.http_client.get(&url);
        if !token.is_empty() {
            req = req.bearer_auth(&token);
        }

        let resp = req.send().await.context("Browse HTTP request failed")?;
        let status = resp.status();
        if !status.is_success() {
            anyhow::bail!("HTTP {} browsing '{}'", status, path);
        }

        let raw: Value = resp.json().await.context("Failed to parse browse response")?;

        // Response can be:
        //  { "type": "...", "value": [...list of paths or node objects...] }
        //  or a direct array
        let mut nodes = Vec::new();
        let items = if raw.is_array() {
            raw.as_array().cloned().unwrap_or_default()
        } else if let Some(arr) = raw.get("value").and_then(|v| v.as_array()) {
            arr.clone()
        } else {
            vec![]
        };

        for item in items {
            let node_path = if let Some(s) = item.as_str() {
                s.to_string()
            } else if let Some(s) = item.get("path").and_then(|v| v.as_str()) {
                s.to_string()
            } else {
                continue;
            };
            nodes.push(DatalayerNodeInfo {
                path: node_path,
                value_type: item
                    .get("type")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                value: item.get("value").cloned(),
                error: None,
            });
        }
        Ok(nodes)
    }

    /// Poll all enabled mappings, return list of (topic, payload) to publish
    pub async fn poll_mappings(&mut self) -> Vec<(String, String)> {
        if !self.is_enabled() {
            return vec![];
        }

        let mut to_publish = Vec::new();
        let mappings = self.config.mappings.clone();

        for mapping in &mappings {
            if !mapping.enabled {
                continue;
            }
            match self.read_node(&mapping.datalayer_path).await {
                Ok(node) => {
                    let raw_value = node.value.unwrap_or(Value::Null);

                    // Only publish if value changed
                    let last = self.last_values.get(&mapping.id);
                    if last == Some(&raw_value) {
                        debug!(
                            "[DATALAYER] Node '{}' unchanged, skipping",
                            mapping.datalayer_path
                        );
                        continue;
                    }
                    self.last_values
                        .insert(mapping.id.clone(), raw_value.clone());

                    match build_mqtt_payload(mapping, &raw_value) {
                        Some((topic, payload)) => to_publish.push((topic, payload)),
                        None => warn!(
                            "[DATALAYER] Could not build payload for mapping '{}' (path: {})",
                            mapping.id, mapping.datalayer_path
                        ),
                    }
                }
                Err(e) => {
                    warn!(
                        "[DATALAYER] Failed to read node '{}': {:#}",
                        mapping.datalayer_path, e
                    );
                }
            }
        }

        to_publish
    }

    pub fn config(&self) -> &DatalayerConfig {
        &self.config
    }

    #[allow(dead_code)]
    pub fn save_config(&self) -> Result<()> {
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(&self.config)?;
        fs::write(&self.config_path, json)?;
        Ok(())
    }
}

/// Build MQTT topic + JSON payload for a mapping + value
fn build_mqtt_payload(mapping: &DatalayerMapping, value: &Value) -> Option<(String, String)> {
    let now = chrono_now();
    match mapping.transform {
        MappingTransform::Raw => {
            let payload = serde_json::to_string(value).ok()?;
            Some((mapping.tedge_topic.clone(), payload))
        }
        MappingTransform::Measurement => {
            let field = mapping.effective_field_name();
            let numeric = coerce_to_f64(value)?;
            let payload = json!({ field: numeric, "time": now }).to_string();
            Some((mapping.tedge_topic.clone(), payload))
        }
        MappingTransform::Event => {
            let field = mapping.effective_field_name();
            let text_val = value
                .as_str()
                .map(|s| s.to_string())
                .unwrap_or_else(|| value.to_string());
            let payload = json!({ "text": text_val, field: value, "time": now }).to_string();
            Some((mapping.tedge_topic.clone(), payload))
        }
        MappingTransform::Alarm => {
            let severity = "MAJOR";
            let text_val = value
                .as_str()
                .map(|s| s.to_string())
                .unwrap_or_else(|| value.to_string());
            let payload =
                json!({ "text": text_val, "severity": severity, "time": now }).to_string();
            Some((mapping.tedge_topic.clone(), payload))
        }
    }
}

fn coerce_to_f64(value: &Value) -> Option<f64> {
    match value {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.parse::<f64>().ok(),
        Value::Bool(b) => Some(if *b { 1.0 } else { 0.0 }),
        _ => None,
    }
}

fn chrono_now() -> String {
    // Use SystemTime to produce ISO-8601 UTC timestamp without chrono dependency
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Minimal ISO 8601 from unix timestamp
    let (y, mo, d, h, mi, s) = unix_to_ymd_hms(secs);
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, mo, d, h, mi, s)
}

fn unix_to_ymd_hms(ts: u64) -> (u32, u32, u32, u32, u32, u32) {
    let s = ts % 60;
    let min = (ts / 60) % 60;
    let h = (ts / 3600) % 24;
    let days = ts / 86400;

    // days since 1970-01-01
    let mut year = 1970u32;
    let mut remaining = days;
    loop {
        let days_in_year = if is_leap(year) { 366 } else { 365 };
        if remaining < days_in_year {
            break;
        }
        remaining -= days_in_year;
        year += 1;
    }
    let month_days: [u64; 12] = [
        31,
        if is_leap(year) { 29 } else { 28 },
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
    for md in &month_days {
        if remaining < *md {
            break;
        }
        remaining -= md;
        month += 1;
    }
    let day = (remaining + 1) as u32;
    (
        year,
        month,
        day,
        h as u32,
        min as u32,
        s as u32,
    )
}

fn is_leap(y: u32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)
}

// ── Main poll loop (called from main.rs) ──────────────────────────────────────

pub async fn run_datalayer_loop(
    mut engine: DatalayerEngine,
    mqtt_client: Arc<tokio::sync::Mutex<Option<mqtt::AsyncClient>>>,
    shutdown: Arc<AtomicBool>,
) {
    info!("[DATALAYER] Polling loop started");

    // Fetch initial token if credentials are configured
    if engine.is_enabled() {
        let has_creds = !engine.config().username.is_empty();
        if has_creds {
            engine.fetch_token().await;
        }
    }

    let mut last_config_reload = Instant::now();
    let config_reload_interval = Duration::from_secs(10);

    loop {
        if shutdown.load(Ordering::Relaxed) {
            info!("[DATALAYER] Shutdown requested, stopping poll loop");
            break;
        }

        // Reload config periodically
        if last_config_reload.elapsed() >= config_reload_interval {
            engine.reload_config();
            last_config_reload = Instant::now();
            if engine.is_enabled() {
                debug!(
                    "[DATALAYER] Config reloaded, {} mapping(s) active",
                    engine.config().mappings.iter().filter(|m| m.enabled).count()
                );
                // Re-fetch token if cache was invalidated or not yet obtained
                let needs_token = engine.cached_token.is_none() && !engine.config().username.is_empty();
                if needs_token {
                    engine.fetch_token().await;
                }
            }
        }

        if engine.is_enabled() {
            let messages = engine.poll_mappings().await;
            let client_guard = mqtt_client.lock().await;
            if let Some(cli) = client_guard.as_ref() {
                for (topic, payload) in messages {
                    info!("[DATALAYER] Publishing to {} : {}", topic, payload);
                    let msg = mqtt::Message::new(&topic, payload.as_bytes(), 0);
                    if let Err(e) = cli.publish(msg).await {
                        error!("[DATALAYER] MQTT publish failed: {}", e);
                    }
                }
            }
        }

        tokio::time::sleep(engine.poll_interval()).await;
    }

    info!("[DATALAYER] Polling loop stopped");
}
