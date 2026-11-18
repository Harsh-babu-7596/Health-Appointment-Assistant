import { config } from "../config.js";

/** Current date ("YYYY-MM-DD") and time ("HH:MM") in the clinic's timezone. */
export function clinicNow(): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: config.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Day of week (0 = Sunday) for a "YYYY-MM-DD" date, independent of server timezone. */
export const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of dates from `from` to `to`. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Slot start times generated from availability windows, e.g. 09:00–11:00 @30 -> 09:00, 09:30, 10:00, 10:30. */
export function generateSlots(rules: { start_time: string; end_time: string; slot_minutes: number }[]): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  for (const r of rules) {
    const end = toMinutes(r.end_time);
    for (let t = toMinutes(r.start_time); t + r.slot_minutes <= end; t += r.slot_minutes) {
      slots.push({ start: fromMinutes(t), end: fromMinutes(t + r.slot_minutes) });
    }
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start));
}
