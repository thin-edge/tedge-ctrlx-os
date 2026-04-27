# Troubleshooting

Common issues and how to resolve them.

---

## Table of Contents

1. [Cloud Connection Issues](#1-cloud-connection-issues)
2. [Certificate Problems](#2-certificate-problems)
3. [Service Not Starting](#3-service-not-starting)
4. [Web UI Not Loading](#4-web-ui-not-loading)
5. [ctrlX Data Layer Bridge Issues](#5-ctrlx-data-layer-bridge-issues)
6. [Directory / Permission Issues](#6-directory--permission-issues)
7. [License Issues](#7-license-issues)
8. [Log Locations](#8-log-locations)

---

## 1. Cloud Connection Issues

**Symptom**: Connection Status shows the `c8y` bridge as 🔴 or ⚫ after clicking Connect.

```bash
# Test cloud connectivity
ctrlx-cumulocity-thin-edge-io.tedge connect c8y --test

# Show current configuration (check URL and port)
ctrlx-cumulocity-thin-edge-io.tedge config list

# Check bridge state via MQTT
snap logs ctrlx-cumulocity-thin-edge-io.mosquitto -f
```

**Common causes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Connection refused` on port 8883 | Wrong tenant URL | Re-check URL in Cloud Configuration |
| `TLS handshake error` | Certificate not uploaded to tenant | Upload certificate first (Device Certificate section) |
| Bridge shows `0` in status | Certificate CN mismatch | Recreate certificate with correct device ID |
| Port 9883 connects but data not received | MQTT Service not enabled in tenant | Enable MQTT Service in Cumulocity tenant settings |

---

## 2. Certificate Problems

```bash
# Show certificate details
ctrlx-cumulocity-thin-edge-io.tedge cert show

# Recreate certificate with auto-detected device ID
sudo ctrlx-cumulocity-thin-edge-io.manage-device-id recreate

# Check certificate file exists
ls -la /var/snap/ctrlx-cumulocity-thin-edge-io/common/package-certificates/thin-edge-io/tedge/own/certs/
```

**Certificate not created**: Run `sudo ctrlx-cumulocity-thin-edge-io.manage-device-id create`.

**Certificate expired**: Click **Update** in the Device Certificate section of the web UI, then **Upload** again.

**Upload fails**: Ensure the Cumulocity user has `Device management` permissions to manage trusted certificates.

---

## 3. Service Not Starting

```bash
# Check service status
snap services ctrlx-cumulocity-thin-edge-io

# View live logs for a specific service
snap logs ctrlx-cumulocity-thin-edge-io.tedge-agent -f
snap logs ctrlx-cumulocity-thin-edge-io.webserver -f
snap logs ctrlx-cumulocity-thin-edge-io.tedge-datalayer-bridge -f
snap logs ctrlx-cumulocity-thin-edge-io.mosquitto -f

# Restart all services
snap restart ctrlx-cumulocity-thin-edge-io

# Restart a single service
snap restart ctrlx-cumulocity-thin-edge-io.tedge-agent
```

**Mosquitto fails to start**: Usually indicates a corrupted `mosquitto.conf`. Reset it:

```bash
snap restart ctrlx-cumulocity-thin-edge-io.setup-directories
snap restart ctrlx-cumulocity-thin-edge-io.mosquitto
```

**tedge-agent crashes on startup**: Check if `tedge.toml` paths are valid after a snap update. The `post-refresh` hook should fix this automatically, but can be re-triggered:

```bash
snap restart ctrlx-cumulocity-thin-edge-io
```

---

## 4. Web UI Not Loading

**Symptom**: `https://<device-ip>/thin-edge-io/` shows a 502 or blank page.

```bash
# Check if the webserver service is running
snap services ctrlx-cumulocity-thin-edge-io | grep webserver

# View webserver logs
snap logs ctrlx-cumulocity-thin-edge-io.webserver -f

# Restart webserver
snap restart ctrlx-cumulocity-thin-edge-io.webserver
```

**Port conflict**: The webserver listens on `127.0.0.1:8888`. If the port is in use:

```bash
ss -tlnp | grep 8888
```

**ctrlX proxy not routing**: Verify the snap is visible in the ctrlX app bar. If not, the `package-manifest.json` registration may have failed — reinstall the snap.

---

## 5. ctrlX Data Layer Bridge Issues

**Symptom**: Bridge shows 🔴 or data is not appearing in Cumulocity.

```bash
# View bridge logs
snap logs ctrlx-cumulocity-thin-edge-io.tedge-datalayer-bridge -f
```

**Common causes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` | Wrong credentials in Connection Settings | Update username/password in the web UI |
| `certificate verify failed` | Self-signed cert on ctrlX | Enable **Accept Invalid Certs** in Connection Settings |
| Node path returns empty | Path does not exist in Data Layer | Use Node Browser to find the correct path |
| Data published but not in C8y | Wrong MQTT topic format for selected port | Check topic prefix matches the active port (8883 vs 9883) |
| Bridge disabled | Toggle is off | Enable bridge in Connection Settings and save |

---

## 6. Directory / Permission Issues

The snap uses `$SNAP_DATA` (per-revision path) for runtime data. After a snap update, paths are re-configured automatically via the `post-refresh` hook.

**Expected directory structure after install:**

```
$SNAP_DATA/tedge/run/          → tedge run.path
$SNAP_DATA/tedge/tmp/          → tedge tmp.path
$SNAP_DATA/tedge/log-plugins/
$SNAP_DATA/tedge/sm-plugins/
    apt  → $SNAP/bin/tedge-apt-plugin
    snap → $SNAP/scripts/sm-plugins/tedge-snap-plugin
$SNAP_DATA/tedge/.agent/
$SNAP_DATA/mosquitto/
$SNAP_DATA/log-levels/
```

If directories are missing after an update:

```bash
# Trigger directory re-initialization manually
snap restart ctrlx-cumulocity-thin-edge-io.setup-directories
snap restart ctrlx-cumulocity-thin-edge-io
```

---

## 7. License Issues

**Symptom**: Red warning banner appears at the top of the web UI.

The snap requires a ctrlX OS license with the `DATALAYER` capability:

- **Required**: `SWL-XCx-RUN-DLACCESSNRTxx-NNNN`
- **Trial** (no purchase required): `SWL_XCR_ENGINEERING_4H` (4-hour engineering license)

```bash
# Check license status via API
curl -s http://localhost:8888/thin-edge-io/api/license-status
```

Open the **ctrlX Licensing** section in the web UI → click **Manage Licenses** to open the ctrlX License Manager.

---

## 8. Log Locations

| Service | Log file |
|---------|----------|
| `tedge-agent` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/tedge-agent.log` |
| `tedge-mapper-c8y` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/tedge-mapper.log` |
| `tedge-datalayer-bridge` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/tedge-datalayer-bridge.log` |
| `mosquitto` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/mosquitto.log` |
| `webserver` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/tedge-web-config.log` |
| `log-upload-manager` | `/var/snap/ctrlx-cumulocity-thin-edge-io/common/tedge/log/tedge-log-upload-manager.log` |

All logs are also accessible via the **Logs & Diagnostics** section in the web UI or via `snap logs <service> -f`.
