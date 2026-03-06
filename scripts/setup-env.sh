#!/bin/bash
set -euo pipefail
# Prüft und installiert Rust, Snapcraft und Build-Abhängigkeiten
# Kann als eigenständiges Setup-Skript verwendet werden


echo "[setup-env.sh] Prüfe und installiere Build-Umgebung..."

# Prüft, ob ein Befehl existiert
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

echo "=============================================="
echo "Step 1: Check and Install Rust"
echo "=============================================="

if command_exists rustc; then
	RUST_VERSION=$(rustc --version | cut -d' ' -f2)
	echo "[✓] Rust is already installed (version: $RUST_VERSION)"
	if command_exists cargo; then
		echo "[✓] Cargo is available"
	fi
else
	echo "[i] Rust not found. Installing Rust toolchain..."
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.85
	source "$HOME/.cargo/env"
	if command_exists rustc; then
		echo "[✓] Rust installed successfully: $(rustc --version)"
	else
		echo "[✗] Failed to install Rust"; exit 1
	fi
fi

if command_exists rustup; then
	echo "[i] Setting Rust 1.85 as default..."
	rustup default 1.85 || rustup install 1.85 && rustup default 1.85
	echo "[✓] Rust 1.85 is active"
fi

echo "=============================================="
echo "Step 2: Check and Install Snapcraft"
echo "=============================================="

if command_exists snapcraft; then
	SNAPCRAFT_VERSION=$(snapcraft --version 2>/dev/null || echo "unknown")
	echo "[✓] Snapcraft is already installed (version: $SNAPCRAFT_VERSION)"
else
	echo "[i] Snapcraft not found. Installing..."
	if command_exists snap; then
		sudo snap install snapcraft --classic
		if command_exists snapcraft; then
			echo "[✓] Snapcraft installed successfully"
		else
			echo "[✗] Failed to install Snapcraft"; exit 1
		fi
	else
		echo "[✗] Snap is not available on this system"; exit 1
	fi
fi

echo "=============================================="
echo "Step 3: Install Build Dependencies"
echo "=============================================="

echo "[i] Installing required build packages..."
if command_exists apt-get; then
	sudo apt-get update -qq
	sudo apt-get install -y \
		pkg-config \
		libssl-dev \
		libsqlite3-dev \
		build-essential \
		git \
		curl \
		|| echo "[!] Some packages failed to install, continuing anyway..."
	echo "[✓] Build dependencies installed"
else
	echo "[i] apt-get not available, skipping package installation"
fi
