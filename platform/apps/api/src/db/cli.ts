/**
 * Database commands:
 *   npm run db:migrate   apply pending migrations
 *   npm run db:rollback  undo the last batch of migrations
 *   npm run db:seed      wipe all data and load demo data
 *   npm run db:reset     drop everything, re-run migrations, load demo data
 */
import { config } from "../config.js";
import { db } from "./knex.js";
import { migrationConfig } from "./migrator.js";
import { DEMO_ACCOUNTS, seed } from "./seed.js";

const command = process.argv[2];

async function runSeed() {
  if (config.isProduction && process.env.ALLOW_SEED !== "true") {
    throw new Error("Refusing to seed in production (this deletes all data). Set ALLOW_SEED=true to override.");
  }
  const counts = await seed(db);
  console.log(`Seeded ${counts.doctors} doctors, ${counts.patients} patients, ${counts.appointments} appointments.`);
  console.log("\nDemo logins:");
  for (const [role, acc] of Object.entries(DEMO_ACCOUNTS)) console.log(`  ${role.padEnd(8)} ${acc.email}  /  ${acc.password}`);
}

try {
  switch (command) {
    case "migrate": {
      const [, applied] = await db.migrate.latest(migrationConfig);
      console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
      break;
    }
    case "rollback": {
      const [, undone] = await db.migrate.rollback(migrationConfig);
      console.log(undone.length ? `Rolled back: ${undone.join(", ")}` : "Nothing to roll back.");
      break;
    }
    case "seed":
      await db.migrate.latest(migrationConfig);
      await runSeed();
      break;
    case "reset":
      await db.migrate.rollback(migrationConfig, true);
      await db.migrate.latest(migrationConfig);
      await runSeed();
      break;
    default:
      console.log("Usage: tsx src/db/cli.ts <migrate|rollback|seed|reset>");
      process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
