import { Router } from "express";
import { z } from "zod";
import { db, insertReturningId } from "../db/knex.js";
import { mapUser } from "../db/mappers.js";
import { authOf, hashPassword, requireAuth, signToken, verifyPassword } from "../lib/auth.js";
import { ROLES } from "../lib/constants.js";
import { HttpError, parse } from "../lib/http.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
  /** The app the user is logging into. Stops e.g. a patient account from opening the admin app. */
  role: z.enum(ROLES),
});

authRouter.post("/login", async (req, res) => {
  const { email, password, role } = parse(loginSchema, req.body);
  const user = await db("users").where({ email }).first();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Incorrect email or password");
  }
  if (user.role !== role) throw new HttpError(403, `This is a ${user.role} account. Please use the ${user.role} app.`);
  if (role === "doctor") {
    const doc = await db("doctors").where({ user_id: user.id }).first("is_active");
    if (!doc?.is_active) throw new HttpError(403, "This doctor account has been deactivated. Contact your clinic admin.");
  }
  res.json({ token: signToken(user.id, user.role), user: mapUser(user) });
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  phone: z.string().trim().max(32).optional(),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

/** Public sign-up is for patients only. Doctors are created by admins. */
authRouter.post("/register", async (req, res) => {
  const input = parse(registerSchema, req.body);
  if (await db("users").where({ email: input.email }).first("id")) {
    throw new HttpError(409, "An account with this email already exists. Try logging in.");
  }
  const passwordHash = await hashPassword(input.password);
  const userId = await db.transaction(async (trx) => {
    const id = await insertReturningId(trx, "users", {
      role: "patient",
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      password_hash: passwordHash,
    });
    await trx("patients").insert({ user_id: id });
    return id;
  });
  const user = await db("users").where({ id: userId }).first();
  res.status(201).json({ token: signToken(userId, "patient"), user: mapUser(user) });
});

authRouter.get("/me", requireAuth(), async (req, res) => {
  const user = await db("users").where({ id: authOf(req).userId }).first();
  res.json({ user: mapUser(user) });
});
