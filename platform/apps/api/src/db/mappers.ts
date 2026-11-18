import type { Appointment, Doctor, PatientProfile, User } from "@medislot/shared";
import type { Knex } from "knex";
import { db } from "./knex.js";

/** SQLite returns timestamps as "YYYY-MM-DD HH:MM:SS" (UTC) strings, Postgres as Date objects. */
export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z").toISOString();
  return new Date().toISOString();
}

type Row = Record<string, any>;

export const mapUser = (r: Row): User => ({
  id: r.id,
  role: r.role,
  name: r.name,
  email: r.email,
  phone: r.phone ?? null,
  createdAt: toIso(r.created_at),
});

export const doctorColumns = [
  "d.id",
  "d.user_id",
  "u.name",
  "u.email",
  "u.phone",
  "d.specialty_id",
  "s.name as specialty",
  "d.bio",
  "d.experience_years",
  "d.fee",
  "d.is_accepting",
  "d.is_active",
];

export const doctorQuery = (k: Knex | Knex.Transaction = db) =>
  k("doctors as d").join("users as u", "u.id", "d.user_id").join("specialties as s", "s.id", "d.specialty_id").select(doctorColumns);

export const mapDoctor = (r: Row): Doctor => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  email: r.email,
  phone: r.phone ?? null,
  specialtyId: r.specialty_id,
  specialty: r.specialty,
  bio: r.bio ?? null,
  experienceYears: Number(r.experience_years),
  fee: Number(r.fee),
  isAccepting: Boolean(r.is_accepting),
  isActive: Boolean(r.is_active),
});

export const patientQuery = (k: Knex | Knex.Transaction = db) =>
  k("patients as p")
    .join("users as u", "u.id", "p.user_id")
    .select("p.id", "p.user_id", "u.name", "u.email", "u.phone", "p.dob", "p.gender", "p.blood_group", "p.allergies", "u.created_at");

export const mapPatient = (r: Row): PatientProfile => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  email: r.email,
  phone: r.phone ?? null,
  dob: r.dob ?? null,
  gender: r.gender ?? null,
  bloodGroup: r.blood_group ?? null,
  allergies: r.allergies ?? null,
  createdAt: toIso(r.created_at),
});

/** Appointments joined with patient + doctor names, ready to map with `mapAppointment`. */
export const appointmentQuery = (k: Knex | Knex.Transaction = db) =>
  k("appointments as a")
    .join("patients as p", "p.id", "a.patient_id")
    .join("users as pu", "pu.id", "p.user_id")
    .join("doctors as d", "d.id", "a.doctor_id")
    .join("users as du", "du.id", "d.user_id")
    .join("specialties as s", "s.id", "d.specialty_id")
    .select(
      "a.*",
      "pu.name as patient_name",
      "pu.email as patient_email",
      "pu.phone as patient_phone",
      "p.dob as patient_dob",
      "p.gender as patient_gender",
      "p.allergies as patient_allergies",
      "du.name as doctor_name",
      "s.name as doctor_specialty",
    );

export const mapAppointment = (r: Row): Appointment => ({
  id: r.id,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  status: r.status,
  reason: r.reason ?? null,
  notes: r.notes ?? null,
  prescription: r.prescription ?? null,
  fee: Number(r.fee),
  createdAt: toIso(r.created_at),
  patient: {
    id: r.patient_id,
    name: r.patient_name,
    email: r.patient_email,
    phone: r.patient_phone ?? null,
    dob: r.patient_dob ?? null,
    gender: r.patient_gender ?? null,
    allergies: r.patient_allergies ?? null,
  },
  doctor: { id: r.doctor_id, name: r.doctor_name, specialty: r.doctor_specialty },
});

export async function getAppointment(id: number, k: Knex | Knex.Transaction = db): Promise<Appointment | null> {
  const row = await appointmentQuery(k).where("a.id", id).first();
  return row ? mapAppointment(row) : null;
}
