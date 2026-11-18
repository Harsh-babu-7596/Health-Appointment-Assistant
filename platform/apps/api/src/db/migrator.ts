import type { Knex } from "knex";
import * as m001 from "./migrations/001_initial_schema.js";

/** Add new migrations here in order. Never edit a migration that has already run in production; add a new one. */
const migrations: Record<string, Knex.Migration> = {
  "001_initial_schema": m001,
};

export const migrationConfig: Knex.MigratorConfig = {
  tableName: "knex_migrations",
  migrationSource: {
    getMigrations: async () => Object.keys(migrations),
    getMigrationName: (name: string) => name,
    getMigration: async (name: string) => migrations[name],
  },
};
