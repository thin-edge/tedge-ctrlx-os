mod datalayer;

use anyhow::Result;
use log::info;
// handle_mqtt_message zum Import hinzugefügt
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

/// Liest den Common Name (CN) aus einem PEM-Zertifikat.
/// Gibt None zurück wenn das Cert nicht lesbar oder kein CN vorhanden ist.
fn get_device_id_from_cert(cert_path: &std::path::Path) -> Option<String> {
    let pem = std::fs::read_to_string(cert_path).ok()?;
    // Suche nach "Subject: CN = <value>" oder "Subject: ... CN=<value>"
    // Das Cert enthält die Subject-Zeile als Base64-DER, daher parsen wir den PEM-Text
    // mit einer simplen OpenSSL-freien Methode: wir suchen im decoded Subject nach dem CN.
    // Einfachste Methode ohne externe Crate: Subject-Zeile aus `openssl x509` ist nicht verfügbar —
    // stattdessen suchen wir den CN im PEM-Header-Kommentar (nicht immer vorhanden).
    // Robustere Methode: aus dem DER-codierten Subject den CN extrahieren.
    let cn = parse_cn_from_pem(&pem)?;
    if cn.is_empty() {
        None
    } else {
        Some(cn)
    }
}

/// Extrahiert den CN aus einem PEM-Zertifikat durch minimales DER-Parsing.
fn parse_cn_from_pem(pem: &str) -> Option<String> {
    // PEM → Base64 → DER
    let b64: String = pem.lines().filter(|l| !l.starts_with("-----")).collect();
    let der = base64_decode(&b64)?;

    // CN OID: 2.5.4.3 → DER: 55 04 03
    let cn_oid: &[u8] = &[0x55, 0x04, 0x03];
    let pos = der.windows(3).position(|w| w == cn_oid)?;
    // Nach der OID folgt: SET { SEQUENCE { OID, STRING } }
    // Struktur: OID(3) dann Tag+Len+Value des Strings
    let after_oid = pos + 3;
    if after_oid + 2 > der.len() {
        return None;
    }
    // Tag (UTF8String=0x0C, PrintableString=0x13, IA5String=0x16)
    let tag = der[after_oid];
    if !matches!(tag, 0x0C | 0x13 | 0x16 | 0x1E) {
        return None;
    }
    let len = der[after_oid + 1] as usize;
    let start = after_oid + 2;
    if start + len > der.len() {
        return None;
    }
    String::from_utf8(der[start..start + len].to_vec()).ok()
}

fn base64_decode(input: &str) -> Option<Vec<u8>> {
    let input: Vec<u8> = input.bytes().filter(|b| !b" \t\r\n".contains(b)).collect();
    let table: &[i8; 256] = &{
        let mut t = [-1i8; 256];
        for (i, &c) in b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
            .iter()
            .enumerate()
        {
            t[c as usize] = i as i8;
        }
        t
    };
    let mut out = Vec::with_capacity(input.len() * 3 / 4);
    let mut i = 0;
    while i + 3 < input.len() {
        let a = table[input[i] as usize];
        let b = table[input[i + 1] as usize];
        let c = table[input[i + 2] as usize];
        let d = table[input[i + 3] as usize];
        if a < 0 || b < 0 {
            return None;
        }
        out.push(((a as u8) << 2) | ((b as u8) >> 4));
        if input[i + 2] != b'=' && c >= 0 {
            out.push(((b as u8) << 4) | ((c as u8) >> 2));
        }
        if input[i + 3] != b'=' && d >= 0 {
            out.push(((c as u8) << 6) | (d as u8));
        }
        i += 4;
    }
    Some(out)
}

/// Liest die Geräte-Seriennummer direkt aus sysfs/machine-id.
/// Gleiche Prioritäten wie manage-device-id.sh, aber ohne Subprozess.
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
            .finalize();
        let cli = mqtt::AsyncClient::new(create_opts)?;
        let conn_opts = mqtt::ConnectOptionsBuilder::new()
            .keep_alive_interval(Duration::from_secs(20))
            .clean_session(true)
            .automatic_reconnect(Duration::from_secs(1), Duration::from_secs(30))
            .finalize();
        cli.connect(conn_opts).await?;

        let mut topics = vec![];
        // tedge/health/+ nur abonnieren wenn MQTT Service (Port 9883) aktiv ist
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
        PathBuf::from(
            env::var("SNAP_DATA")
                .unwrap_or_else(|_| "/var/snap/ctrlx-cumulocity-thin-edge-io/current".to_string()),
        )
        .join("datalayer-mappings.json")
    } else {
        PathBuf::from("/tmp/datalayer-mappings.json")
    };
    let credentials_path = config_path
        .parent()
        .unwrap_or_else(|| std::path::Path::new("."))
        .join("datalayer-credentials.json");

    let mut config = DatalayerEngine::load_config(&config_path);
    let credentials = DatalayerEngine::load_credentials(&credentials_path);

    // device_external_id aus dem Cert-CN lesen (= was Cumulocity als externalId kennt).
    // Fallback: get_device_serial() (sysfs/machine-id)
    let external_id = if is_snap {
        let snap_common = env::var("SNAP_COMMON")
            .unwrap_or_else(|_| "/var/snap/ctrlx-cumulocity-thin-edge-io/common".to_string());
        let cert_path = PathBuf::from(&snap_common)
            .join("package-certificates/thin-edge-io/tedge/own/certs/tedge-certificate.pem");
        get_device_id_from_cert(&cert_path).unwrap_or_else(get_device_serial)
    } else {
        get_device_serial()
    };
    if !external_id.is_empty() {
        info!("[BRIDGE] Device external ID: {}", external_id);
        config.device_external_id = external_id;
    }

    // mqtt_service_enabled aus tedge config lesen
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
