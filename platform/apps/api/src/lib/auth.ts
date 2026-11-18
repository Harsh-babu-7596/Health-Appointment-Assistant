import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@medislot/shared";
import { config } from "../config.js";
import { db } from "../db/knex.js";
import { HttpError } from "./http.js";

export interface AuthContext {
  userId: number;
  role: Role;
  /** patients.id or doctors.id for the logged-in user (null for admins). */
  profileId: number | null;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signToken = (userId: number, role: Role) =>
  jwt.sign({ sub: String(userId), role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] });

async function resolveProfileId(userId: number, role: Role): Promise<number | null> {
  if (role === "admin") return null;
  const row = await db(role === "doctor" ? "doctors" : "patients").where({ user_id: userId }).first("id");
  return row ? Number(row.id) : null;
}

/** Requires a valid Bearer token. Pass roles to restrict access, e.g. requireAuth("admin"). */
export function requireAuth(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new HttpError(401, "Please log in");

    let payload: { sub: string; role: Role };
    try {
      payload = jwt.verify(token, config.jwtSecret) as typeof payload;
    } catch {
      throw new HttpError(401, "Your session has expired. Please log in again.");
    }

    const userId = Number(payload.sub);
    const user = await db("users").where({ id: userId }).first("id", "role");
    if (!user) throw new HttpError(401, "Account no longer exists");
    if (roles.length && !roles.includes(user.role)) throw new HttpError(403, "You don't have access to this");

    if (user.role === "doctor") {
      const doc = await db("doctors").where({ user_id: userId }).first("is_active");
      if (doc && !doc.is_active) throw new HttpError(403, "This doctor account has been deactivated");
    }

    req.auth = { userId, role: user.role, profileId: await resolveProfileId(userId, user.role) };
    next();
  };
}

export function authOf(req: Request): AuthContext {
  if (!req.auth) throw new HttpError(401, "Please log in");
  return req.auth;
}

/** Profile id for patient/doctor routes (guaranteed non-null after requireAuth("patient"|"doctor")). */
export function profileIdOf(req: Request): number {
  const id = authOf(req).profileId;
  if (id === null) throw new HttpError(403, "No profile linked to this account");
  return id;
}
