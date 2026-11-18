import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { doctorQuery, mapDoctor } from "../db/mappers.js";
import { idParam, isoDate, notFound, parse } from "../lib/http.js";
import { getAvailableSlots } from "../services/scheduling.js";

/** Public endpoints: anyone can browse specialties, doctors and free slots. */
export const catalogRouter = Router();

catalogRouter.get("/specialties", async (_req, res) => {
  const rows = await db("specialties as s")
    .leftJoin("doctors as d", function () {
      this.on("d.specialty_id", "=", "s.id").andOn("d.is_active", "=", db.raw("?", [true]));
    })
    .select("s.id", "s.name")
    .count("d.id as doctor_count")
    .groupBy("s.id", "s.name")
    .orderBy("s.name");
  res.json(rows.map((r) => ({ id: r.id, name: r.name, doctorCount: Number(r.doctor_count) })));
});

const listSchema = z.object({
  specialtyId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(80).optional(),
});

catalogRouter.get("/doctors", async (req, res) => {
  const { specialtyId, search } = parse(listSchema, req.query);
  const q = doctorQuery().where("d.is_active", true).orderBy("u.name");
  if (specialtyId) q.where("d.specialty_id", specialtyId);
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    q.where((w) => w.whereRaw("lower(u.name) like ?", [like]).orWhereRaw("lower(s.name) like ?", [like]));
  }
  res.json((await q).map(mapDoctor));
});

catalogRouter.get("/doctors/:id", async (req, res) => {
  const row = await doctorQuery().where("d.id", idParam(req.params.id)).where("d.is_active", true).first();
  if (!row) throw notFound("Doctor");
  res.json(mapDoctor(row));
});

catalogRouter.get("/doctors/:id/slots", async (req, res) => {
  const { date } = parse(z.object({ date: isoDate }), req.query);
  res.json(await getAvailableSlots(idParam(req.params.id), date));
});
