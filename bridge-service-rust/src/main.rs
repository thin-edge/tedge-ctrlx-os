mod datalayer;

use anyhow::Result;
use log::{info, warn};
use serde_json::json;
// handle_mqtt_message added to import
use crate::datalayer::{
    handle_mqtt_message, run_datalayer_loop, DatalayerConfig, DatalayerCredentials,
    DatalayerEngine, MappingDirection,
};
use futures::StreamExt;
use paho_mqtt as mqtt;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

/// Reads the device serial number directly from sysfs/machine-id.
/// Same priority chain as manage-device-id.sh, but without a subprocess.
fn get_device_serial() -> String {
    // Priority 1-3: DMI product/board/chassis serial
    for path in &[
        "/sys/class/dmi/id/product_serial",
        "/sys/class/dmi/id/board_serial",
        "/sys/class/dmi/id/chassis_serial",
    ] {
        if let Ok(s) = std::fs::read_to_string(path) {
            let s = s.trim().trim_matches('\0').to_string();
            if !s.is_empty() && s != "0" && s != "None" {
                return format!("ctrlx-{}", s);
            }
        }
    }
    // Priority 4: product_uuid (VMs)
    if let Ok(s) = std::fs::read_to_string("/sys/class/dmi/id/product_uuid") {
        let s = s.trim().trim_matches('\0').to_string();
        if !s.is_empty() && s != "0" && s != "None" {
            return format!("ctrlx-{}", s);
        }
    }
    // Priority 5: machine-id
    if let Ok(s) = std::fs::read_to_string("/etc/machine-id") {
        let s = s.trim().to_string();
        if !s.is_empty() {
            return format!("ctrlx-{}", s);
        }
    }
    String::new()
}

struct TedgeDatalayerBridge {
    mqtt_host: String,
    mqtt_port: u16,
    http_client: reqwest::Client,
}

impl TedgeDatalayerBridge {
    fn new(accept_invalid_certs: bool) -> Self {
        let http_client = reqwest::Client::builder()
            .danger_accept_invalid_certs(accept_invalid_certs)
            .build()
            .unwrap_or_default();
        Self {
            mqtt_host: "localhost".to_string(),
            mqtt_port: 1883,
            http_client,
        }
    }

    async fn setup_mqtt(&self, config: &DatalayerConfig) -> Result<mqtt::AsyncClient> {
        let broker = format!("tcp://{}:{}", self.mqtt_host, self.mqtt_port);
        let create_opts = mqtt::CreateOptionsBuilder::new()
            .server_uri(&broker)
            .client_id("tedge-datalayer-bridge")
            .mqtt_version(mqtt::MQTT_VERSION_3_1_1)
            .finalize();
        let cli = mqtt::AsyncClient::new(create_opts)?;
        let conn_opts = mqtt::ConnectOptionsBuilder::new_v3()
            .keep_alive_interval(Duration::from_secs(20))
            .clean_session(true)
            .automatic_reconnect(Duration::from_secs(1), Duration::from_secs(30))
            .finalize();
        cli.connect(conn_opts).await?;

        let mut topics = vec![];
        // tedge/health/+ only if MQTT Service (port 9883) is active
        if config.mqtt_service_enabled {
            topics.push("tedge/health/+".to_string());
        }
        for mapping in config
            .mappings
            .iter()
            .filter(|m| m.direction == MappingDirection::TedgeToDatalayer && m.enabled)
        {
            topics.push(mapping.topic.clone());
        }
        cli.subscribe_many(&topics, &vec![0; topics.len()]).await?;
        Ok(cli)
    }

    async fn process_message(
        &mut self,
        msg: &mqtt::Message,
        config: &DatalayerConfig,
        credentials: &DatalayerCredentials,
    ) {
        handle_mqtt_message(msg, config, credentials, &self.http_client).await;
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let is_snap = env::var("SNAP").is_ok();
    let config_path: PathBuf = if is_snap {
        PathBuf::from(env::var("SNAP_DATA").unwrap_or_default()).join("datalayer-mappings.json")
    } else {
        PathBuf::from("/tmp/datalayer-mappings.json")
    };
    // Credentials are stored in SNAP_COMMON (survive snap updates), same as where the webserver saves them
    let credentials_path: PathBuf = if is_snap {
        PathBuf::from(env::var("SNAP_COMMON").unwrap_or_default())
            .join("datalayer-credentials.json")
    } else {
        PathBuf::from("/tmp/datalayer-credentials.json")
    };

    let mut config = DatalayerEngine::load_config(&config_path);
    let credentials = DatalayerEngine::load_credentials(&credentials_path);

    // Determine device_external_id:
    // Priority 1: tedge config get device.id (matches the registered Cumulocity device)
    // Priority 2: hardware serial from sysfs DMI (fallback for VMs/unconfigured devices)
    let tedge_device_id = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        let snap_data = env::var("SNAP_DATA").unwrap_or_default();
        let tedge_bin = PathBuf::from(&snap).join("bin/tedge");
        let tedge_config_dir = PathBuf::from(&snap_data).join("tedge");
        std::process::Command::new(&tedge_bin)
            .args([
                "--config-dir",
                tedge_config_dir.to_str().unwrap_or(""),
                "config",
                "get",
                "device.id",
            ])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_default()
    } else {
        String::new()
    };

