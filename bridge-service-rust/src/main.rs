use anyhow::{Context, Result};
use log::{debug, error, info, warn};
use paho_mqtt as mqtt;
use serde_json::Value;
use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

/// thin-edge.io to ctrlX Datalayer Bridge
/// 
/// Bridges MQTT messages from thin-edge.io to ctrlX Datalayer
/// Note: Full Datalayer integration requires ctrlX Datalayer SDK (future)
struct TedgeDatalayerBridge {
    mqtt_host: String,
    mqtt_port: u16,
    mqtt_client: Option<mqtt::Client>,
    datalayer_enabled: bool,
    stats_messages_received: u64,
}

impl TedgeDatalayerBridge {
    fn new() -> Self {
        let datalayer_enabled = env::var("SNAP").is_ok();
        
        Self {
            mqtt_host: "localhost".to_string(),
            mqtt_port: 1883,
            mqtt_client: None,
            datalayer_enabled,
            stats_messages_received: 0,
        }
    }

    /// Setup MQTT connection to thin-edge.io broker
    fn setup_mqtt(&mut self) -> Result<()> {
        info!("Initializing MQTT client...");
        
        let broker = format!("tcp://{}:{}", self.mqtt_host, self.mqtt_port);
        
        let create_opts = mqtt::CreateOptionsBuilder::new()
            .server_uri(&broker)
            .client_id("tedge-datalayer-bridge")
            .finalize();
            
        let cli = mqtt::Client::new(create_opts)
            .context("Failed to create MQTT client")?;
        
        let conn_opts = mqtt::ConnectOptionsBuilder::new()
            .keep_alive_interval(Duration::from_secs(20))
            .clean_session(true)
            .finalize();
            
        info!("Connecting to MQTT broker: {}", broker);
        cli.connect(conn_opts)
            .context("Failed to connect to MQTT broker")?;
            
        info!("MQTT connected successfully");
        
        // Subscribe to thin-edge.io topics
        let topics = vec![
            "tedge/measurements",
            "tedge/measurements/+",
            "tedge/events/+",
            "tedge/alarms/+/+",
            "tedge/health/+",
            "c8y/#",
            "aws/#",
            "az/#",
            "tedge/#",
        ];
        
        let qos = vec![0; topics.len()];
        
        cli.subscribe_many(&topics, &qos)
            .context("Failed to subscribe to topics")?;
            
        for topic in &topics {
            info!("Subscribed to MQTT topic: {}", topic);
        }
        
        self.mqtt_client = Some(cli);
        
        Ok(())
    }

    /// Process MQTT message - log and optionally forward to Datalayer
    fn process_message(&mut self, msg: &mqtt::Message) {
        self.stats_messages_received += 1;
        
        let topic = msg.topic();
        let payload = msg.payload_str();
        
        // Log message (truncate if too long)
        let payload_preview = if payload.len() > 200 {
            format!("{}...", &payload[..200])
        } else {
            payload.to_string()
        };
        
        debug!("MQTT [{}]: {}", topic, payload_preview);
        
        // Try to parse as JSON for better logging
        if let Ok(data) = serde_json::from_str::<Value>(&payload) {
            if data.is_object() && data.as_object().unwrap().len() < 10 {
                info!("MQTT [{}]: {}", topic, serde_json::to_string_pretty(&data).unwrap_or_default());
            }
        }
        
        // TODO: Forward to Datalayer when ctrlX Datalayer SDK is available
        if self.datalayer_enabled {
            debug!("Datalayer forwarding not yet implemented");
        }
    }

    /// Print statistics
    fn print_statistics(&self) {
        info!("Statistics: {} messages received", self.stats_messages_received);
    }

    /// Main run loop
    fn run(&mut self, shutdown: Arc<AtomicBool>) -> Result<()> {
        info!("Starting thin-edge.io to ctrlX Datalayer Bridge");
        info!("Datalayer integration: {}", 
            if self.datalayer_enabled { "ENABLED" } else { "DISABLED (MQTT-only mode)" }
        );
        
        self.setup_mqtt()?;
        
        info!("Bridge is running");
        
        let cli = self.mqtt_client.as_ref().unwrap();
        let rx = cli.start_consuming();
        
        let mut last_stats = std::time::Instant::now();
        let stats_interval = Duration::from_secs(60);
        
        loop {
            if shutdown.load(Ordering::Relaxed) {
                info!("Shutdown requested");
                break;
            }
            
            // Check for messages with timeout
            match rx.recv_timeout(Duration::from_secs(1)) {
                Ok(Some(msg)) => {
                    self.process_message(&msg);
                }
                Ok(None) => {
                    warn!("MQTT disconnected, will reconnect...");
                    break;
                }
                Err(_) => {
                    // Timeout, check shutdown flag
                }
            }
            
            // Print statistics periodically
            if last_stats.elapsed() >= stats_interval {
                self.print_statistics();
                last_stats = std::time::Instant::now();
            }
        }
        
        // Cleanup
        if let Some(cli) = &self.mqtt_client {
            info!("Disconnecting from MQTT...");
            let _ = cli.disconnect(None);
        }
        
        info!("Bridge stopped");
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();
    
    info!("==============================================================================");
    info!("thin-edge.io to ctrlX Datalayer Bridge (Rust)");
    info!("Version: 1.0.0");
    info!("==============================================================================");
    
    // Setup signal handler
    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_clone = shutdown.clone();
    
    ctrlc::set_handler(move || {
        info!("Received shutdown signal");
        shutdown_clone.store(true, Ordering::Relaxed);
    }).context("Failed to set signal handler")?;
    
    // Create and run bridge
    let mut bridge = TedgeDatalayerBridge::new();
    
    match bridge.run(shutdown) {
        Ok(_) => {
            info!("Bridge terminated successfully");
            Ok(())
        }
        Err(e) => {
            error!("Bridge error: {:#}", e);
            Err(e)
        }
    }
}
