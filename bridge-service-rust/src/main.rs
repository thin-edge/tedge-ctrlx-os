mod datalayer;

use anyhow::{Context, Result};
use datalayer::{run_datalayer_loop, DatalayerEngine};
use futures::StreamExt;
use log::{debug, info};
use paho_mqtt as mqtt;
use serde_json::Value;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};

// ── Bridge struct ─────────────────────────────────────────────────────────────

struct TedgeDatalayerBridge {
    mqtt_host: String,
    mqtt_port: u16,
    stats_messages_received: u64,
}

impl TedgeDatalayerBridge {
    fn new() -> Self {
        Self {
            mqtt_host: "localhost".to_string(),
            mqtt_port: 1883,
            stats_messages_received: 0,
        }
    }

    async fn setup_mqtt(&self) -> Result<mqtt::AsyncClient> {
        info!("[BRIDGE] Initializing async MQTT client...");
        let broker = format!("tcp://{}:{}", self.mqtt_host, self.mqtt_port);
        let create_opts = mqtt::CreateOptionsBuilder::new()
            .server_uri(&broker)
            .client_id("tedge-datalayer-bridge")
            .finalize();
        let cli = mqtt::AsyncClient::new(create_opts)
            .context("Failed to create async MQTT client")?;
        let conn_opts = mqtt::ConnectOptionsBuilder::new()
            .keep_alive_interval(Duration::from_secs(20))
            .clean_session(true)
            .automatic_reconnect(Duration::from_secs(1), Duration::from_secs(30))
            .finalize();
        info!("[BRIDGE] Connecting to MQTT broker: {}", broker);
        cli.connect(conn_opts)
            .await
            .context("Failed to connect to MQTT broker")?;
        info!("[BRIDGE] MQTT connected successfully");
        let topics = vec![
            "te/+/+/+/+/m/+",
            "te/+/+/+/+/e/+",
            "te/+/+/+/+/a/+/+",
            "tedge/measurements",
            "tedge/measurements/+",
            "tedge/events/+",
            "tedge/alarms/+/+",
            "tedge/health/+",
        ];
        let qos = vec![0; topics.len()];
        cli.subscribe_many(&topics, &qos)
            .await
            .context("Failed to subscribe to topics")?;
        for topic in &topics {
            info!("[BRIDGE] Subscribed to MQTT topic: {}", topic);
        }
        Ok(cli)
    }

    fn process_message(&mut self, msg: &mqtt::Message) {
        self.stats_messages_received += 1;
        let topic = msg.topic();
        let payload = msg.payload_str();
        let preview = if payload.len() > 200 {
            format!("{}...", &payload[..200])
        } else {
            payload.to_string()
        };
        debug!("[BRIDGE] MQTT [{}]: {}", topic, preview);
        if let Ok(data) = serde_json::from_str::<Value>(&payload) {
            if data.is_object() && data.as_object().map(|o| o.len()).unwrap_or(0) < 10 {
                info!(
                    "[BRIDGE] MQTT [{}]: {}",
                    topic,
                    serde_json::to_string_pretty(&data).unwrap_or_default()
                );
            }
        }
    }

    fn print_statistics(&self) {
        info!(
            "[BRIDGE] Statistics: {} MQTT messages received",
            self.stats_messages_received
        );
    }
}

// ── Entrypoint ────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    info!("==============================================================================");
    info!("thin-edge.io to ctrlX Datalayer Bridge (Rust)");
    info!("Version: 1.1.0");
    info!("==============================================================================");

    let is_snap = env::var("SNAP").is_ok();
    let config_path: PathBuf = if is_snap {
        let snap_data =
            env::var("SNAP_DATA").unwrap_or_else(|_| "/var/snap/thin-edge-io/current".to_string());
        PathBuf::from(snap_data).join("datalayer-mappings.json")
    } else {
        PathBuf::from("/tmp/datalayer-mappings.json")
    };
    info!("[BRIDGE] Datalayer config path: {:?}", config_path);

    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_clone = shutdown.clone();
    ctrlc::set_handler(move || {
        info!("[BRIDGE] Received shutdown signal");
        shutdown_clone.store(true, Ordering::Relaxed);
    })
    .context("Failed to set signal handler")?;

    let mut bridge = TedgeDatalayerBridge::new();
    let mut async_client = bridge.setup_mqtt().await?;
    // Get the message stream BEFORE moving the client into the Arc
    let mut msg_stream = async_client.get_stream(100);
    let async_client_arc = Arc::new(Mutex::new(Some(async_client)));
    let async_client_for_dl = async_client_arc.clone();

    let dl_engine = DatalayerEngine::new(config_path);
    let enabled = dl_engine.is_enabled();
    let shutdown_dl = shutdown.clone();
    let dl_handle = tokio::spawn(async move {
        run_datalayer_loop(dl_engine, async_client_for_dl, shutdown_dl).await;
    });

    if enabled {
        info!("[BRIDGE] Datalayer polling ENABLED");
    } else {
        info!("[BRIDGE] Datalayer polling DISABLED (configure via web UI)");
    }

    info!("[BRIDGE] Running, waiting for MQTT messages...");
    let mut last_stats = std::time::Instant::now();
    let stats_interval = Duration::from_secs(60);

    loop {
        tokio::select! {
            msg_opt = msg_stream.next() => {
                match msg_opt {
                    Some(Some(msg)) => bridge.process_message(&msg),
                    Some(None) => {
                        // Disconnected
                        info!("[BRIDGE] MQTT stream ended (disconnected)");
                    }
                    None => break,
                }
            }
            _ = tokio::time::sleep(Duration::from_millis(200)) => {
                if shutdown.load(Ordering::Relaxed) {
                    info!("[BRIDGE] Shutdown requested");
                    break;
                }
                if last_stats.elapsed() >= stats_interval {
                    bridge.print_statistics();
                    last_stats = std::time::Instant::now();
                }
            }
        }
        if shutdown.load(Ordering::Relaxed) {
            break;
        }
    }

    {
        let guard = async_client_arc.lock().await;
        if let Some(cli) = guard.as_ref() {
            info!("[BRIDGE] Disconnecting from MQTT...");
            let _ = cli.disconnect(None).await;
        }
    }
    let _ = tokio::time::timeout(Duration::from_secs(3), dl_handle).await;
    info!("[BRIDGE] Bridge stopped");
    Ok(())
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
    #[serde(default = "default_true")]
    pub enabled: bool,
}
fn default_true() -> bool { true }
fn default_poll_interval() -> u32 { 5000 }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatalayerConfig {
    #[serde(default)]
    pub enabled: bool,

    #[serde(rename = "baseUrl", default)] // Mappt "baseUrl" aus JSON auf "base_url" in Rust
    pub base_url: String,

    #[serde(rename = "pollIntervalMs", default = "default_poll_interval")]
    pub poll_interval_ms: u32,

    #[serde(default)]
    pub mappings: Vec<DatalayerMapping>,

    // WICHTIG: Option verwenden, damit "null" im JSON erlaubt ist!
    pub username: Option<String>, 
    pub password: Option<String>,
    pub token: Option<String>,

    #[serde(rename = "acceptInvalidCerts", default)]
    pub accept_invalid_certs: bool,
}