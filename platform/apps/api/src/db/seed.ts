import type { Knex } from "knex";
import { hashPassword } from "../lib/auth.js";
import { addDays, clinicNow, generateSlots, weekdayOf } from "../lib/time.js";
import { insertReturningId } from "./knex.js";

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@medislot.dev", password: "Admin@123" },
  doctor: { email: "vikram.mehta@medislot.dev", password: "Doctor@123" },
  patient: { email: "patient@medislot.dev", password: "Patient@123" },
};

const SPECIALTIES = ["General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology", "ENT", "Dentistry"];

const DOCTORS = [
  { name: "Dr. Ananya Nair", email: "ananya.nair@medislot.dev", specialty: "General Medicine", fee: 500, exp: 12, bio: "Family physician focused on preventive care, diabetes and hypertension management." },
  { name: "Dr. Vikram Mehta", email: "vikram.mehta@medislot.dev", specialty: "Cardiology", fee: 1200, exp: 18, bio: "Interventional cardiologist. Special interest in heart failure and post-angioplasty care." },
  { name: "Dr. Sara Khan", email: "sara.khan@medislot.dev", specialty: "Dermatology", fee: 800, exp: 9, bio: "Clinical and cosmetic dermatology, acne, eczema and hair-loss treatment." },
  { name: "Dr. Arjun Rao", email: "arjun.rao@medislot.dev", specialty: "Pediatrics", fee: 700, exp: 14, bio: "Child health from newborns to teens, vaccinations and developmental check-ups." },
  { name: "Dr. Kavya Menon", email: "kavya.menon@medislot.dev", specialty: "Orthopedics", fee: 1000, exp: 16, bio: "Sports injuries, joint pain and fracture care." },
  { name: "Dr. Priya Desai", email: "priya.desai@medislot.dev", specialty: "Gynecology", fee: 900, exp: 11, bio: "Women's health, prenatal care and PCOS management." },
  { name: "Dr. Rahul Verma", email: "rahul.verma@medislot.dev", specialty: "ENT", fee: 600, exp: 8, bio: "Ear, nose and throat disorders, sinusitis and hearing assessments." },
  { name: "Dr. Neha Joshi", email: "neha.joshi@medislot.dev", specialty: "Dentistry", fee: 400, exp: 7, bio: "General and cosmetic dentistry, root canals and aligners." },
];

const FIRST = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Kabir", "Rohan", "Arjun", "Sai", "Reyansh", "Krishna", "Diya", "Ananya", "Aadhya", "Saanvi", "Myra", "Priya", "Neha", "Kavya", "Isha", "Meera", "Imran", "Farhan", "Zoya", "Sana", "Rahul"];
const LAST = ["Sharma", "Patel", "Gupta", "Singh", "Iyer", "Reddy", "Nair", "Kapoor", "Khan", "Das", "Joshi", "Mehta", "Rao", "Banerjee", "Qureshi"];
const REASONS = ["Fever and body ache", "Follow-up visit", "Routine check-up", "Persistent cough", "Skin rash", "Back pain", "Headache for a week", "BP review", "Knee pain after running", "Ear pain", "Toothache", "Annual health check", "Report discussion", "Allergy flare-up", null];
const NOTES = ["Vitals normal. Advised rest and fluids.", "Improving. Continue current treatment.", "Ordered blood tests; review in 1 week.", "Mild infection. Antibiotics prescribed.", "Advised physiotherapy twice a week."];
const RX = ["Paracetamol 650mg — 1 tab SOS, max 3/day", "Amoxicillin 500mg — 1 cap TDS × 5 days", "Cetirizine 10mg — 1 tab at night × 7 days", "Pantoprazole 40mg — 1 tab before breakfast × 14 days", "Vitamin D3 60k — 1 sachet weekly × 8 weeks"];

