# Building from Source

This guide covers building the **ctrlX Cumulocity thin-edge.io** snap from source for both supported architectures.

---

## Table of Contents

1. [Automated Build (Recommended)](#1-automated-build-recommended)
2. [Manual Build](#2-manual-build)
3. [Frontend Development](#3-frontend-development)
4. [Build Scripts Reference](#4-build-scripts-reference)

---

## 1. Automated Build (Recommended)

```bash
git clone https://github.com/thin-edge/tedge-ctrlx-os.git
cd tedge-ctrlx-os
./setup-and-build-all.sh --fix
```

This script installs all required dependencies (Rust toolchain, Snapcraft) and builds snaps for both architectures.

> **Note**: The first build takes 15–30 minutes as it compiles all Rust dependencies from source. Subsequent builds are much faster due to caching.

---

## 2. Manual Build

### Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.94

# Snapcraft
sudo snap install snapcraft --classic

# System dependencies (Ubuntu / Debian)
sudo apt-get install pkg-config libssl-dev libsqlite3-dev
```

### Build

```bash
# ctrlX COREvirtual — x86-64
./build-snap-amd64.sh

# ctrlX CORE hardware — ARM64
# Requires an arm64 build environment or cross-compilation setup
./build-snap-arm64.sh
```

The resulting `.snap` files are placed in the project root.

### Format Check

Before committing, run the format checker to avoid CI failures:

```bash
./scripts/check-format.sh
```

This checks:
- `cargo fmt --check` for both Rust crates
- Any other configured format rules

---

## 3. Frontend Development

The frontend source lives in `web/www/`:

| File | Description |
|------|-------------|
| `web/www/index.html` | Main HTML structure |
| `web/www/app.js` | All application logic (i18n, API calls, UI state) |
| `web/www/styles.css` | Compiled CSS (edit `styles.less` if using Less) |

After editing, sync to the Rust web server's served directory:

```bash
cp web/www/app.js web/www/index.html web/www/styles.css web-server-rust/www/
```

> **Warning — CSS variable replacement**: A CSS formatter (e.g. Prettier, VS Code format-on-save) may replace `var(--brand-primary)` and other CSS custom properties with hardcoded hex values, which breaks theming. After any formatter run, verify with:
>
> ```bash
> grep -n "86efac\|4ade80\|FDC000" web-server-rust/www/styles.css
> ```
>
> If matches are found, revert those substitutions manually or re-copy from the `.less` source.

---

## 4. Build Scripts Reference

| Script | Description |
|--------|-------------|
| `setup-and-build-all.sh` | Full automated build: installs deps, builds both architectures |
| `build-snap-amd64.sh` | Build snap for ctrlX COREvirtual (amd64) |
| `build-snap-arm64.sh` | Build snap for ctrlX CORE hardware (arm64) |
| `scripts/check-format.sh` | Check code formatting (`cargo fmt --check`) |
| `scripts/clean.sh` | Remove build artifacts (`parts/`, `prime/`, `stage/`, `*.snap`) |
| `scripts/setup-directories.sh` | Snap startup: initialize required directories |
| `scripts/manage-device-id.sh` | Device ID and certificate management |
| `scripts/tedge-service-wrapper.sh` | Service wrapper: reads log level from `$SNAP_DATA/log-levels/<service>` |
| `scripts/setup-config.sh` | Interactive configuration helper |
| `scripts/connect-wrapper.sh` | Snap-aware tedge connect/disconnect (sets `mqtt.bridge.built_in=true`) |
| `scripts/watchdog-wrapper.sh` | Health monitoring wrapper |
| `scripts/webserver-wrapper.sh` | Webserver starter (reads log level from `$SNAP_DATA/log-levels/webserver`) |
| `scripts/mosquitto-wrapper.sh` | Mosquitto MQTT broker wrapper |
| `scripts/update-inventory.sh` | Inventory update script |
| `scripts/show-build-info.sh` | Print build information |

### Repository Structure

```
tedge-ctrlx-os/
├── snap/
│   ├── snapcraft.yaml          # Snap build definition
│   └── hooks/                  # install, configure, post-refresh, remove hooks
├── web-server-rust/            # Actix-web backend (Rust)
│   ├── src/main.rs             # REST API + license enforcement loop
│   └── www/                    # Served static files (sync from web/www/)
├── bridge-service-rust/        # ctrlX Data Layer bridge (Rust)
│   └── src/datalayer.rs        # Datalayer polling + MQTT publish + transforms
├── web/www/                    # Frontend source (edit here, then sync)
├── scripts/                    # Runtime helper scripts
├── configs/                    # App metadata (caddyfile, package-manifest.json)
├── package-assets/             # ctrlX Store assets (icons, i18n, proxy config)
└── docs/                       # Documentation
```
