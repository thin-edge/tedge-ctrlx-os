---
name: format-and-lint
description: Run the repo's format/lint gate (rustfmt, clippy, prettier, eslint) before a commit or PR. Use when the user wants to check or fix formatting/lint issues, or verify CI's lint job will pass.
---

Run the standalone formatting/lint check — this is exactly the gate CI runs in
`.github/workflows/build.yml`, so passing it locally means that part of CI will pass too.

**Steps**

1. Run:

   ```sh
   ./scripts/check-format.sh          # check only
   ./scripts/check-format.sh --fix    # auto-fix what can be auto-fixed
   ```

   This runs, in order:
   - `rustfmt --check` on `bridge-service-rust` and `web-server-rust`
   - `cargo clippy --all-targets --all-features -- -D warnings` for both crates
   - `prettier --check` (or `--write` with `--fix`) on `web/www/*.js,*.html`
   - `eslint` on `web/www/*.js` (requires Node ≥16; skipped if unavailable)

2. If clippy or rustfmt fails, fix the reported issues directly in the Rust source
   (`cargo fmt` locally can also auto-fix formatting-only issues, but clippy warnings
   need real code changes since CI runs `-D warnings`).

3. If prettier/eslint fails, re-run with `--fix` first, then review any remaining
   eslint errors that can't be auto-fixed.

4. Re-run `./scripts/check-format.sh` (no `--fix`) to confirm a clean pass before
   committing.

**Notes**

- There is no shellcheck step, and no automated Rust test suite runs as part of this
  gate or CI — this script only covers formatting/linting, not correctness.
- `./setup-and-build-all.sh` runs the same clippy/rustfmt/prettier steps internally as
  part of a full build; use `check-format.sh` directly when you just want the fast
  lint gate without a full snapcraft build.
