import type { IconName } from "@/components/ui/Icon";

export type Currency = "inr" | "usd";
export type PlanName = "Starter" | "Growth" | "Enterprise";
export type AvatarTone = "av--1" | "av--2" | "av--3" | "av--4";

export interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

export interface Plan {
  name: PlanName;
  description: string;
  monthly: Record<Currency, string> | null;
  setup: Record<Currency, string> | null;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tone: AvatarTone;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Step {
  title: string;
  description: string;
  when: string;
}

export interface Doctor {
  name: string;
  meta: string;
  fee: number;
  initials: string;
  tone: AvatarTone;
}

export type QueueStatus = "In consult" | "Checked-in" | "Waiting" | "Booked" | "Completed";

export interface QueuePatient {
  time: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  meta: string;
  reason: string;
  lastVisit: string;
  allergy: string;
  status: QueueStatus;
}

export type AnalyticsRange = 7 | 30 | 90;

export interface RangeStats {
  appointments: number;
  revenue: number;
  noShowRate: number;
  newPatients: number;
  deltas: [string, string, string, string];
}
