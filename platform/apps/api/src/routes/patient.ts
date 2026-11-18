import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { appointmentQuery, mapAppointment, mapPatient, patientQuery } from "../db/mappers.js";
import { profileIdOf, requireAuth } from "../lib/auth.js";
import { GENDERS } from "../lib/constants.js";
import { hhmm, idParam, isoDate, parse } from "../lib/http.js";
import { bookAppointment, updateAppointment } from "../services/scheduling.js";
import { clinicNow } from "../lib/time.js";
import { HttpError } from "../lib/http.js";

export const patientRouter = Router();
patientRouter.use(requireAuth("patient"));

patientRouter.get("/profile", async (req, res) => {
  res.json(mapPatient(await patientQuery().where("p.id", profileIdOf(req)).first()));
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  dob: isoDate.nullable().optional(),
  gender: z.enum(GENDERS).nullable().optional(),
  bloodGroup: z.string().trim().max(5).nullable().optional(),
  allergies: z.string().trim().max(500).nullable().optional(),
});

patientRouter.patch("/profile", async (req, res) => {
  const input = parse(profileSchema, req.body);
  const patientId = profileIdOf(req);
  const { user_id } = await db("patients").where({ id: patientId }).first("user_id");

  await db.transaction(async (trx) => {
    const userPatch: Record<string, unknown> = {};
    if (input.name !== undefined) userPatch.name = input.name;
    if (input.phone !== undefined) userPatch.phone = input.phone || null;
    if (Object.keys(userPatch).length) await trx("users").where({ id: user_id }).update(userPatch);

    const patientPatch: Record<string, unknown> = {};
    if (input.dob !== undefined) patientPatch.dob = input.dob;
    if (input.gender !== undefined) patientPatch.gender = input.gender;
    if (input.bloodGroup !== undefined) patientPatch.blood_group = input.bloodGroup || null;
    if (input.allergies !== undefined) patientPatch.allergies = input.allergies || null;
    if (Object.keys(patientPatch).length) await trx("patients").where({ id: patientId }).update(patientPatch);
  });

  res.json(mapPatient(await patientQuery().where("p.id", patientId).first()));
});

patientRouter.get("/appointments", async (req, res) => {
  const rows = await appointmentQuery().where("a.patient_id", profileIdOf(req)).orderBy([
    { column: "a.date", order: "desc" },
    { column: "a.start_time", order: "desc" },
  ]);
  res.json(rows.map(mapAppointment));
});

const bookSchema = z.object({
  doctorId: z.number().int().positive(),
  date: isoDate,
  startTime: hhmm,
  reason: z.string().trim().max(500).optional(),
});

patientRouter.post("/appointments", async (req, res) => {
  const input = parse(bookSchema, req.body);
  res.status(201).json(await bookAppointment({ ...input, patientId: profileIdOf(req) }));
});

patientRouter.post("/appointments/:id/cancel", async (req, res) => {
  const id = idParam(req.params.id);
  const patientId = profileIdOf(req);
  const appt = await db("appointments").where({ id, patient_id: patientId }).first("date", "start_time", "status");
  const now = clinicNow();
  if (appt && (appt.date < now.date || (appt.date === now.date && appt.start_time <= now.time))) {
    throw new HttpError(409, "This appointment has already started and can't be cancelled online. Please call the clinic.");
  }
  res.json(await updateAppointment(id, { status: "cancelled" }, { patientId }));
});
