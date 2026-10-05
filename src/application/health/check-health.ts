export interface HealthStatus {
  status: "ok" | "degraded";
  database: "ready" | "unavailable";
}

export async function checkHealth(
  checkDatabase: () => Promise<boolean>,
): Promise<HealthStatus> {
  try {
    const ready = await checkDatabase();

    return ready
      ? { status: "ok", database: "ready" }
      : { status: "degraded", database: "unavailable" };
  } catch {
    return { status: "degraded", database: "unavailable" };
  }
}
