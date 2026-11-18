import type { Knex } from "knex";

/**
 * One shared schema for the Patient, Doctor and Admin apps.
 * Dates are stored as "YYYY-MM-DD" and times as "HH:MM" strings in clinic local time,
 * which sort correctly and behave identically on SQLite and PostgreSQL.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.enu("role", ["patient", "doctor", "admin"]).notNullable();
    t.string("name", 120).notNullable();
    t.string("email", 190).notNullable().unique();
    t.string("phone", 32);
    t.string("password_hash", 100).notNullable();
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.index(["role"]);
  });

  await knex.schema.createTable("specialties", (t) => {
    t.increments("id").primary();
    t.string("name", 80).notNullable().unique();
  });

  await knex.schema.createTable("doctors", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    t.integer("specialty_id").notNullable().references("id").inTable("specialties");
    t.text("bio");
    t.integer("experience_years").notNullable().defaultTo(0);
    t.integer("fee").notNullable().defaultTo(0);
    t.boolean("is_accepting").notNullable().defaultTo(true);
    t.boolean("is_active").notNullable().defaultTo(true);
    t.index(["specialty_id"]);
  });

  await knex.schema.createTable("patients", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    t.string("dob", 10);
    t.enu("gender", ["male", "female", "other"]);
    t.string("blood_group", 5);
    t.text("allergies");
  });

  await knex.schema.createTable("doctor_availability", (t) => {
    t.increments("id").primary();
    t.integer("doctor_id").notNullable().references("id").inTable("doctors").onDelete("CASCADE");
    t.integer("weekday").notNullable(); // 0 = Sunday … 6 = Saturday
    t.string("start_time", 5).notNullable();
    t.string("end_time", 5).notNullable();
    t.integer("slot_minutes").notNullable().defaultTo(30);
    t.index(["doctor_id", "weekday"]);
  });

  await knex.schema.createTable("appointments", (t) => {
    t.increments("id").primary();
    t.integer("patient_id").notNullable().references("id").inTable("patients").onDelete("CASCADE");
    t.integer("doctor_id").notNullable().references("id").inTable("doctors").onDelete("CASCADE");
    t.string("date", 10).notNullable();
    t.string("start_time", 5).notNullable();
    t.string("end_time", 5).notNullable();
    t.enu("status", ["booked", "checked_in", "completed", "cancelled", "no_show"]).notNullable().defaultTo("booked");
    t.text("reason");
    t.text("notes");
    t.text("prescription");
    t.integer("fee").notNullable().defaultTo(0);
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    t.index(["doctor_id", "date"]);
    t.index(["patient_id", "date"]);
    t.index(["date", "status"]);
  });

  // A doctor can't have two active appointments in the same slot. Cancelled ones free the slot.
  await knex.raw(
    "CREATE UNIQUE INDEX appointments_active_slot ON appointments (doctor_id, date, start_time) WHERE status <> 'cancelled'",
  );
}

export async function down(knex: Knex): Promise<void> {
  for (const table of ["appointments", "doctor_availability", "patients", "doctors", "specialties", "users"]) {
    await knex.schema.dropTableIfExists(table);
  }
}
