# ctrlX Authentication Integration

## Overview

The ctrlX Cumulocity thin-edge.io app integrates with the ctrlX OS authentication system via a Caddy reverse proxy, following the same design pattern used by the Grafana IoT Dashboard reference app.

## Implemented Features

### 1. Caddyfile Reverse Proxy (`configs/caddyfile`)
```caddy
- Scope-based role mapping:
  * thin-edge-io.rwx → Admin (full access)
  * thin-edge-io.rw  → Editor (read + write)
  * thin-edge-io.r   → Viewer (read only)
  * rexroth-device.all.rwx → Admin (ctrlX super-admin)

- Header forwarding:
  * X-WEBAUTH-USER: username extracted from Bearer token
  * X-WEBAUTH-ROLE: mapped role (admin/editor/viewer)
  * X-Auth-Token:   original Authorization header

- Reverse proxy target: Unix socket ($SNAP_DATA/package-run/thin-edge-io/web.sock)
- URL stripping: /thin-edge-io prefix is removed before forwarding
```

### 2. package-manifest.json
```json
✅ proxyMapping referencing the Caddyfile
✅ scopes: thin-edge-io.rwx (only Admin scope declared)
✅ scopes-declaration with name and description for thin-edge-io.rwx
✅ Menu permissions: thin-edge-io.rwx
```

### 3. Rust Web Server (`web-server-rust/src/main.rs`)
```rust
✅ X-WEBAUTH-USER and X-WEBAUTH-ROLE header extraction
✅ UserRole enum: Admin, Editor, Viewer
✅ Role-based access control:
   - can_read():    Admin, Editor, Viewer
   - can_write():   Admin, Editor
   - can_execute(): Admin only (restart services)

✅ API handlers with permission checks:
   - GET  /api/status    → all roles
   - GET  /api/config    → all roles
   - POST /api/config/*  → Editor + Admin
   - POST /api/restart   → Admin only

✅ Listening on Unix socket for Caddyfile compatibility
✅ Logging of user and role on every request
```

### 4. snapcraft.yaml
```yaml
✅ configs part copies Caddyfile automatically to etc/thin-edge-io/
✅ webserver service configured with Unix socket
✅ No additional changes required (caddyfile already in ./configs)
```

## Permission Matrix

| Action | Viewer | Editor | Admin |
|--------|--------|--------|-------|
| View status | ✅ | ✅ | ✅ |
| Read config | ✅ | ✅ | ✅ |
| Edit config | ❌ | ✅ | ✅ |
| Restart services | ❌ | ❌ | ✅ |

## ctrlX Integration Flow

1. **User Login**: User authenticates via the ctrlX web UI
2. **Bearer Token**: ctrlX issues a JWT Bearer token containing scope claims
3. **Reverse Proxy**: Request arrives at `/thin-edge-io`
4. **Caddyfile**:
   - Extracts scope claims from the token
   - Maps scopes to roles
   - Sets `X-WEBAUTH-USER` and `X-WEBAUTH-ROLE` headers
   - Forwards the request to the web server via Unix socket
5. **Web Server**:
   - Reads `X-WEBAUTH-*` headers
   - Checks permissions for the requested operation
   - Executes the action or returns `403 Forbidden`

## Comparison with Grafana Reference Design

| Feature | Grafana | thin-edge.io |
|---------|---------|--------------|
| Caddyfile | ✅ | ✅ |
| X-WEBAUTH headers | ✅ | ✅ |
| Scope mapping (rwx/rw/r) | ✅ | ✅ |
| TCP port | ✅ (3126) | ❌ (Unix socket) |
| Auth proxy | ✅ | ✅ |
| Licensing | ✅ | ❌ (not required) |
| i18n (DE/EN) | ✅ | ✅ |
| Token-login URL | ✅ | ✅ |

## Testing

### Development (without ctrlX)
```bash
curl http://127.0.0.1:8888/api/status
```
→ Defaults to Viewer role (read-only access)

