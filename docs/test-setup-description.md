# ctrlX Cumulocity thin-edge.io App - Test Setup Description

**App Name**: ctrlx-cumulocity-thin-edge-io  
**Version**: 0.1.0  
**Date**: May 2026  

---

## 1. Test Environment

### 1.1 Hardware Setup
- **Device**: ctrlX CORE or ctrlX COREvirtual
- **CPU Architecture**: amd64 (virtual) or arm64 (hardware)
- **RAM**: Minimum 1 GB available
- **Storage**: Minimum 500 MB free space
- **Network**: Active Ethernet connection with internet access

### 1.2 Software Requirements
- **ctrlX OS**: Version 1.20 or higher
- **Snap Support**: Enabled (default on ctrlX OS)

### 1.3 Cloud Platform Account
One of the following cloud platforms must be available for testing:
- **Cumulocity IoT**: Tenant URL and credentials
- **AWS IoT Core**: AWS account with IoT Core enabled
- **Azure IoT Hub**: Azure subscription with IoT Hub created

---

## 2. Installation for Testing

### 2.1 Download Snap Package

Download the appropriate snap file:
- For ctrlX COREvirtual: `ctrlx-cumulocity-thin-edge-io_0.1.0_amd64.snap`
- For ctrlX CORE: `ctrlx-cumulocity-thin-edge-io_0.1.0_arm64.snap`

### 2.2 Install App

