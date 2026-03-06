#!/bin/bash
# Testscript für Snap: Webserver- und tedge-Tests

set -e

SNAP_TEDGE="/snap/bin/thin-edge-io.tedge"
LOGFILE="test-snap-tedge.log"
echo "\nAlle Webserver und tedge-Kommandos getestet. Siehe $LOGFILE für Details."

# --- Snap installieren, falls nicht vorhanden (jetzt am Ende) ---
echo "===== Snap-Installation prüfen =====" | tee -a "$LOGFILE"
if ! snap list | grep -q thin-edge-io; then
    SNAP_FILE=$(ls -1t ../thin-edge-io_*.snap 2>/dev/null | head -n1)
    if [ -z "$SNAP_FILE" ]; then
        echo "[FEHLER] Kein Snap-Paket (thin-edge-io_*.snap) im übergeordneten Verzeichnis gefunden!" | tee -a "$LOGFILE"
        exit 1
    fi
    echo "Installiere Snap: $SNAP_FILE" | tee -a "$LOGFILE"
    sudo snap install --dangerous "$SNAP_FILE" | tee -a "$LOGFILE"
else
    echo "Snap thin-edge-io ist bereits installiert." | tee -a "$LOGFILE"
fi

# --- Snap run/stop Test für tedge CLI ---
echo "===== Snap run/stop Test für tedge CLI =====" | tee -a "$LOGFILE"

# Starte tedge CLI einmal mit snap run (z.B. --help)
echo "Starte: snap run thin-edge-io.tedge --help" | tee -a "$LOGFILE"
snap run thin-edge-io.tedge --help >> "$LOGFILE" 2>&1 && echo "[OK] snap run thin-edge-io.tedge --help" | tee -a "$LOGFILE" || echo "[FEHLER] snap run thin-edge-io.tedge --help" | tee -a "$LOGFILE"

# Stoppe ggf. laufende App (CLI ist kurzlebig, aber für Services relevant)
echo "Stoppe: snap stop thin-edge-io.tedge (falls laufend)" | tee -a "$LOGFILE"
snap stop thin-edge-io.tedge >> "$LOGFILE" 2>&1 || echo "(Nicht laufend oder nicht stoppbar)" | tee -a "$LOGFILE"



# Rust-Webserver-Service prüfen (Snap-Service)
if snap services thin-edge-io.webserver-rust | grep -q "active"; then
    echo "[OK] Snap-Service thin-edge-io.webserver-rust läuft." | tee -a "$LOGFILE"
else
    echo "[WARN] Snap-Service thin-edge-io.webserver-rust läuft nicht. Versuche zu starten..." | tee -a "$LOGFILE"
    if snap start thin-edge-io.webserver-rust >> "$LOGFILE" 2>&1; then
        echo "[OK] Snap-Service thin-edge-io.webserver-rust wurde gestartet." | tee -a "$LOGFILE"
        sleep 2
    else
        echo "[FEHLER] Snap-Service thin-edge-io.webserver-rust konnte nicht gestartet werden!" | tee -a "$LOGFILE"
    fi
fi

# ctrlX-Webserver-Service prüfen (Snap-Service)
if snap services thin-edge-io.webserver | grep -q "active"; then
    echo "[OK] Snap-Service thin-edge-io.webserver läuft." | tee -a "$LOGFILE"
else
    echo "[WARN] Snap-Service thin-edge-io.webserver läuft nicht. Versuche zu starten..." | tee -a "$LOGFILE"
    if snap start thin-edge-io.webserver >> "$LOGFILE" 2>&1; then
        echo "[OK] Snap-Service thin-edge-io.webserver wurde gestartet." | tee -a "$LOGFILE"
        sleep 2
    else
        echo "[FEHLER] Snap-Service thin-edge-io.webserver konnte nicht gestartet werden!" | tee -a "$LOGFILE"
    fi
fi


# 2. Rust-Webserver (Port 8888)
echo -e "\n--- Test: Rust-Webserver (Port 8888) ---" | tee -a "$LOGFILE"
curl -v --max-time 5 http://localhost:8888/ 2>&1 | tee -a "$LOGFILE"

# 3. ctrlX-Webserver (Port 8443, self-signed, ignore cert)
echo -e "\n--- Test: ctrlX-Webserver (Port 8443, /, self-signed) ---" | tee -a "$LOGFILE"
curl -vk --max-time 5 https://localhost:8443/ 2>&1 | tee -a "$LOGFILE"

echo -e "\n===== tedge-Befehle Test =====" | tee -a "$LOGFILE"

