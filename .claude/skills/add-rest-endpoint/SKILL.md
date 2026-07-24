---
name: add-rest-endpoint
description: Scaffold a new REST endpoint in web-server-rust following the existing RBAC handler pattern. Use when the user wants to add a new API route to the config webserver.
---

Add a new endpoint to `web-server-rust/src/main.rs` following the repo's existing,
consistent pattern (~80 handlers already use this shape).

**Steps**

1. **Write the handler**, following the template (see `extract_user_info` around line
   573, and e.g. `add_datalayer_mapping` around line 439 for a full example):

   ```rust
   async fn some_new_handler(
       req: HttpRequest,
       body: web::Json<SomeType>,       // if the request has a body
       data: web::Data<AppState>,
   ) -> Result<HttpResponse> {
       let (_user, role, _token) = extract_user_info(&req);
       if !role.can_write() {           // or can_read() / can_execute() as appropriate
           return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error": "Forbidden"})));
       }
       // ... business logic, typically load/save via AppState ...
       Ok(HttpResponse::Ok().json(serde_json::json!({"success": true})))
   }
   ```

2. **Register the route** in `main()`'s nested scope tree (`web::scope("/thin-edge-io")`
   → `web::scope("/api")`, around line 5195):

   ```rust
   .route("/your/new/path", web::post().to(some_new_handler))
   ```

3. **Update `docs/api-reference.md`** with a matching entry: method, scope
   (`r`/`rw`/`rwx`), and description. This file is otherwise kept accurate — don't let
   a new endpoint go undocumented.

4. **Run the `format-and-lint` skill** before committing (rustfmt + clippy must pass
   with `-D warnings`).

5. **Verify manually** — there is no automated test infrastructure in this repo. Use
   the curl-based recipes in `docs/auth-integration.md` against the dev TCP bind or the
   Unix socket (`$SNAP_DATA/package-run/thin-edge-io/web.sock` on a real device) to
   exercise the new endpoint with each role (Admin/Editor/Viewer) and confirm the RBAC
   gate behaves as intended.

**Notes**

- Both `add-rest-endpoint`'s data layer touches and the web-server itself may involve
  `bridge-service-rust/src/datalayer.rs`, which is shared into `web-server-rust` via a
  `#[path = ...]` include rather than a proper crate dependency — if your endpoint
  touches Data Layer types, check both crates still compile.
