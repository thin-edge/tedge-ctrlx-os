mod datalayer;

use anyhow::Result;
// handle_mqtt_message zum Import hinzugefügt
use crate::datalayer::{
    handle_mqtt_message, run_datalayer_loop, DatalayerConfig, DatalayerEngine, MappingDirection,
};
use futures::StreamExt;
use paho_mqtt as mqtt;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
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
            .finalize();
        let cli = mqtt::AsyncClient::new(create_opts)?;
        let conn_opts = mqtt::ConnectOptionsBuilder::new()
            .keep_alive_interval(Duration::from_secs(20))
            .clean_session(true)
            .automatic_reconnect(Duration::from_secs(1), Duration::from_secs(30))
            .finalize();
        cli.connect(conn_opts).await?;

        let mut topics = vec!["tedge/health/+".to_string()];
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

    async fn process_message(&mut self, msg: &mqtt::Message, config: &DatalayerConfig) {
        // Jetzt wird die Funktion gefunden
        handle_mqtt_message(msg, config, &self.http_client).await;
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let is_snap = env::var("SNAP").is_ok();
    let config_path: PathBuf = if is_snap {
        PathBuf::from(
            env::var("SNAP_DATA").unwrap_or_else(|_| "/var/snap/thin-edge-io/current".to_string()),
        )
        .join("datalayer-mappings.json")
    } else {
        PathBuf::from("/tmp/datalayer-mappings.json")
    };

    // DatalayerEngine::load_config wird jetzt gefunden
    let config = DatalayerEngine::load_config(&config_path);
    let shutdown = Arc::new(AtomicBool::new(false));
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
    let dl_engine = DatalayerEngine::new(config_path);
    let dl_handle = tokio::spawn(run_datalayer_loop(
        dl_engine,
        client_arc.clone(),
        shutdown.clone(),
    ));

    while let Some(Some(msg)) = msg_stream.next().await {
        bridge.process_message(&msg, &config).await;
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
