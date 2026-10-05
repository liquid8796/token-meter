# TokenMeter

TokenMeter is a source-backed AI model/API cost calculator. It compares current provider pricing against a workload while preserving the provider source and verification date behind every price.

## Local development

```bash
npm install
npm run dev
```

Quality gates:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Production deployment intentionally uses the existing OCI VM convention: native Node.js under systemd, Caddy for TLS/reverse proxy, and PostgreSQL bound to localhost. Docker is not part of this project.

Architecture and implementation decisions live under `docs/superpowers/`.

## Production deployment (OCI)

Production uses the existing OCI Ubuntu VM with native Node.js, systemd, Caddy, and PostgreSQL. Docker is intentionally not used.

```powershell
powershell -ExecutionPolicy Bypass -File ops/deploy.ps1
```

Defaults:

- VM: `ubuntu@158.180.59.36`
- SSH key: `~/.ssh/jarvis_oci_ed25519`
- Host: `https://tokenmeter.site`
- App bind: `127.0.0.1:3002`
- Releases: `/opt/token-meter/releases/<release-id>` with `/opt/token-meter/current` symlink
- Secrets: `/opt/token-meter/shared/.env` (mode `0600`, never committed)

The release runner creates the dedicated `token-meter` service user and `token_meter` PostgreSQL role/database on first deploy, applies migrations and seed data, validates Caddy before reload, and only keeps the new symlink when `/api/health` reports both `status: ok` and `database: ready`. Failed health checks automatically roll back to the previous release.