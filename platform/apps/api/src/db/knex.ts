import fs from "node:fs";
import path from "node:path";
import knexFactory, { type Knex } from "knex";
import { config } from "../config.js";

function buildConfig(): Knex.Config {
  if (config.db.client === "postgres") {
    return {
      client: "pg",
      connection: { connectionString: config.db.url, ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined },
      pool: { min: 0, max: 10 },
    };
  }

  const file = path.resolve(config.db.sqliteFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return {
    client: "better-sqlite3",
    connection: { filename: file },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: { pragma: (s: string) => void }, done: (err: Error | null, conn: unknown) => void) => {
        conn.pragma("foreign_keys = ON");
        conn.pragma("journal_mode = WAL");
        done(null, conn);
      },
    },
  };
}

export const db = knexFactory(buildConfig());

const UNIQUE_VIOLATION_CODES = new Set(["23505", "SQLITE_CONSTRAINT_UNIQUE", "SQLITE_CONSTRAINT_PRIMARYKEY"]);

export const isUniqueViolation = (err: unknown) =>
  typeof err === "object" && err !== null && UNIQUE_VIOLATION_CODES.has(String((err as { code?: unknown }).code));

/** Inserts a row and returns its new id on both SQLite and Postgres. */
export async function insertReturningId(trx: Knex | Knex.Transaction, table: string, row: Record<string, unknown>): Promise<number> {
  const [result] = await trx(table).insert(row).returning("id");
  return Number(typeof result === "object" ? result.id : result);
}
