import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | null = null;
let db: Database | null = null;

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  if (!db) {
    pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export { schema };
