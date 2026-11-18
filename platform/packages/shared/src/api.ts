import type {
  AdminStats,
  AnalyticsRange,
  Appointment,
  AppointmentStatus,
  AuthResponse,
  AvailabilityRule,
  Doctor,
  DoctorStats,
  Paginated,
  PatientListItem,
  PatientProfile,
  SlotsResponse,
  Specialty,
  User,
} from "./types.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface ClientOptions {
  /** Defaults to "/api" (each app's dev server proxies this to the API). */
  baseUrl?: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}

type Query = Record<string, string | number | boolean | undefined | null>;

const qs = (q?: Query) => {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export interface NewDoctorInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  specialtyId: number;
  fee: number;
  experienceYears: number;
  bio?: string;
}

export interface DoctorUpdateInput {
  fee?: number;
  experienceYears?: number;
  bio?: string | null;
  isAccepting?: boolean;
  isActive?: boolean;
  specialtyId?: number;
  phone?: string | null;
}

export interface AppointmentUpdateInput {
  status?: AppointmentStatus;
  notes?: string | null;
  prescription?: string | null;
}

export function createApiClient({ baseUrl = "/api", getToken, onUnauthorized }: ClientOptions) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res: Response;
    try {
      res = await fetch(baseUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError(0, "Cannot reach the server. Is the API running?");
    }

    const data: any = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token) onUnauthorized?.();
      throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.details);
    }
    return data as T;
  }

  const get = <T>(path: string, q?: Query) => request<T>("GET", path + qs(q));
  const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
  const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
  const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);

  return {
    auth: {
      login: (email: string, password: string, role: User["role"]) => post<AuthResponse>("/auth/login", { email, password, role }),
      register: (input: { name: string; email: string; phone?: string; password: string }) => post<AuthResponse>("/auth/register", input),
      me: () => get<{ user: User }>("/auth/me"),
    },
    catalog: {
      specialties: () => get<Specialty[]>("/specialties"),
      doctors: (q?: { specialtyId?: number; search?: string }) => get<Doctor[]>("/doctors", q),
      doctor: (id: number) => get<Doctor>(`/doctors/${id}`),
      slots: (doctorId: number, date: string) => get<SlotsResponse>(`/doctors/${doctorId}/slots`, { date }),
    },
    patient: {
      profile: () => get<PatientProfile>("/patient/profile"),
      updateProfile: (input: Partial<Pick<PatientProfile, "name" | "phone" | "dob" | "gender" | "bloodGroup" | "allergies">>) =>
        patch<PatientProfile>("/patient/profile", input),
      appointments: () => get<Appointment[]>("/patient/appointments"),
      book: (input: { doctorId: number; date: string; startTime: string; reason?: string }) => post<Appointment>("/patient/appointments", input),
      cancel: (id: number) => post<Appointment>(`/patient/appointments/${id}/cancel`),
    },
    doctor: {
      me: () => get<Doctor>("/doctor/me"),
      updateMe: (input: Pick<DoctorUpdateInput, "fee" | "experienceYears" | "bio" | "isAccepting" | "phone">) => patch<Doctor>("/doctor/me", input),
      appointments: (q: { date?: string; from?: string; to?: string }) => get<Appointment[]>("/doctor/appointments", q),
      updateAppointment: (id: number, input: AppointmentUpdateInput) => patch<Appointment>(`/doctor/appointments/${id}`, input),
      patientHistory: (patientId: number) => get<Appointment[]>(`/doctor/patients/${patientId}/appointments`),
      availability: () => get<AvailabilityRule[]>("/doctor/availability"),
      setAvailability: (rules: AvailabilityRule[]) => put<AvailabilityRule[]>("/doctor/availability", { rules }),
      stats: () => get<DoctorStats>("/doctor/stats"),
    },
    admin: {
      stats: (range: AnalyticsRange) => get<AdminStats>("/admin/stats", { range }),
      doctors: () => get<Doctor[]>("/admin/doctors"),
      createDoctor: (input: NewDoctorInput) => post<Doctor>("/admin/doctors", input),
      updateDoctor: (id: number, input: DoctorUpdateInput) => patch<Doctor>(`/admin/doctors/${id}`, input),
      patients: (q?: { search?: string; page?: number; pageSize?: number }) => get<Paginated<PatientListItem>>("/admin/patients", q),
      appointments: (q?: { from?: string; to?: string; status?: AppointmentStatus; doctorId?: number; page?: number; pageSize?: number }) =>
        get<Paginated<Appointment>>("/admin/appointments", q),
      updateAppointment: (id: number, input: AppointmentUpdateInput) => patch<Appointment>(`/admin/appointments/${id}`, input),
      createSpecialty: (name: string) => post<Specialty>("/admin/specialties", { name }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
