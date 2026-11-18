import type { ErrorRequestHandler } from "express";
import { z, type ZodType } from "zod";
import { isUniqueViolation } from "../db/knex.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found`);

/** Validates `input` against a zod schema, throwing a 400 with field errors on failure. */
export function parse<T extends ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, "Please check the highlighted fields", z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

export const idParam = (value: unknown) => parse(z.coerce.number().int().positive(), value);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (isUniqueViolation(err)) {
    res.status(409).json({ error: "That record already exists" });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
};
