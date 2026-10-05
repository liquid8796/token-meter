import { checkHealth } from "@/application/health/check-health";
import { pingDatabase } from "@/infrastructure/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkHealth(pingDatabase);

  return Response.json(health, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
