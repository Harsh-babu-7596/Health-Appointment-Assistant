import { Router } from "express";
import { z } from "zod";
import { db, insertReturningId } from "../db/knex.js";
import { appointmentQuery, doctorQuery, mapAppointment, mapDoctor, mapPatient, patientQuery } from "../db/mappers.js";
import { hashPassword, requireAuth } from "../lib/auth.js";
import { APPOINTMENT_STATUSES } from "../lib/constants.js";
import { HttpError, idParam, isoDate, notFound, parse } from "../lib/http.js";
import { adminStats } from "../services/analytics.js";
import { updateAppointment } from "../services/scheduling.js";

export const adminRouter = Router();
adminRouter.use(requireAuth("admin"));

adminRouter.get("/stats", async (req, res) => {
  const { range } = parse(z.object({ range: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).default(30) }), req.query);
  res.json(await adminStats(range));
});

// ---------- Doctors ----------

adminRouter.get("/doctors", async (_req, res) => {
  res.json((await doctorQuery().orderBy("u.name")).map(mapDoctor));
});

const newDoctorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().trim().max(32).optional(),
  password: z.string().min(8, "Use at least 8 characters").max(100),
  specialtyId: z.number().int().positive(),
  fee: z.number().int().min(0).max(100000),
  experienceYears: z.number().int().min(0).max(70),
  bio: z.string().trim().max(1000).optional(),
});

/** Default weekly schedule for new doctors: Mon–Sat, 09:00–13:00 and 14:00–18:00, 30-minute slots. */
const defaultAvailability = [1, 2, 3, 4, 5, 6].flatMap((weekday) => [
  { weekday, start_time: "09:00", end_time: "13:00", slot_minutes: 30 },
  { weekday, start_time: "14:00", end_time: "18:00", slot_minutes: 30 },
]);

adminRouter.post("/doctors", async (req, res) => {
  const input = parse(newDoctorSchema, req.body);
  if (await db("users").where({ email: input.email }).first("id")) throw new HttpError(409, "A user with this email already exists");
  if (!(await db("specialties").where({ id: input.specialtyId }).first("id"))) throw notFound("Specialty");

  const passwordHash = await hashPassword(input.password);
  const doctorId = await db.transaction(async (trx) => {
    const userId = await insertReturningId(trx, "users", {
      role: "doctor",
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      password_hash: passwordHash,
    });
    const id = await insertReturningId(trx, "doctors", {
      user_id: userId,
      specialty_id: input.specialtyId,
      fee: input.fee,
      experience_years: input.experienceYears,
      bio: input.bio || null,
    });
    await trx("doctor_availability").insert(defaultAvailability.map((r) => ({ ...r, doctor_id: id })));
    return id;
  });
  res.status(201).json(mapDoctor(await doctorQuery().where("d.id", doctorId).first()));
});

const updateDoctorSchema = z.object({
  fee: z.number().int().min(0).max(100000).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  isAccepting: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specialtyId: z.number().int().positive().optional(),
  phone: z.string().trim().max(32).nullable().optional(),
});

adminRouter.patch("/doctors/:id", async (req, res) => {
  const id = idParam(req.params.id);
  const input = parse(updateDoctorSchema, req.body);
  const existing = await db("doctors").where({ id }).first("user_id");
  if (!existing) throw notFound("Doctor");

  const patch: Record<string, unknown> = {};
  if (input.fee !== undefined) patch.fee = input.fee;
  if (input.experienceYears !== undefined) patch.experience_years = input.experienceYears;
  if (input.bio !== undefined) patch.bio = input.bio || null;
  if (input.isAccepting !== undefined) patch.is_accepting = input.isAccepting;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.specialtyId !== undefined) patch.specialty_id = input.specialtyId;

  await db.transaction(async (trx) => {
    if (Object.keys(patch).length) await trx("doctors").where({ id }).update(patch);
    if (input.phone !== undefined) await trx("users").where({ id: existing.user_id }).update({ phone: input.phone || null });
  });
  res.json(mapDoctor(await doctorQuery().where("d.id", id).first()));
});

adminRouter.post("/specialties", async (req, res) => {
  const { name } = parse(z.object({ name: z.string().trim().min(2).max(80) }), req.body);
  const id = await insertReturningId(db, "specialties", { name });
  res.status(201).json({ id, name, doctorCount: 0 });
});

// ---------- Patients ----------

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.get("/patients", async (req, res) => {
  const { search, page, pageSize } = parse(pageSchema.extend({ search: z.string().trim().max(80).optional() }), req.query);

  const base = db("patients as p").join("users as u", "u.id", "p.user_id");
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    base.where((w) => w.whereRaw("lower(u.name) like ?", [like]).orWhereRaw("lower(u.email) like ?", [like]).orWhere("u.phone", "like", like));
  }
  const [{ c: total }] = await base.clone().count("* as c");

  const ids = (await base.clone().select("p.id").orderBy("u.created_at", "desc").orderBy("p.id", "desc").limit(pageSize).offset((page - 1) * pageSize)).map((r) => r.id);
  const rows = ids.length ? await patientQuery().whereIn("p.id", ids) : [];
  const stats = ids.length
    ? await db("appointments")
        .whereIn("patient_id", ids)
        .whereNot("status", "cancelled")
        .select("patient_id")
        .count("* as c")
        .max({ last: db.raw("CASE WHEN status = 'completed' THEN date END") })
        .groupBy("patient_id")
    : [];
  const statMap = new Map(stats.map((s) => [Number(s.patient_id), s]));
  const byId = new Map(rows.map((r) => [Number(r.id), r]));

  res.json({
    total: Number(total),
    items: ids.map((id) => {
      const s = statMap.get(Number(id));
      return { ...mapPatient(byId.get(Number(id))), appointmentCount: Number(s?.c ?? 0), lastVisit: s?.last ?? null };
    }),
  });
});

// ---------- Appointments ----------

adminRouter.get("/appointments", async (req, res) => {
  const { from, to, status, doctorId, page, pageSize } = parse(
    pageSchema.extend({
      from: isoDate.optional(),
      to: isoDate.optional(),
      status: z.enum(APPOINTMENT_STATUSES).optional(),
      doctorId: z.coerce.number().int().positive().optional(),
    }),
    req.query,
  );
  const q = appointmentQuery();
  if (from) q.where("a.date", ">=", from);
  if (to) q.where("a.date", "<=", to);
  if (status) q.where("a.status", status);
  if (doctorId) q.where("a.doctor_id", doctorId);

  const [{ c: total }] = await q.clone().clearSelect().clearOrder().count("* as c");
  const rows = await q
    .orderBy([
      { column: "a.date", order: "desc" },
      { column: "a.start_time", order: "desc" },
    ])
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  res.json({ total: Number(total), items: rows.map(mapAppointment) });
});

adminRouter.patch("/appointments/:id", async (req, res) => {
  const input = parse(
    z.object({
      status: z.enum(APPOINTMENT_STATUSES).optional(),
      notes: z.string().max(5000).nullable().optional(),
      prescription: z.string().max(5000).nullable().optional(),
    }),
    req.body,
  );
  res.json(await updateAppointment(idParam(req.params.id), input));
});
