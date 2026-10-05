import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabaseConnection, getDatabaseConnection } from "./client";

const { db } = getDatabaseConnection();

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("TokenMeter database migrations applied.");
} finally {
  await closeDatabaseConnection();
}
