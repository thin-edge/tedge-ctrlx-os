# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

This repo packages [thin-edge.io](https://thin-edge.io) as a **ctrlX AUTOMATION** snap
app for Bosch ctrlX CORE (arm64) and ctrlX COREvirtual (amd64) devices. It bundles the
upstream thin-edge.io binaries (built from a pinned source commit) together with two
custom Rust services and a web-based configuration UI.

## Directory Structure

```
snap/                    # snapcraft.yaml (parts/apps/services), hooks/
web-server-rust/         # Actix-web config UI + RBAC — src/main.rs (one large file)
bridge-service-rust/     # ctrlX Data Layer bridge + log-upload-manager (two [[bin]]s)
web/www/                 # Frontend source (HTML/JS/LESS), synced into web-server-rust/www
scripts/                 # Build/lint/runtime wrapper scripts
docs/                    # architecture, api-reference, building, troubleshooting, roadmap
configs/                 # caddyfile, package-manifest.json, build-info.txt
package-assets/          # ctrlX Store assets (icons, i18n, proxy config)
artifacts/               # Store submission bundles (generated, not hand-edited)
```

## Commands

```sh
./setup-and-build-all.sh [--fix]   # THE build entry point: env setup, frontend build,
                                    # format+clippy for both crates, version bump,
                                    # snapcraft build for amd64 AND arm64
./scripts/check-format.sh [--fix]  # standalone lint/format gate (rustfmt, clippy -D
                                    # warnings, prettier, eslint) — matches CI exactly
./scripts/build-artifacts.sh       # assembles the ctrlX World Portal submission bundle
snapcraft clean                    # clean snapcraft build state
snap install <file>.snap --dangerous   # install a locally-built snap for testing
```

**Gotcha:** `docs/building.md` and `.vscode/tasks.json` reference `build-snap-amd64.sh`
and `build-snap-arm64.sh` — **these scripts do not exist in this repo**. The only real,
working build entry point is `setup-and-build-all.sh`; CI
(`.github/workflows/build.yml`) calls `snapcraft --destructive-mode --target-arch=<arch>`
directly. Don't invent or "restore" the missing scripts — fix the stale references
instead if you're touching that doc/task config.

## Architecture

- **No Cargo workspace.** `web-server-rust/` (bin `tedge-web-config`) and
  `bridge-service-rust/` (bins `tedge-datalayer-bridge` and `tedge-log-upload-manager`)
  are independent crates with separate `Cargo.lock`s.
- **Shared file via raw path include, not a shared lib crate.**
  `web-server-rust/src/main.rs` does:
  ```rust
  #[path = "../../bridge-service-rust/src/datalayer.rs"]
  pub mod datalayer;
  ```
  There is one physical `datalayer.rs` but two separate compilation units. When changing
  Data Layer types/logic, remember both crates recompile it independently — check both
  build before assuming a change is safe.
- `web-server-rust/src/main.rs` is a single ~5000+ line file (no submodules) with ~80
  async handlers. Don't be surprised by its size; this is the existing structure, not
  a sign something's missing.

## RBAC / Handler Pattern (web-server-rust)

Every HTTP handler in `main.rs` follows the same template (see `extract_user_info` around
line 573, and e.g. `add_datalayer_mapping` around line 439):

```rust
async fn some_handler(req: HttpRequest, /* body/data */) -> Result<HttpResponse> {
    let (_user, role, _token) = extract_user_info(&req);
    if !role.can_write() {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
    }
    // ... business logic against AppState ...
    Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
}
```

Routes are registered in `main()`'s nested scope tree (`web::scope("/thin-edge-io")` →
`web::scope("/api")`, around line 5195). **Every new/changed endpoint must get a matching
entry (method, scope, description) added to `docs/api-reference.md`** — that file is
otherwise accurate and should stay so. See `docs/auth-integration.md` for the
role/scope model (`thin-edge-io.rwx/rw/r` → Admin/Editor/Viewer via Caddy-injected
`X-WEBAUTH-USER`/`X-WEBAUTH-ROLE` headers).

## Testing

**There is no automated test suite.** No `#[test]`/`#[cfg(test)]` exists in either Rust
crate, and CI runs no test job. Testing is a fully manual ~2-3h on-device checklist in
`docs/test-setup-description.md` (install → configure → scenario walkthrough → pass/fail
table). Do not assume `cargo test` (or its absence) says anything about correctness here;
manual verification against a real or virtual ctrlX device is the actual bar.

## Versioning

`snap/snapcraft.yaml`'s `version:` field (plus its `source-commit`, the pinned upstream
thin-edge.io commit) is the intended single source of truth. `autotag.yml`/`release.yml`
bump and tag it automatically from CI. `Cargo.toml` versions (in both Rust crates) and
`configs/package-manifest.json`'s version are unrelated/static — **do not bump them to
match the app version**; they track different things (crate version, ctrlX manifest
schema version).

## Known Gotchas

- Stale build script references (`build-snap-amd64.sh`/`arm64.sh`) in docs and
  `.vscode/tasks.json` — see Commands section above.
- `docs/architecture-overview.md`'s "Known Limitations" section can drift from reality —
  it has previously claimed ctrlX license enforcement wasn't integrated after
  `run_license_loop`/`acquire_license`/`release_license` (around line 3805 in `main.rs`)
  had already implemented it. Cross-check doc claims against code before repeating them.
- The dominant recurring bug class (per git history and `docs/troubleshooting.md`) is
  snap-refresh/upgrade path issues: `$SNAP_DATA` permission drift, service path
  reconfiguration after refresh, mosquitto data corruption. Consider this first when
  debugging a "worked before update, broken after" report.
- `docs/roadmap.md` lists ~20 not-yet-implemented items (e.g. ctrlX Data Layer
  write-direction `tedge_to_dl`, Cumulocity child devices/Services, snap install/remove
  via cloud) — check it before assuming a feature gap is a bug.

## Commits

Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`) are used
consistently in git history, though nothing enforces the format automatically.
