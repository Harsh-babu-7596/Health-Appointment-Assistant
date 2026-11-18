import type { AdminStats, AnalyticsRange, AppointmentStatus, DoctorStats } from "@medislot/shared";
import { APPOINTMENT_STATUSES } from "../lib/constants.js";
import { db } from "../db/knex.js";
import { addDays, clinicNow, dateRange, generateSlots, weekdayOf } from "../lib/time.js";

const num = (v: unknown) => Number(v ?? 0);

export async function adminStats(range: AnalyticsRange): Promise<AdminStats> {
  const to = clinicNow().date;
  const from = addDays(to, -(range - 1));
  const inRange = () => db("appointments as a").whereBetween("a.date", [from, to]);

  const statusRows = await inRange().select("a.status").count("* as c").sum("a.fee as revenue").groupBy("a.status");
  const byStatus = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0])) as Record<AppointmentStatus, number>;
  let revenue = 0;
  for (const r of statusRows) {
    byStatus[r.status as AppointmentStatus] = num(r.c);
    if (r.status === "completed") revenue = num(r.revenue);
  }
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const attended = byStatus.completed + byStatus.no_show;

  const seriesRows = await inRange().whereNot("a.status", "cancelled").select("a.date").count("* as c").groupBy("a.date");
  const perDay = new Map(seriesRows.map((r) => [r.date as string, num(r.c)]));

  const bySpecialty = (
    await inRange()
      .whereNot("a.status", "cancelled")
      .join("doctors as d", "d.id", "a.doctor_id")
      .join("specialties as s", "s.id", "d.specialty_id")
      .select("s.name as specialty")
      .count("* as c")
      .groupBy("s.name")
      .orderBy("c", "desc")
  ).map((r) => ({ specialty: r.specialty as string, count: num(r.c) }));

  // New patients = patients whose first-ever appointment falls inside the range.
  const firstVisits = await db("appointments").whereNot("status", "cancelled").select("patient_id").min("date as first").groupBy("patient_id");
  const newPatients = firstVisits.filter((r) => r.first >= from && r.first <= to).length;

  const doctors = await db("doctors as d")
    .join("users as u", "u.id", "d.user_id")
    .join("specialties as s", "s.id", "d.specialty_id")
    .where("d.is_active", true)
    .select("d.id", "u.name", "s.name as specialty");

  const perDoctor = await inRange()
    .whereNot("a.status", "cancelled")
    .select("a.doctor_id")
    .count("* as visits")
    .sum({ revenue: db.raw("CASE WHEN a.status = 'completed' THEN a.fee ELSE 0 END") })
    .groupBy("a.doctor_id");
  const perDoctorMap = new Map(perDoctor.map((r) => [Number(r.doctor_id), r]));

  // Utilisation = booked slots / slots the doctor offered across the range.
  const rules = await db("doctor_availability").select("doctor_id", "weekday", "start_time", "end_time", "slot_minutes");
  const days = dateRange(from, to);
  const topDoctors = doctors
    .map((d) => {
      const own = rules.filter((r) => r.doctor_id === d.id);
      const offered = days.reduce((sum, day) => sum + generateSlots(own.filter((r) => r.weekday === weekdayOf(day))).length, 0);
      const stats = perDoctorMap.get(Number(d.id));
      const visits = num(stats?.visits);
      return {
        doctorId: Number(d.id),
        name: d.name as string,
        specialty: d.specialty as string,
        visits,
        revenue: num(stats?.revenue),
        utilisation: offered ? Math.min(100, Math.round((visits / offered) * 100)) : 0,
      };
    })
    .sort((a, b) => b.visits - a.visits);

  return {
    range,
    from,
    to,
    kpis: {
      appointments: total - byStatus.cancelled,
      completed: byStatus.completed,
      cancelled: byStatus.cancelled,
      revenue,
      noShowRate: attended ? Math.round((byStatus.no_show / attended) * 1000) / 10 : 0,
      newPatients,
      activeDoctors: doctors.length,
    },
    series: days.map((date) => ({ date, count: perDay.get(date) ?? 0 })),
    bySpecialty,
    byStatus,
    topDoctors,
  };
}

export async function doctorStats(doctorId: number): Promise<DoctorStats> {
  const today = clinicNow().date;
  const monthStart = today.slice(0, 8) + "01";

  const todayRows = await db("appointments").where({ doctor_id: doctorId, date: today }).select("status").count("* as c").groupBy("status");
  const t = Object.fromEntries(todayRows.map((r) => [r.status, num(r.c)])) as Partial<Record<AppointmentStatus, number>>;

  const [{ c: upcoming }] = await db("appointments")
    .where({ doctor_id: doctorId })
    .whereBetween("date", [addDays(today, 1), addDays(today, 7)])
    .whereNot("status", "cancelled")
    .count("* as c");

  const [month] = await db("appointments")
    .where({ doctor_id: doctorId, status: "completed" })
    .whereBetween("date", [monthStart, today])
    .count("* as c")
    .sum("fee as revenue");

  return {
    date: today,
    today: {
      total: (t.booked ?? 0) + (t.checked_in ?? 0) + (t.completed ?? 0) + (t.no_show ?? 0),
      completed: t.completed ?? 0,
      remaining: (t.booked ?? 0) + (t.checked_in ?? 0),
      noShow: t.no_show ?? 0,
      cancelled: t.cancelled ?? 0,
    },
    upcomingWeek: num(upcoming),
    monthCompleted: num(month?.c),
    monthRevenue: num(month?.revenue),
  };
}
