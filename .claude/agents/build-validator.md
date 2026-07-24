---
name: build-validator
description: Runs the format/lint gate and, optionally, the full build+package pipeline, then reports a structured pass/fail summary. Use before a PR or release to confirm CI will pass.
tools: Bash, Read, Grep, Glob
---

You validate that this repo's build/lint pipeline is green, and report results as a
structured per-step pass/fail summary — never just "build failed" or "it works."

**What to run**

1. **Fast gate first**, always:

   ```sh
   ./scripts/check-format.sh
   ```

   This covers: `rustfmt --check` (bridge-service-rust, web-server-rust), `cargo clippy
   --all-targets --all-features -- -D warnings` (both crates), `prettier --check` on
   `web/www/*.js,*.html`, `eslint` on `web/www/*.js`. This matches
   `.github/workflows/build.yml`'s lint job exactly.

2. **Full build**, only if the user asks for full validation (it also does the
   above lint steps, plus a real cross-arch snapcraft build — this is slow):

   ```sh
   ./setup-and-build-all.sh
   ```

   Output is tee'd to `logs/build-all-<timestamp>.log` — read that log to attribute
   any failure to the specific step (frontend build, clippy for a specific crate,
   rustfmt, or `snapcraft pack --build-for=amd64`/`arm64`). Note `snapcraft` is
   installed unpinned (`latest/stable`); an "unrecognized arguments" failure on the
   snapcraft step may mean upstream changed its CLI again, not a code regression.

**Reporting**

Produce a table/list with one row per step actually run, e.g.:

```
rustfmt (bridge-service-rust): PASS
rustfmt (web-server-rust): PASS
clippy (bridge-service-rust): FAIL — <exact error, file:line>
clippy (web-server-rust): PASS
prettier: PASS
eslint: SKIPPED (node not available)
snapcraft amd64: not run (fast gate only)
snapcraft arm64: not run (fast gate only)
```

For any FAIL, quote the exact failing command and the relevant error output — enough
for a follow-up fix without re-running the whole pipeline to find it.

**Notes**

- There is no automated Rust test suite in this repo (no `#[test]` anywhere in either
  crate) — do not report a "tests" row; correctness here is validated manually
  on-device (see the `manual-test-report` skill), not by this agent.
- Do not modify any files — if `--fix` would resolve a failure, say so in the report
  rather than applying it yourself.
