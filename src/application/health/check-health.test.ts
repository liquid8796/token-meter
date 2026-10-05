import { describe, expect, it } from "vitest";

import { checkHealth } from "./check-health";

describe("checkHealth", () => {
  it("reports ready when the database check succeeds", async () => {
    await expect(checkHealth(async () => true)).resolves.toEqual({
      status: "ok",
      database: "ready",
    });
  });

  it("reports degraded without leaking an underlying database error", async () => {
    const result = await checkHealth(async () => {
      throw new Error("postgres://secret-user:secret-pass@private-host/tokenmeter");
    });

    expect(result).toEqual({ status: "degraded", database: "unavailable" });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("private-host");
  });

  it("reports degraded when the database check returns false", async () => {
    await expect(checkHealth(async () => false)).resolves.toEqual({
      status: "degraded",
      database: "unavailable",
    });
  });
});
