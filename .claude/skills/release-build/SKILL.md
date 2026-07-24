---
name: release-build
description: Build, package, and prep a release of the ctrlX AUTOMATION thin-edge.io snap app (amd64 + arm64). Use when the user wants to cut a build, produce a .snap for testing, or prepare a Store submission.
---

Run the build/package pipeline for this snap app.

**Steps**

1. **Confirm the version bump.** `./setup-and-build-all.sh` auto-bumps the *patch*
   version and `source-commit` in `snap/snapcraft.yaml`. If the user wants a minor/major
   bump instead, edit `snap/snapcraft.yaml`'s `version:` field manually first — don't
   rely on the script for that.

2. **Run the build**:

   ```sh
   ./setup-and-build-all.sh          # or with --fix to auto-fix prettier issues first
   ```

   This installs/checks the Rust + snapcraft toolchain, rebuilds the frontend
   (`web/www/styles.less` → `.css`, synced into `web-server-rust/www/`), runs
   `cargo clippy --all-targets --all-features -- -D warnings` + `cargo fmt` +
   `rustfmt --check` for both `bridge-service-rust` and `web-server-rust`, bumps the
   version, then runs `snapcraft pack --destructive-mode --build-for=amd64` and again
   with `--build-for=arm64`. Output is tee'd to `logs/build-all-<timestamp>.log`.

3. **Verify output**: confirm both `.snap` files were produced (repo root, one per
   arch). If the script reports a failure, check the referenced build log for the
   actual failing step (frontend build, clippy, rustfmt, or snapcraft itself).

4. **For a Store submission bundle**, run:

   ```sh
   ./scripts/build-artifacts.sh
   ```

   This assembles `artifacts/thin-edge-io/<version>/{disclosure,build-info,
   documentation,app-states,snaps}` for the Bosch ctrlX World Portal.

5. **Report** the produced `.snap` paths and the version released.

**Notes**

- CI (`.github/workflows/release.yml`) runs the equivalent build on tag push and
  creates a GitHub Release with both `.snap` files. Prefer tagging for an official
  release; use this local pipeline for manual/verification builds.
- Do **not** create or rely on `build-snap-amd64.sh` / `build-snap-arm64.sh`, or the
  matching `.vscode/tasks.json` entries — those referenced scripts don't exist in this
  repo. `setup-and-build-all.sh` is the only real entry point.
- Don't bump `Cargo.toml` versions or `configs/package-manifest.json`'s version to
  match — they track unrelated things (crate version, ctrlX manifest schema version).
- `snapcraft` is installed unpinned (`latest/stable`) everywhere it's used. A future
  upstream snapcraft CLI change can break the build command shown above the same way
  the 9.0 release did in 2026-07 (dropped the legacy `--target-arch`/
  `--enable-manifest` flags for `snapcraft pack --build-for=<arch>`) — if the build
  step fails with "unrecognized arguments", check `snapcraft --version` and its
  current `pack --help` before assuming the code changed.
