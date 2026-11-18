import type { AppointmentStatus, Role } from "@medislot/shared";

// Runtime copies of shared union types. `satisfies` makes the compiler flag any drift from @medislot/shared.
export const APPOINTMENT_STATUSES = ["booked", "checked_in", "completed", "cancelled", "no_show"] as const satisfies readonly AppointmentStatus[];
export const ROLES = ["patient", "doctor", "admin"] as const satisfies readonly Role[];
export const GENDERS = ["male", "female", "other"] as const;
