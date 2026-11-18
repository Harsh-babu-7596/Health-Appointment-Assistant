import type { Knex } from "knex";
import type { Appointment, AppointmentStatus, SlotsResponse } from "@medislot/shared";
import { db, insertReturningId, isUniqueViolation } from "../db/knex.js";
import { getAppointment } from "../db/mappers.js";
import { HttpError, notFound } from "../lib/http.js";
import { addDays, clinicNow, generateSlots, weekdayOf } from "../lib/time.js";

/** How far ahead patients may book. */
export const BOOKING_WINDOW_DAYS = 60;

async function slotsForDate(doctorId: number, date: string, k: Knex | Knex.Transaction = db) {
  const rules = await k("doctor_availability").where({ doctor_id: doctorId, weekday: weekdayOf(date) });
  return generateSlots(rules);
}

export async function getAvailableSlots(doctorId: number, date: string): Promise<SlotsResponse> {
  const doctor = await db("doctors").where({ id: doctorId }).first("is_accepting", "is_active");
  if (!doctor || !doctor.is_active) throw notFound("Doctor");

  const now = clinicNow();
  if (date < now.date) return { date, slots: [], message: "This date is in the past." };
  if (date > addDays(now.date, BOOKING_WINDOW_DAYS)) return { date, slots: [], message: `Bookings open ${BOOKING_WINDOW_DAYS} days in advance.` };
  if (!doctor.is_accepting) return { date, slots: [], message: "This doctor is not accepting new bookings right now." };

  const slots = await slotsForDate(doctorId, date);
  if (!slots.length) return { date, slots: [], message: "The doctor is not available on this day." };

  const taken = new Set(
    (await db("appointments").where({ doctor_id: doctorId, date }).whereNot("status", "cancelled").pluck("start_time")) as string[],
  );

  return {
    date,
    slots: slots.map((s) => ({
      time: s.start,
      available: !taken.has(s.start) && !(date === now.date && s.start <= now.time),
    })),
  };
}

export async function bookAppointment(input: { patientId: number; doctorId: number; date: string; startTime: string; reason?: string }): Promise<Appointment> {
  const now = clinicNow();
  if (input.date < now.date || (input.date === now.date && input.startTime <= now.time)) {
    throw new HttpError(400, "That time has already passed. Please pick another slot.");
  }
  if (input.date > addDays(now.date, BOOKING_WINDOW_DAYS)) {
    throw new HttpError(400, `You can book up to ${BOOKING_WINDOW_DAYS} days in advance.`);
  }

  try {
    const id = await db.transaction(async (trx) => {
      const doctor = await trx("doctors").where({ id: input.doctorId }).first("fee", "is_accepting", "is_active");
      if (!doctor || !doctor.is_active) throw notFound("Doctor");
      if (!doctor.is_accepting) throw new HttpError(409, "This doctor is not accepting new bookings right now.");

      const slot = (await slotsForDate(input.doctorId, input.date, trx)).find((s) => s.start === input.startTime);
      if (!slot) throw new HttpError(400, "The doctor doesn't have a slot at that time.");

      const clash = await trx("appointments")
        .where({ patient_id: input.patientId, date: input.date, start_time: input.startTime })
        .whereNot("status", "cancelled")
        .first("id");
      if (clash) throw new HttpError(409, "You already have an appointment at this time.");

      return insertReturningId(trx, "appointments", {
        patient_id: input.patientId,
        doctor_id: input.doctorId,
        date: input.date,
        start_time: slot.start,
        end_time: slot.end,
        status: "booked",
        reason: input.reason?.trim() || null,
        fee: doctor.fee,
      });
    });
    return (await getAppointment(id))!;
  } catch (err) {
    // The partial unique index catches two patients racing for the same slot.
    if (isUniqueViolation(err)) throw new HttpError(409, "Sorry, that slot was just taken. Please pick another one.");
    throw err;
  }
}

/** Which status changes are allowed. Completed / cancelled / no-show are final. */
const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  booked: ["checked_in", "completed", "cancelled", "no_show"],
  checked_in: ["completed", "cancelled", "no_show", "booked"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export async function updateAppointment(
  id: number,
  changes: { status?: AppointmentStatus; notes?: string | null; prescription?: string | null },
  scope: { doctorId?: number; patientId?: number } = {},
): Promise<Appointment> {
  const current = await db("appointments").where({ id }).first();
  if (!current) throw notFound("Appointment");
  if (scope.doctorId !== undefined && current.doctor_id !== scope.doctorId) throw notFound("Appointment");
  if (scope.patientId !== undefined && current.patient_id !== scope.patientId) throw notFound("Appointment");

  const patch: Record<string, unknown> = { updated_at: db.fn.now() };
  if (changes.status && changes.status !== current.status) {
    if (!transitions[current.status as AppointmentStatus].includes(changes.status)) {
      throw new HttpError(409, `Can't change a ${current.status.replace("_", " ")} appointment to ${changes.status.replace("_", " ")}.`);
    }
    patch.status = changes.status;
  }
  if (changes.notes !== undefined) patch.notes = changes.notes?.trim() || null;
  if (changes.prescription !== undefined) patch.prescription = changes.prescription?.trim() || null;

  await db("appointments").where({ id }).update(patch);
  return (await getAppointment(id))!;
}