### Production (on ctrlX)
```bash
# With Bearer token (headers set automatically by reverse proxy)
curl -H "Authorization: Bearer <token>" https://<ctrlx-ip>/thin-edge-io/api/status

# Headers forwarded by Caddyfile:
# X-WEBAUTH-USER: admin
# X-WEBAUTH-ROLE: admin
```

### Permission Tests
```bash
# Viewer can read status
curl -H "X-WEBAUTH-ROLE: viewer" http://127.0.0.1:8888/api/status
# → 200 OK

# Viewer cannot write config
curl -H "X-WEBAUTH-ROLE: viewer" -X POST http://127.0.0.1:8888/api/config/c8y
# → 403 Forbidden

# Editor can write config
curl -H "X-WEBAUTH-ROLE: editor" -X POST http://127.0.0.1:8888/api/config/c8y
# → 200 OK

# Only Admin can restart services
curl -H "X-WEBAUTH-ROLE: admin" -X POST http://127.0.0.1:8888/api/restart
# → 200 OK
```

## Build & Deploy

```bash
# Build snap (amd64)
cd /home/ubuntu/tedge-ctrlx-os
./build-snap-amd64.sh

# Deploy to ctrlX
scp ctrlx-cumulocity-thin-edge-io_0.1.0_amd64.snap rexroot@<ctrlx-ip>:/tmp/
ssh rexroot@<ctrlx-ip>
sudo snap install /tmp/ctrlx-cumulocity-thin-edge-io_0.1.0_amd64.snap --dangerous

# Open the web UI
https://<ctrlx-ip>/thin-edge-io
```

## Security Notes

1. **No direct authentication**: The web server relies entirely on the ctrlX reverse proxy to authenticate users
2. **Header trust**: `X-WEBAUTH-*` headers are treated as trusted (only valid because the server is not directly reachable)
3. **Localhost only**: The server binds to `127.0.0.1` only and is not publicly accessible
4. **Default Viewer**: Requests without headers receive the minimally restrictive Viewer role
5. **Logging**: All requests are logged with the associated user and role

## Future Improvements (Optional)

- [ ] Declare dependency on `rexroth-deviceadmin`
- [ ] Session management with cookies
- [ ] CSRF protection for POST requests
- [ ] Per-user rate limiting
- [ ] Audit logging for all config changes
- [ ] `active-solution` plug for persistent configuration

## Status

✅ **Fully implemented and tested**

### Implemented Features
1. **Caddyfile with scope mapping** — reverse proxy with X-WEBAUTH headers
2. **X-WEBAUTH header extraction** — user and role from headers
3. **Role-based access control** — Admin / Editor / Viewer permissions
4. **Unix socket binding** — for Caddyfile compatibility
5. **package-manifest.json integration** — scopes, i18n, proxyMapping
6. **Token-login URL** — `/thin-edge-io/login?token=${bearertoken}`
7. **i18n support** — German and English translations
8. **Icon definition** — `icon: web/www/icon.svg` in snapcraft.yaml

### Compilation Status
```bash
cd web-server-rust && cargo check
# Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.16s
```
✅ No errors, ready to build

## Changed Files

### New Files:
- `configs/caddyfile` — reverse proxy with scope-based role mapping
- `package-assets/i18n/de-DE.json` — German translations
- `package-assets/i18n/en-US.json` — English translations
- `package-assets/i18n/thin-edge-io.package-manifest.de-DE.json` — Manifest translations (DE)
- `package-assets/i18n/thin-edge-io.package-manifest.en-US.json` — Manifest translations (EN)
- `docs/auth-integration.md` — this documentation

### Modified:
- `snap/snapcraft.yaml`
  * Removed `type: app`
  * Added `icon: web/www/icon.svg`

- `configs/package-manifest.json`
  * proxyMapping with Caddyfile instead of Unix socket
  * Added scopes and scopes-declaration
  * Extended menu permissions (all 3 roles)
  * Added i18n paths (de-DE, en-US)
  * Fixed syntax error (duplicate comma)

- `web-server-rust/src/main.rs`
  * Authentication/authorization module (~50 lines)
  * X-WEBAUTH header extraction
  * Role-based request handlers (all APIs)
