use log::{info, warn};
use paho_mqtt as mqtt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

// --- Config Structs ---

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MappingTransform { Raw, Measurement, Event, Alarm }

impl Default for MappingTransform {
    fn default() -> Self { MappingTransform::Measurement }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum MappingDirection {
    #[serde(rename = "dl_to_tedge")] DatalayerToTedge,
    #[serde(rename = "tedge_to_dl")] TedgeToDatalayer,
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
}

// Hilfsfunktion für Serde
fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

fn default_direction() -> MappingDirection { MappingDirection::DatalayerToTedge }
fn default_true() -> bool { true }
fn default_poll_interval() -> u32 { 5000 }

impl DatalayerMapping {
    pub fn effective_field_name(&self) -> String {
        if let Some(name) = &self.field_name {
            if !name.is_empty() { return name.clone(); }
        }
        self.path.trim_end_matches('/').rsplit('/').next().unwrap_or("value").to_string()
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
    pub username: Option<String>, 
    pub password: Option<String>,
    pub token: Option<String>,
    #[serde(rename = "acceptInvalidCerts", default)]
    pub accept_invalid_certs: bool,
}

impl Default for DatalayerConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            base_url: "https://localhost".to_string(),
            poll_interval_ms: 5000,
            mappings: Vec::new(),
            username: None, password: None, token: None,
            accept_invalid_certs: true,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct DatalayerNodeValue {
    pub value: Option<Value>,
}

// --- Datalayer Engine ---

pub struct DatalayerEngine {
    config_path: PathBuf,
    config: DatalayerConfig,
    http_client: Client,
    last_values: HashMap<String, Value>,
    pub cached_token: Option<String>,
}

impl DatalayerEngine {
    pub fn new(config_path: PathBuf) -> Self {
        let config = Self::load_config(&config_path);
        let http_client = reqwest::Client::builder()
            .danger_accept_invalid_certs(config.accept_invalid_certs)
            .build().unwrap_or_default();
        Self { config_path, config, http_client, last_values: HashMap::new(), cached_token: None }
    }

    pub fn load_config(path: &PathBuf) -> DatalayerConfig {
        fs::read_to_string(path).ok()
            .and_then(|c| serde_json::from_str(&c).ok())
            .unwrap_or_default()
    }

    pub fn reload_config(&mut self) { self.config = Self::load_config(&self.config_path); }
    pub fn is_enabled(&self) -> bool { self.config.enabled && !self.config.base_url.is_empty() }
    pub fn config(&self) -> &DatalayerConfig { &self.config }

    pub async fn fetch_token(&mut self) -> bool {
        let user = match &self.config.username { Some(u) if !u.is_empty() => u, _ => return false };
        let pass = self.config.password.as_deref().unwrap_or("");
        let url = format!("{}/identity-manager/api/v2/auth/token", self.config.base_url.trim_end_matches('/'));
        let params = [("grant_type", "password"), ("username", user), ("password", pass)];

        match self.http_client.post(&url).form(&params).send().await {
            Ok(r) if r.status().is_success() => {
                if let Ok(j) = r.json::<Value>().await {
                    if let Some(t) = j["access_token"].as_str() {
                        self.cached_token = Some(t.to_string());
                        info!("[DATALAYER] Token refreshed");
                        return true;
                    }
                }
                false
            }
            _ => {
                warn!("[DATALAYER] Token fetch failed");
                false
            }
        }
    }

    fn effective_token(&self) -> String {
        self.cached_token.clone().or_else(|| self.config.token.clone()).unwrap_or_default()
    }

    pub async fn poll_mappings(&mut self) -> Vec<(String, String)> {
        let mut to_publish = Vec::new();
        
        // Automatischer Token-Refresh bei Bedarf
        if self.cached_token.is_none() && self.config.username.is_some() {
            self.fetch_token().await;
        }

        let mappings = self.config.mappings.clone();
        for mapping in mappings.iter().filter(|m| m.enabled && m.direction == MappingDirection::DatalayerToTedge) {
            let url = format!("{}/automation/api/v2/nodes/{}?type=all", 
                self.config.base_url.trim_end_matches('/'), mapping.path.replace('+', "%2B"));
            
            let token = self.effective_token();
            let mut req = self.http_client.get(&url);
            if !token.is_empty() { req = req.bearer_auth(&token); }

            if let Ok(resp) = req.send().await {
                if resp.status() == 401 { self.cached_token = None; } // Token ungültig? Cache leeren.
                if let Ok(node) = resp.json::<DatalayerNodeValue>().await {
                    let val = node.value.unwrap_or(Value::Null);
                    if self.last_values.get(&mapping.id) != Some(&val) {
                        self.last_values.insert(mapping.id.clone(), val.clone());
                        
                        // Hier nutzen wir jetzt effective_field_name()
                        let field = mapping.effective_field_name();
                        let payload = match mapping.transform {
                            MappingTransform::Measurement => json!({field: val}).to_string(),
                            _ => val.to_string()
                        };
                        to_publish.push((mapping.topic.clone(), payload));
                    }
                }
            }
        }
        to_publish
    }
}

// --- Loops & Handler ---

pub async fn run_datalayer_loop(mut engine: DatalayerEngine, mqtt_client: Arc<tokio::sync::Mutex<Option<mqtt::AsyncClient>>>, shutdown: Arc<AtomicBool>) {
    info!("[DATALAYER] Loop started");
    while !shutdown.load(Ordering::Relaxed) {
        engine.reload_config();
        if engine.is_enabled() {
            let messages = engine.poll_mappings().await;
            let guard = mqtt_client.lock().await;
            if let Some(cli) = guard.as_ref() {
                for (t, p) in messages { let _ = cli.publish(mqtt::Message::new(t, p, 0)).await; }
            }
        }
        tokio::time::sleep(Duration::from_millis(engine.config().poll_interval_ms as u64)).await;
    }
}

pub async fn handle_mqtt_message(msg: &mqtt::Message, config: &DatalayerConfig, http_client: &Client) {
    let topic = msg.topic();
    if let Some(m) = config.mappings.iter().find(|m| m.topic == topic && m.direction == MappingDirection::TedgeToDatalayer && m.enabled) {
        let url = format!("{}/automation/api/v2/nodes/{}", config.base_url.trim_end_matches('/'), m.path.trim_start_matches('/'));
        let mut req = http_client.put(&url).body(msg.payload_str().to_string());
        let token = config.token.clone().or(config.token.clone()).unwrap_or_default();
        if !token.is_empty() { req = req.bearer_auth(token); }
        let _ = req.send().await;
    }
}