/** Small deterministic PRNG so every seed produces the same data. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export async function seed(knex: Knex) {
  const rand = rng(42);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  for (const table of ["appointments", "doctor_availability", "patients", "doctors", "specialties", "users"]) {
    await knex(table).delete();
  }

  const [adminHash, doctorHash, patientHash] = await Promise.all([
    hashPassword(DEMO_ACCOUNTS.admin.password),
    hashPassword(DEMO_ACCOUNTS.doctor.password),
    hashPassword(DEMO_ACCOUNTS.patient.password),
  ]);

  await knex("users").insert({ role: "admin", name: "Clinic Admin", email: DEMO_ACCOUNTS.admin.email, phone: "+91 90000 00001", password_hash: adminHash });

  const specialtyIds = new Map<string, number>();
  for (const name of SPECIALTIES) specialtyIds.set(name, await insertReturningId(knex, "specialties", { name }));

  const doctorIds: number[] = [];
  for (const [i, d] of DOCTORS.entries()) {
    const userId = await insertReturningId(knex, "users", { role: "doctor", name: d.name, email: d.email, phone: `+91 91000 0000${i}`, password_hash: doctorHash });
    const id = await insertReturningId(knex, "doctors", { user_id: userId, specialty_id: specialtyIds.get(d.specialty), fee: d.fee, experience_years: d.exp, bio: d.bio });
    doctorIds.push(id);

    // Most doctors work Mon–Sat with a lunch break; a couple have shorter weeks for variety.
    const days = i % 4 === 3 ? [1, 3, 5] : [1, 2, 3, 4, 5, 6];
    await knex("doctor_availability").insert(
      days.flatMap((weekday) => [
        { doctor_id: id, weekday, start_time: "09:00", end_time: "13:00", slot_minutes: i % 3 === 0 ? 20 : 30 },
        { doctor_id: id, weekday, start_time: "14:00", end_time: weekday === 6 ? "16:00" : "18:00", slot_minutes: i % 3 === 0 ? 20 : 30 },
      ]),
    );
  }

  const patientIds: number[] = [];
  const demoUser = await insertReturningId(knex, "users", { role: "patient", name: "Riya Sharma", email: DEMO_ACCOUNTS.patient.email, phone: "+91 98765 43210", password_hash: patientHash });
  patientIds.push(await insertReturningId(knex, "patients", { user_id: demoUser, dob: "1994-06-12", gender: "female", blood_group: "B+", allergies: "Penicillin" }));

  for (let i = 0; i < 40; i++) {
    const first = FIRST[i % FIRST.length];
    const last = pick(LAST);
    const userId = await insertReturningId(knex, "users", {
      role: "patient",
      name: `${first} ${last}`,
      email: `${first}.${last}.${i}@example.com`.toLowerCase(),
      phone: `+91 9${String(800000000 + Math.floor(rand() * 199999999))}`,
      password_hash: patientHash,
    });
    const year = 1950 + Math.floor(rand() * 65);
    patientIds.push(
      await insertReturningId(knex, "patients", {
        user_id: userId,
        dob: `${year}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
        gender: i < 10 ? "male" : i < 20 ? "female" : pick(["male", "female"]),
        blood_group: pick(["A+", "B+", "O+", "AB+", "O-", null]),
        allergies: rand() < 0.2 ? pick(["Penicillin", "Sulfa drugs", "Dust", "Peanuts"]) : null,
      }),
    );
  }

  // Appointments: 90 days of history + 14 days ahead, filling 35–75% of each doctor's slots.
  const now = clinicNow();
  const rules = await knex("doctor_availability").select();
  const fees = new Map(DOCTORS.map((d, i) => [doctorIds[i], d.fee]));
  const rows: Record<string, unknown>[] = [];
  const patientBusy = new Set<string>();
  // Half the patients are long-standing; the rest join gradually so "new patients" has a realistic trend.
  const joinOffset = patientIds.map((_, i) => (i <= 20 ? -90 : -90 + Math.round(((i - 20) / 20) * 92)));

  for (let offset = -90; offset <= 14; offset++) {
    const date = addDays(now.date, offset);
    const growth = 0.35 + ((offset + 90) / 104) * 0.4; // bookings grow over time
    for (const doctorId of doctorIds) {
      const slots = generateSlots(rules.filter((r) => r.doctor_id === doctorId && r.weekday === weekdayOf(date)));
      for (const slot of slots) {
        if (rand() > growth) continue;
        const patientId = offset >= 0 && rand() < 0.04 ? patientIds[0] : pick(patientIds.filter((_, i) => joinOffset[i] <= offset));
        const key = `${patientId}|${date}|${slot.start}`;
        if (patientBusy.has(key)) continue;
        patientBusy.add(key);

        const isPast = date < now.date || (date === now.date && slot.end <= now.time);
        const r = rand();
        const status = isPast
          ? r < 0.84 ? "completed" : r < 0.91 ? "no_show" : "cancelled"
          : date === now.date && slot.start <= now.time ? "checked_in" : r < 0.93 ? "booked" : "cancelled";

        rows.push({
          patient_id: patientId,
          doctor_id: doctorId,
          date,
          start_time: slot.start,
          end_time: slot.end,
          status,
          reason: pick(REASONS),
          notes: status === "completed" ? pick(NOTES) : null,
          prescription: status === "completed" && rand() < 0.7 ? pick(RX) : null,
          fee: fees.get(doctorId),
        });
      }
    }
  }
  await knex.batchInsert("appointments", rows, 200);

  return { doctors: doctorIds.length, patients: patientIds.length, appointments: rows.length };
}
