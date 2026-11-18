import { createApp } from "./app.js";
import { config } from "./config.js";
import { db } from "./db/knex.js";
import { migrationConfig } from "./db/migrator.js";

// Apply any pending schema migrations on boot so the database is always up to date.
const [, applied] = await db.migrate.latest(migrationConfig);
if (applied.length) console.log(`Applied migrations: ${applied.join(", ")}`);

const server = createApp().listen(config.port, () => {
  console.log(`MediSlot API listening on http://localhost:${config.port} (db: ${config.db.client}, tz: ${config.timezone})`);
});

const shutdown = () => {
  server.close(() => db.destroy().then(() => process.exit(0)));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
