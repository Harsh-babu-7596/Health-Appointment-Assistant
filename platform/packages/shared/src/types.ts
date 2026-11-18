/** Data shapes shared by the API and all three apps. Dates are "YYYY-MM-DD", times are "HH:MM" (clinic local time). */

export type Role = "patient" | "doctor" | "admin";

export const APPOINTMENT_STATUSES = ["booked", "checked_in", "completed", "cancelled", "no_show"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface User {
  id: number;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Specialty {
  id: number;
  name: string;
  doctorCount: number;
}

export interface Doctor {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  specialtyId: number;
  specialty: string;
  bio: string | null;
  experienceYears: number;
  fee: number;
  isAccepting: boolean;
  isActive: boolean;
}

export interface PatientProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  bloodGroup: string | null;
  allergies: string | null;
  createdAt: string;
}

export interface PatientListItem extends PatientProfile {
  appointmentCount: number;
  lastVisit: string | null;
}

export interface Slot {
  time: string;
  available: boolean;
}

export interface SlotsResponse {
  date: string;
  slots: Slot[];
  /** Set when the doctor has no slots that day (e.g. not working, not accepting bookings). */
  message?: string;
}

export interface Appointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  prescription: string | null;
  fee: number;
  createdAt: string;
  patient: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    dob: string | null;
    gender: PatientProfile["gender"];
    allergies: string | null;
  };
  doctor: {
    id: number;
    name: string;
    specialty: string;
  };
}

export interface AvailabilityRule {
  weekday: number; // 0 = Sunday … 6 = Saturday
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

export interface DoctorStats {
  date: string;
  today: { total: number; completed: number; remaining: number; noShow: number; cancelled: number };
  upcomingWeek: number;
  monthCompleted: number;
  monthRevenue: number;
}

export type AnalyticsRange = 7 | 30 | 90;

export interface AdminStats {
  range: AnalyticsRange;
  from: string;
  to: string;
  kpis: {
    appointments: number;
    completed: number;
    cancelled: number;
    revenue: number;
    noShowRate: number;
    newPatients: number;
    activeDoctors: number;
  };
  series: { date: string; count: number }[];
  bySpecialty: { specialty: string; count: number }[];
  byStatus: Record<AppointmentStatus, number>;
  topDoctors: { doctorId: number; name: string; specialty: string; visits: number; revenue: number; utilisation: number }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
