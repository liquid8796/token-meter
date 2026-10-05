import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function createDatabaseConnection(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 8,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const db = drizzle(client, { schema });

  return { client, db };
}

export type DatabaseConnection = ReturnType<typeof createDatabaseConnection>;
export type TokenMeterDatabase = DatabaseConnection["db"];

let sharedConnection: DatabaseConnection | null = null;

export function getDatabaseConnection() {
  if (!sharedConnection) {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    sharedConnection = createDatabaseConnection(databaseUrl);
  }

  return sharedConnection;
}

export async function pingDatabase() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  const { db } = getDatabaseConnection();
  await db.execute(drizzleSql`select 1`);
  return true;
}

export async function closeDatabaseConnection() {
  if (!sharedConnection) {
    return;
  }

  await sharedConnection.client.end({ timeout: 5 });
  sharedConnection = null;
}