    let external_id = if !tedge_device_id.is_empty() {
        info!(
            "[BRIDGE] Device external ID from tedge config: {}",
            tedge_device_id
        );
        tedge_device_id
    } else {
        let serial = get_device_serial();
        if !serial.is_empty() {
            info!(
                "[BRIDGE] Device external ID from hardware serial ({} chars)",
                serial.len()
            );
        }
        serial
    };
    if !external_id.is_empty() {
        config.device_external_id = external_id;
    }

    // Read mqtt_service_enabled from tedge config
    let mqtt_service_enabled = if is_snap {
        let snap = env::var("SNAP").unwrap_or_default();
        let snap_data = env::var("SNAP_DATA").unwrap_or_default();
        let tedge_bin = PathBuf::from(&snap).join("bin/tedge");
        let tedge_config_dir = PathBuf::from(&snap_data).join("tedge");
        std::process::Command::new(&tedge_bin)
            .args([
                "--config-dir",
                tedge_config_dir.to_str().unwrap_or(""),
                "config",
                "get",
                "c8y.mqtt_service.enabled",
            ])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim() == "true")
            .unwrap_or(false)
    } else {
        false
    };
    config.mqtt_service_enabled = mqtt_service_enabled;
    info!(
        "[BRIDGE] MQTT Service mode (9883): {}",
        mqtt_service_enabled
    );
    let shutdown = Arc::new(AtomicBool::new(false));
    if config.accept_invalid_certs {
        warn!("[BRIDGE] TLS certificate verification is DISABLED — only use in trusted network environments");
    }
    let mut bridge = TedgeDatalayerBridge::new(config.accept_invalid_certs);

    // SIGTERM handler: set shutdown flag for graceful exit
    let shutdown_signal = shutdown.clone();
    tokio::spawn(async move {
        if let Ok(()) = tokio::signal::ctrl_c().await {
            shutdown_signal.store(true, Ordering::Relaxed);
        }
    });
    #[cfg(unix)]
    {
        let shutdown_signal2 = shutdown.clone();
        tokio::spawn(async move {
            let mut sig = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("SIGTERM handler");
            sig.recv().await;
            shutdown_signal2.store(true, Ordering::Relaxed);
        });
    }

    let mut async_client = bridge.setup_mqtt(&config).await?;
    let mut msg_stream = async_client.get_stream(100);

    let client_arc = Arc::new(Mutex::new(Some(async_client)));

    // Register all snap services as thin-edge.io entities so they appear in the
    // Cumulocity Services tab. We do this here (after MQTT is connected) rather than
    // in the post-refresh hook, because mosquitto is not running during the hook.
    {
        let snap_name = env::var("SNAP_INSTANCE_NAME")
            .unwrap_or_else(|_| env::var("SNAP_NAME").unwrap_or_default());
        let services = [
            "tedge-agent",
            "tedge-mapper-c8y",
            "tedge-watchdog",
            "tedge-datalayer-bridge",
            "tedge-log-upload-manager",
            "webserver",
            "c8y-firmware-plugin",
        ];
        if let Some(cli) = client_arc.lock().await.as_ref() {
            for svc in &services {
                let twin_topic = format!("te/device/main/service/{svc}");
                let twin_payload = json!({
                    "@parent": "device/main//",
                    "@type": "service",
                    "name": svc,
                    "type": "service"
                })
                .to_string();
                let _ = cli
                    .publish(mqtt::Message::new_retained(&twin_topic, twin_payload, 1))
                    .await;

                // Determine service status via snapctl
                let snap_svc = format!("{snap_name}.{svc}");
                let health_status = if snap_name.is_empty() {
                    "up"
                } else {
                    let out = std::process::Command::new("snapctl")
                        .args(["services", &snap_svc])
                        .output();
                    match out {
                        Ok(o) if String::from_utf8_lossy(&o.stdout).contains("active") => "up",
                        _ => "down",
                    }
                };
                let health_topic = format!("te/device/main/service/{svc}/status/health");
                let health_payload = format!("{{\"status\":\"{health_status}\"}}");
                let _ = cli
                    .publish(mqtt::Message::new_retained(
                        &health_topic,
                        health_payload,
                        1,
                    ))
                    .await;
                info!("[BRIDGE] Registered service '{svc}' status={health_status}");
            }
        }
    }

    let dl_engine = DatalayerEngine::new_with_overrides(
        config_path,
        config.device_external_id.clone(),
        config.mqtt_service_enabled,
    );
    let dl_handle = tokio::spawn(run_datalayer_loop(
        dl_engine,
        client_arc.clone(),
        shutdown.clone(),
    ));

    while let Some(Some(msg)) = msg_stream.next().await {
        bridge.process_message(&msg, &config, &credentials).await;
        if shutdown.load(Ordering::Relaxed) {
            break;
        }
    }

    let _ = tokio::time::timeout(Duration::from_secs(2), dl_handle).await;

    // Publish health=down and logout session on clean exit
    if let Some(cli) = client_arc.lock().await.as_ref() {
        let _ = cli
            .publish(mqtt::Message::new_retained(
                "te/device/main/service/tedge-datalayer-bridge/status/health",
                r#"{"status":"down"}"#,
                1,
            ))
            .await;
    }

    Ok(())
}
