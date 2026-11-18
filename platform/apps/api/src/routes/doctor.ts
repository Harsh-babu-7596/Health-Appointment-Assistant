import { Router } from "express";
import { z } from "zod";
import type { AvailabilityRule } from "@medislot/shared";
import { db } from "../db/knex.js";
import { appointmentQuery, doctorQuery, mapAppointment, mapDoctor } from "../db/mappers.js";
import { profileIdOf, requireAuth } from "../lib/auth.js";
import { APPOINTMENT_STATUSES } from "../lib/constants.js";
import { HttpError, hhmm, idParam, isoDate, parse } from "../lib/http.js";
import { clinicNow, toMinutes } from "../lib/time.js";
import { doctorStats } from "../services/analytics.js";
import { updateAppointment } from "../services/scheduling.js";

export const doctorRouter = Router();
doctorRouter.use(requireAuth("doctor"));

doctorRouter.get("/me", async (req, res) => {
  res.json(mapDoctor(await doctorQuery().where("d.id", profileIdOf(req)).first()));
});

const meSchema = z.object({
  fee: z.number().int().min(0).max(100000).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  isAccepting: z.boolean().optional(),
  phone: z.string().trim().max(32).nullable().optional(),
});

doctorRouter.patch("/me", async (req, res) => {
  const input = parse(meSchema, req.body);
  const doctorId = profileIdOf(req);
  const patch: Record<string, unknown> = {};
  if (input.fee !== undefined) patch.fee = input.fee;
  if (input.experienceYears !== undefined) patch.experience_years = input.experienceYears;
  if (input.bio !== undefined) patch.bio = input.bio || null;
  if (input.isAccepting !== undefined) patch.is_accepting = input.isAccepting;
  await db.transaction(async (trx) => {
    if (Object.keys(patch).length) await trx("doctors").where({ id: doctorId }).update(patch);
    if (input.phone !== undefined) {
      const { user_id } = await trx("doctors").where({ id: doctorId }).first("user_id");
      await trx("users").where({ id: user_id }).update({ phone: input.phone || null });
    }
  });
  res.json(mapDoctor(await doctorQuery().where("d.id", doctorId).first()));
});

doctorRouter.get("/stats", async (req, res) => {
  res.json(await doctorStats(profileIdOf(req)));
});

const listSchema = z.object({ date: isoDate.optional(), from: isoDate.optional(), to: isoDate.optional() });

doctorRouter.get("/appointments", async (req, res) => {
  const { date, from, to } = parse(listSchema, req.query);
  const q = appointmentQuery().where("a.doctor_id", profileIdOf(req)).orderBy([
    { column: "a.date", order: "asc" },
    { column: "a.start_time", order: "asc" },
  ]);
  if (from || to) {
    if (from) q.where("a.date", ">=", from);
    if (to) q.where("a.date", "<=", to);
  } else {
    q.where("a.date", date ?? clinicNow().date);
  }
  res.json((await q).map(mapAppointment));
});

const updateSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  notes: z.string().max(5000).nullable().optional(),
  prescription: z.string().max(5000).nullable().optional(),
});

doctorRouter.patch("/appointments/:id", async (req, res) => {
  const input = parse(updateSchema, req.body);
  res.json(await updateAppointment(idParam(req.params.id), input, { doctorId: profileIdOf(req) }));
});

/** A patient's visit history with this doctor only. */
doctorRouter.get("/patients/:id/appointments", async (req, res) => {
  const rows = await appointmentQuery()
    .where({ "a.patient_id": idParam(req.params.id), "a.doctor_id": profileIdOf(req) })
    .orderBy([
      { column: "a.date", order: "desc" },
      { column: "a.start_time", order: "desc" },
    ]);
  res.json(rows.map(mapAppointment));
});

const mapRule = (r: Record<string, any>): AvailabilityRule => ({
  weekday: Number(r.weekday),
  startTime: r.start_time,
  endTime: r.end_time,
  slotMinutes: Number(r.slot_minutes),
});

doctorRouter.get("/availability", async (req, res) => {
  const rows = await db("doctor_availability").where({ doctor_id: profileIdOf(req) }).orderBy(["weekday", "start_time"]);
  res.json(rows.map(mapRule));
});

const availabilitySchema = z.object({
  rules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: hhmm,
        endTime: hhmm,
        slotMinutes: z.number().int().min(5).max(240),
      }),
    )
    .max(50),
});

/** Replaces the doctor's whole weekly schedule. Existing appointments are kept. */
doctorRouter.put("/availability", async (req, res) => {
  const { rules } = parse(availabilitySchema, req.body);
  for (const r of rules) {
    if (toMinutes(r.endTime) - toMinutes(r.startTime) < r.slotMinutes) {
      throw new HttpError(400, `Each window must fit at least one ${r.slotMinutes}-minute slot (${r.startTime}–${r.endTime}).`);
    }
  }
  for (let day = 0; day <= 6; day++) {
    const windows = rules.filter((r) => r.weekday === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < windows.length; i++) {
      if (windows[i].startTime < windows[i - 1].endTime) throw new HttpError(400, "Time windows on the same day can't overlap.");
    }
  }

  const doctorId = profileIdOf(req);
  await db.transaction(async (trx) => {
    await trx("doctor_availability").where({ doctor_id: doctorId }).delete();
    if (rules.length) {
      await trx("doctor_availability").insert(
        rules.map((r) => ({ doctor_id: doctorId, weekday: r.weekday, start_time: r.startTime, end_time: r.endTime, slot_minutes: r.slotMinutes })),
      );
    }
  });
  const rows = await db("doctor_availability").where({ doctor_id: doctorId }).orderBy(["weekday", "start_time"]);
  res.json(rows.map(mapRule));
});