1. Open ctrlX CORE web interface (https://<device-ip>)
2. Login with administrator credentials
3. Navigate to **Settings → Apps**
4. Click the **Service Mode** switch
5. Click **Install from file**
6. Select the snap file
7. Wait for installation (typically 2-3 minutes)
8. Switch back to **Operation Mode**

### 2.3 Verify Installation

Via SSH or web terminal:
```bash
snap list ctrlx-cumulocity-thin-edge-io
snap services ctrlx-cumulocity-thin-edge-io
```

Expected: App installed, all services in "inactive" state (normal before configuration).

---

## 3. Basic Configuration

### 3.1 Access Device

Connect via SSH:
```bash
ssh -p 8022 rexroot@<device-ip>
# Default password: rexroot
```

### 3.2 Configure for Cumulocity IoT (Example)

```bash
# Set Cumulocity tenant
ctrlx-cumulocity-thin-edge-io.tedge config set c8y.url your-tenant.cumulocity.com

# Set device ID
ctrlx-cumulocity-thin-edge-io.tedge config set device.id test-ctrlx-device-001

# Create certificate
ctrlx-cumulocity-thin-edge-io.tedge cert create --device-id test-ctrlx-device-001

# Show certificate thumbprint for cloud registration
ctrlx-cumulocity-thin-edge-io.tedge cert show
```

### 3.3 Register Device in Cloud

#### Cumulocity IoT:
1. Login to Cumulocity web interface
2. Navigate to **Device Management → Device Registration**
3. Click **Register Device**
4. Select **General Device Registration**
5. Enter device ID: `test-ctrlx-device-001`
6. Click **Next**, then **Accept**

---

## 4. Connection Tests

### 4.1 Test Cloud Connection

```bash
# Test connection to Cumulocity
ctrlx-cumulocity-thin-edge-io.tedge connect c8y --test
```

Expected output:
```
Connecting to c8y cloud...
Connection test successful.
```

### 4.2 Establish Connection

```bash
# Connect to cloud
ctrlx-cumulocity-thin-edge-io.tedge connect c8y
```

Expected: Services start automatically.

### 4.3 Verify Service Status

```bash
snap services ctrlx-cumulocity-thin-edge-io
```

Expected output:
```
Service                              Startup  Current   Notes
ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-agent             enabled  active    -
ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-mapper-c8y        enabled  active    -
ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-watchdog          enabled  active    -
```

---

## 5. Functional Tests

### 5.1 Test 1: Send Measurement

**Purpose**: Verify data transmission to cloud

**Steps**:
```bash
ctrlx-cumulocity-thin-edge-io.tedge mqtt pub te/device/main///m/ '{
  "temperature": 23.5,
  "humidity": 45.2
}'
```

**Expected Result**:
- No error messages
- Data appears in Cumulocity device page within 10 seconds
- Check: Device Management → Devices → test-ctrlx-device-001 → Measurements

**Success Criteria**: ✅ Temperature and humidity values visible in cloud

---

### 5.2 Test 2: Send Event

**Purpose**: Verify event transmission

**Steps**:
```bash
ctrlx-cumulocity-thin-edge-io.tedge mqtt pub te/device/main///e/status '{
  "text": "Test event from ctrlX",
  "time": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
}'
```

**Expected Result**:
- Event appears in cloud within 10 seconds
- Check: Events tab in device view

**Success Criteria**: ✅ Event visible with correct text and timestamp

---

### 5.3 Test 3: Service Monitoring

**Purpose**: Verify watchdog functionality

**Steps**:
```bash
# Check watchdog is running
snap services ctrlx-cumulocity-ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-watchdog

# View watchdog logs
snap logs ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-watchdog -n 20
```

**Expected Result**:
- Service shows as "active"
- Logs show periodic health checks
- No error messages

**Success Criteria**: ✅ Watchdog monitors services correctly

---

### 5.4 Test 4: Service Restart

**Purpose**: Verify automatic recovery

**Steps**:
```bash
# Manually stop agent
snap stop ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-agent

# Wait 15 seconds
sleep 15

# Check if restarted
snap services ctrlx-cumulocity-ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-agent
```

**Expected Result**:
- Service automatically restarts
- Status shows "active"

**Success Criteria**: ✅ Service recovers automatically

---

### 5.5 Test 5: Configuration Persistence

**Purpose**: Verify config survives reboot

**Steps**:
```bash
# Note current configuration
ctrlx-cumulocity-thin-edge-io.tedge config list | grep c8y.url

# Reboot device
sudo reboot

# After reboot, SSH back and check
ctrlx-cumulocity-thin-edge-io.tedge config list | grep c8y.url
snap services ctrlx-cumulocity-thin-edge-io
```

**Expected Result**:
- Configuration unchanged
- Services start automatically
- Connection maintained

**Success Criteria**: ✅ Config persists, services auto-start

---

### 5.6 Test 6: Plugin Functionality

**Purpose**: Test plugin execution

**Steps**:
```bash
# Test snap plugin (software management)
ctrlx-cumulocity-thin-edge-io.tedge-snap-plugin list

# Test file config plugin
ctrlx-cumulocity-thin-edge-io.tedge-file-config-plugin --help
```

**Expected Result**:
- Snap plugin lists installed snaps
- File config plugin shows help text

**Success Criteria**: ✅ All plugins accessible and functional

---

## 6. Performance Tests

### 6.1 Load Test: Multiple Measurements

**Purpose**: Verify handling of message bursts

**Steps**:
```bash
# Send 100 measurements
for i in {1..100}; do
  ctrlx-cumulocity-thin-edge-io.tedge mqtt pub te/device/main///m/ "{\"test\":$i}"
  sleep 0.1
done
```

**Expected Result**:
- All messages processed
- No service crashes
- Cloud receives all measurements

**Success Criteria**: ✅ 100 measurements in cloud (allow 1-2% loss)

---

### 6.2 Resource Usage Test

**Purpose**: Verify resource consumption

**Steps**:
```bash
# Check memory before
free -h

# Run for 1 hour with periodic measurements
# Check resources again
snap info ctrlx-cumulocity-thin-edge-io
```

**Expected Result**:
- Memory usage: <150 MB
- CPU usage: <10% average
- No memory leaks

**Success Criteria**: ✅ Resource usage within acceptable limits

---

## 7. Error Handling Tests

### 7.1 Test: Network Disconnect

**Purpose**: Verify behavior during network outage

**Steps**:
```bash
# Disconnect network (if possible) or block port 8883
# Wait 2 minutes
# Reconnect network
# Check logs
snap logs ctrlx-cumulocity-ctrlx-cumulocity-thin-edge-io.tedge-mapper-c8y -n 50
```

**Expected Result**:
- App detects disconnect
- Logs show reconnection attempts
- Automatically reconnects when network available
- No data loss (buffered messages sent)

**Success Criteria**: ✅ Graceful handling, automatic recovery

---

### 7.2 Test: Invalid Configuration

**Purpose**: Verify error handling

**Steps**:
```bash
# Set invalid cloud URL
ctrlx-cumulocity-thin-edge-io.tedge config set c8y.url invalid-url

# Try to connect
ctrlx-cumulocity-thin-edge-io.tedge connect c8y
```

**Expected Result**:
- Clear error message
- Service doesn't crash
- Can reconfigure with valid URL

**Success Criteria**: ✅ Proper error handling, no crashes

---

## 8. Security Tests

### 8.1 Certificate Validation

**Purpose**: Verify certificate-based auth

**Steps**:
```bash
# Show certificate
ctrlx-cumulocity-thin-edge-io.tedge cert show

# Verify it matches in cloud
# Try connecting without proper cloud registration
```

**Expected Result**:
- Certificate properly formatted
- Connection fails if not registered in cloud
- TLS handshake succeeds when properly registered

**Success Criteria**: ✅ Only authenticated devices connect

---

### 8.2 Permission Test

**Purpose**: Verify snap confinement

**Steps**:
```bash
# Check snap interfaces
snap connections ctrlx-cumulocity-thin-edge-io

# Verify limited file system access
snap run --shell ctrlx-cumulocity-thin-edge-io.tedge
# Try to access /etc/shadow (should fail)
```

**Expected Result**:
- Limited interfaces connected
- Cannot access system files outside snap
- Proper confinement in place

**Success Criteria**: ✅ Restricted access, secure confinement

---

## 9. Upgrade/Downgrade Tests

(Not applicable for initial release)

---

## 10. Uninstallation Test

### 10.1 Clean Removal

**Purpose**: Verify complete uninstall

**Steps**:
```bash
# Save current data directory size
du -sh /var/snap/ctrlx-cumulocity-thin-edge-io

# Uninstall
snap remove ctrlx-cumulocity-thin-edge-io

# Check for remnants
find /var/snap -name "*thin-edge*"
find /snap -name "*thin-edge*"
```

**Expected Result**:
- App removed cleanly
- User data in /var/snap preserved (by design)
- No running processes

**Success Criteria**: ✅ Clean uninstall, data preserved for reinstall

---

## 11. Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 5.1 | Send Measurement | ⬜ | |
| 5.2 | Send Event | ⬜ | |
| 5.3 | Service Monitoring | ⬜ | |
| 5.4 | Service Restart | ⬜ | |
| 5.5 | Config Persistence | ⬜ | |
| 5.6 | Plugin Functionality | ⬜ | |
| 6.1 | Load Test | ⬜ | |
| 6.2 | Resource Usage | ⬜ | |
| 7.1 | Network Disconnect | ⬜ | |
| 7.2 | Invalid Config | ⬜ | |
| 8.1 | Certificate Validation | ⬜ | |
| 8.2 | Permission Test | ⬜ | |
| 10.1 | Uninstallation | ⬜ | |

Legend: ✅ Pass | ❌ Fail | ⚠️ Warning | ⬜ Not Tested

---

## 12. Known Limitations in Test

1. **Cloud Platform**: Tests assume Cumulocity IoT; adjust for AWS/Azure
2. **Network**: Some tests require network control capabilities
3. **Permissions**: Some tests need sudo access
4. **Time**: Full test suite takes approximately 2-3 hours

---

## 13. Test Environment Cleanup

After testing:
```bash
# Disconnect from cloud
ctrlx-cumulocity-thin-edge-io.tedge disconnect c8y

# Remove device from cloud portal
# (Manual step in cloud interface)

# Uninstall app (optional)
snap remove ctrlx-cumulocity-thin-edge-io
```

---

## 14. Contact for Test Support

- Issues during testing: https://github.com/thin-edge/thin-edge.io/issues
- Questions: info@thin-edge.io
- Discord: https://discord.com/invite/sVX3B8nj5d

---

**End of Test Setup Description**
