import "dotenv/config";

const env = process.env;

const dbClient = (env.DB_CLIENT ?? "sqlite").toLowerCase();
if (dbClient !== "sqlite" && dbClient !== "postgres") {
  throw new Error(`DB_CLIENT must be "sqlite" or "postgres" (got "${dbClient}")`);
}
if (dbClient === "postgres" && !env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when DB_CLIENT=postgres");
}

const isProduction = env.NODE_ENV === "production";
const jwtSecret = env.JWT_SECRET ?? "dev-only-secret";
if (isProduction && (jwtSecret === "dev-only-secret" || jwtSecret === "change-me-in-production")) {
  throw new Error("Set a strong JWT_SECRET in production");
}

export const config = {
  port: Number(env.PORT ?? 4000),
  isProduction,
  jwtSecret,
  jwtExpiresIn: env.JWT_EXPIRES_IN ?? "7d",
  corsOrigins: (env.CORS_ORIGINS ?? "*").split(",").map((s) => s.trim()),
  timezone: env.CLINIC_TIMEZONE ?? "Asia/Kolkata",
  db: {
    client: dbClient as "sqlite" | "postgres",
    sqliteFile: env.SQLITE_FILE ?? "./data/medislot.db",
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL === "true",
  },
};