# Liste der tedge-Kommandos (angepasst an aktuelle Version)
COMMANDS=(
    "--help"
    "--version"
    "config list"
    "config get mqtt.client.host"
    "config get mqtt.client.port"
    # MQTT Publish/Subscribe Test
    "mqtt pub test/topic 'snap-test-message'"
    "mqtt sub --count 1 test/topic"
    "cert show"
    # cert create nur, wenn keine vorhanden ist
    "cert remove" # Hinweis: benötigt evtl. sudo
    "connect c8y --help"
    "disconnect c8y"
    "connect az --help"
    "disconnect az"
    "connect aws --help"
    "disconnect aws"
    "help"
)

for CMD in "${COMMANDS[@]}"; do
    echo "\n--- tedge $CMD ---" | tee -a "$LOGFILE"
    if [[ "$CMD" == "mqtt sub --count 1 test/topic" ]]; then
        # Vorher Publish ausführen
        $SNAP_TEDGE mqtt pub test/topic "snap-test-message" >> "$LOGFILE" 2>&1
        # Subscribe mit Timeout
        if timeout 7s $SNAP_TEDGE $CMD >> "$LOGFILE" 2>&1; then
            echo "[OK] tedge $CMD (mit Timeout und vorherigem Publish)" | tee -a "$LOGFILE"
        else
            echo "[FEHLER] tedge $CMD (Timeout oder Fehler)" | tee -a "$LOGFILE"
        fi
    elif [[ "$CMD" == "cert remove" ]]; then
        echo "[Hinweis] cert remove benötigt evtl. sudo-Berechtigung." | tee -a "$LOGFILE"
        if sudo $SNAP_TEDGE $CMD >> "$LOGFILE" 2>&1; then
            echo "[OK] tedge $CMD (sudo)" | tee -a "$LOGFILE"
        else
            echo "[FEHLER] tedge $CMD (sudo)" | tee -a "$LOGFILE"
        fi
    else
        if $SNAP_TEDGE $CMD >> "$LOGFILE" 2>&1; then
            echo "[OK] tedge $CMD" | tee -a "$LOGFILE"
        else
            echo "[FEHLER] tedge $CMD" | tee -a "$LOGFILE"
        fi
    fi
    sleep 1
done

# --- Mosquitto/MQTT-Tests ---
echo -e "\n===== Mosquitto/MQTT-Tests =====" | tee -a "$LOGFILE"

# 1. Service-Status prüfen
if systemctl status snap.thin-edge-io.mosquitto.service > /dev/null 2>&1; then
    echo "[OK] Mosquitto-Service läuft." | tee -a "$LOGFILE"
else
    echo "[FEHLER] Mosquitto-Service läuft nicht!" | tee -a "$LOGFILE"
fi

# 2. Publish/Subscribe Test
MOSQ_PUB="/snap/bin/thin-edge-io.mosquitto_pub"
MOSQ_SUB="/snap/bin/thin-edge-io.mosquitto_sub"
if [ ! -x "$MOSQ_PUB" ] || [ ! -x "$MOSQ_SUB" ]; then
    echo "[FEHLER] mosquitto_pub/sub nicht im Snap enthalten! MQTT-Test übersprungen." | tee -a "$LOGFILE"
else
    # Mosquitto-Tools robust prüfen
    MOSQ_PUB="/snap/bin/thin-edge-io.mosquitto_pub"
    MOSQ_SUB="/snap/bin/thin-edge-io.mosquitto_sub"
    if [ ! -x "$MOSQ_PUB" ] || [ ! -x "$MOSQ_SUB" ]; then
        echo "[FEHLER] mosquitto_pub/sub nicht im Snap enthalten! MQTT-Test übersprungen." | tee -a "$LOGFILE"
    else
        # Starte Subscriber im Hintergrund
        $MOSQ_SUB -h localhost -p 1883 -t "$TEST_TOPIC" -C 1 --qos 1 > mosq_sub_result.txt 2>&1 &
        SUB_PID=$!
        sleep 1

        # Publish
        $MOSQ_PUB -h localhost -p 1883 -t "$TEST_TOPIC" -m "$TEST_MSG" --qos 1 2>&1 | tee -a "$LOGFILE"

        # Warte auf Subscriber
        wait $SUB_PID

        if grep -q "$TEST_MSG" mosq_sub_result.txt; then
            echo "[OK] Mosquitto Publish/Subscribe erfolgreich." | tee -a "$LOGFILE"
        else
            echo "[FEHLER] Mosquitto Publish/Subscribe fehlgeschlagen!" | tee -a "$LOGFILE"
            cat mosq_sub_result.txt | tee -a "$LOGFILE"
        fi
    fi
fi

rm -f mosq_sub_result.txt

echo "\nAlle Webserver und tedge-Kommandos getestet. Siehe $LOGFILE für Details."
