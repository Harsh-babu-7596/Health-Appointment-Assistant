import type { AnalyticsRange, Doctor, QueuePatient, RangeStats } from "@/types";

export const specialties = ["General", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"] as const;
export type Specialty = (typeof specialties)[number];

export const doctorsBySpecialty: Record<Specialty, Doctor> = {
  General: { name: "Dr. Ananya Nair", meta: "General Physician · 12 yrs exp", fee: 500, initials: "AN", tone: "av--2" },
  Cardiology: { name: "Dr. Vikram Mehta", meta: "Cardiologist · 18 yrs exp", fee: 1200, initials: "VM", tone: "av--1" },
  Dermatology: { name: "Dr. Sara Khan", meta: "Dermatologist · 9 yrs exp", fee: 800, initials: "SK", tone: "av--3" },
  Pediatrics: { name: "Dr. Arjun Rao", meta: "Pediatrician · 14 yrs exp", fee: 700, initials: "AR", tone: "av--4" },
  Orthopedics: { name: "Dr. Kavya Menon", meta: "Orthopedic Surgeon · 16 yrs exp", fee: 1000, initials: "KM", tone: "av--1" },
};

export const slotTimes = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "16:00", "17:30"];

export const initialQueue: QueuePatient[] = [
  { time: "10:30 AM", name: "Aarav Shah", initials: "AS", tone: "av--1", meta: "Male · 42 yrs · Follow-up", reason: "Chest discomfort, BP review", lastVisit: "12 Oct 2026", allergy: "Penicillin", status: "In consult" },
  { time: "10:45 AM", name: "Neha Gupta", initials: "NG", tone: "av--3", meta: "Female · 29 yrs · New patient", reason: "Palpitations after exercise", lastVisit: "First visit", allergy: "None", status: "Checked-in" },
  { time: "11:00 AM", name: "Imran Qureshi", initials: "IQ", tone: "av--2", meta: "Male · 57 yrs · Follow-up", reason: "Post-angioplasty check", lastVisit: "02 Sep 2026", allergy: "Aspirin", status: "Checked-in" },
  { time: "11:15 AM", name: "Lakshmi Iyer", initials: "LI", tone: "av--4", meta: "Female · 64 yrs · Video consult", reason: "ECG report discussion", lastVisit: "28 Oct 2026", allergy: "None", status: "Waiting" },
  { time: "11:30 AM", name: "Kabir Singh", initials: "KS", tone: "av--1", meta: "Male · 35 yrs · New patient", reason: "High cholesterol", lastVisit: "First visit", allergy: "Sulfa drugs", status: "Booked" },
];

export const analyticsByRange: Record<AnalyticsRange, RangeStats> = {
  7: { appointments: 1046, revenue: 742000, noShowRate: 4.1, newPatients: 312, deltas: ["+12%", "+8%", "−38%", "+21%"] },
  30: { appointments: 4380, revenue: 3120000, noShowRate: 4.6, newPatients: 1240, deltas: ["+18%", "+14%", "−34%", "+26%"] },
  90: { appointments: 12840, revenue: 9150000, noShowRate: 5.2, newPatients: 3610, deltas: ["+31%", "+27%", "−29%", "+40%"] },
};

export const specialtyShare = [
  { label: "General", pct: 38, color: "#0b5cff" },
  { label: "Cardiology", pct: 22, color: "#14b8a6" },
  { label: "Dermatology", pct: 18, color: "#8b5cf6" },
  { label: "Pediatrics", pct: 14, color: "#f59e0b" },
  { label: "Other", pct: 8, color: "#ef4444" },
];

export const topDoctors = [
  { name: "Dr. Ananya Nair", specialty: "General", visits: 412, utilisation: 94, rating: 4.9 },
  { name: "Dr. Vikram Mehta", specialty: "Cardiology", visits: 286, utilisation: 88, rating: 4.8 },
  { name: "Dr. Sara Khan", specialty: "Dermatology", visits: 241, utilisation: 81, rating: 4.9 },
  { name: "Dr. Arjun Rao", specialty: "Pediatrics", visits: 198, utilisation: 76, rating: 4.7 },
];

/** Deterministic pseudo-random value in [0, 1) so demo data looks organic but stays stable. */
export const seeded = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;

export function appointmentSeries(range: AnalyticsRange): number[] {
  return Array.from({ length: range }, (_, i) => {
    const weekly = Math.sin((i / 7) * Math.PI * 2) * 22;
    const trend = (i / range) * 30;
    const noise = seeded(i * 13 + range) * 26 - 13;
    return Math.max(40, Math.round(148 + weekly + trend + noise));
  });
}
