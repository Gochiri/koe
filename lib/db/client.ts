import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";
import * as vaultSchema from "./vault-schema";

/**
 * Singleton Postgres pool — survives HMR in dev by stashing on globalThis.
 */
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

if (env.NODE_ENV !== "production") globalThis.__pgPool = pool;

export const db = drizzle(pool, { schema: { ...schema, ...vaultSchema } });
export type DB = typeof db;
