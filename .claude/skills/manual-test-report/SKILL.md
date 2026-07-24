---
name: manual-test-report
description: Walk through the manual on-device test checklist and produce a filled pass/fail report. Use when the user has run (or wants to run) manual verification against a ctrlX CORE or COREvirtual device and needs a test report.
---

This repo has no automated test suite — `docs/test-setup-description.md` is a fully
manual ~2-3h on-device checklist. This skill turns a testing session into a filled
report matching that doc's structure.

**Steps**

1. **Read `docs/test-setup-description.md`** to get the current numbered scenario list
   (typically: install, cloud/cert configuration, send measurement, send event, service
   restart, reboot persistence, network disconnect recovery, certificate validation,
   snap strict-confinement checks, uninstall).

2. **Establish context** — ask the user (if not already given):
   - Device under test: ctrlX CORE (arm64) or ctrlX COREvirtual (amd64)?
   - App version / `.snap` file tested, and the thin-edge.io `source-commit` it was
     built from (`snap/snapcraft.yaml`).
   - Cloud target used (Cumulocity / AWS / Azure) and tenant/environment.

3. **Walk each scenario**: either ask the user for the pass/fail outcome and any notes
   for each one they already ran, or — if driving the session interactively over
   SSH/console against the target device — execute the documented steps yourself and
   record the actual result.

4. **Produce the report**, matching the pass/fail table structure in
   `docs/test-setup-description.md` §11: scenario name, result (pass/fail/skipped),
   notes/evidence (log excerpt, screenshot reference, error message) for any failure.

5. **Flag deviations**: if a scenario in the doc no longer matches the current UI/API
   (e.g. a renamed button, moved config screen), note it separately so the doc can be
   updated — don't silently adapt the report to match stale documentation.

**Notes**

- This produces a report artifact for the user, not a code change. Don't invent
  automated test code as a substitute — the project's actual QA bar is this manual
  process.
