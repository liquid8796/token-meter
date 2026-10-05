import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("native OCI deployment assets", () => {
  it("ships all required native deployment files", () => {
    for (const path of [
      "ops/token-meter.service",
      "ops/token-meter.caddy",
      "ops/deploy.ps1",
      "ops/release.sh",
      "ops/bootstrap.sql",
    ]) {
      expect(existsSync(resolve(ROOT, path)), `${path} should exist`).toBe(true);
    }
  });

  it("hardens systemd and binds Next.js only to localhost:3002", () => {
    const unit = read("ops/token-meter.service");

    expect(unit).toContain("User=token-meter");
    expect(unit).toContain("EnvironmentFile=/opt/token-meter/shared/.env");
    expect(unit).toContain("--hostname 127.0.0.1 --port 3002");
    expect(unit).toContain("NoNewPrivileges=true");
    expect(unit).toContain("PrivateTmp=true");
    expect(unit).toContain("ProtectSystem=strict");
  });

  it("routes the production hostname through Caddy to localhost:3002", () => {
    const caddy = read("ops/token-meter.caddy");

    expect(caddy).toContain("token-meter.158.180.59.36.sslip.io");
    expect(caddy).toContain("reverse_proxy 127.0.0.1:3002");
  });

  it("uses release directories with health-gated rollback", () => {
    const release = read("ops/release.sh");

    expect(release).toContain("/opt/token-meter/releases");
    expect(release).toContain("/opt/token-meter/current");
    expect(release).toContain("/api/health");
    expect(release).toContain("rollback");
  });

  it("orchestrates SSH deployment and always unwinds its local repo location", () => {
    const deploy = read("ops/deploy.ps1");

    expect(deploy).toContain("scp -i $SshKey");
    expect(deploy).toContain("ssh -i $SshKey");
    expect(deploy).toContain("$pushed = $true");
    expect(deploy).toContain("if ($pushed) { Pop-Location");
  });
  it("does not introduce container deployment artifacts", () => {
    for (const path of ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"]) {
      expect(existsSync(resolve(ROOT, path)), `${path} must stay absent`).toBe(false);
    }
  });
});