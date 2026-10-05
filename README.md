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
