import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { db } from "./db/knex.js";
import { errorHandler } from "./lib/http.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { doctorRouter } from "./routes/doctor.js";
import { patientRouter } from "./routes/patient.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigins.includes("*") ? true : config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (_req, res) => {
    await db.raw("select 1");
    res.json({ ok: true, db: config.db.client });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api/patient", patientRouter);
  app.use("/api/doctor", doctorRouter);
  app.use("/api/admin", adminRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });
  app.use(errorHandler);
  return app;
}
