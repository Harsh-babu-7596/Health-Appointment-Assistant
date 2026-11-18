# MediSlot Platform

The working product behind the marketing site: three React + TypeScript apps (**Patient**, **Doctor**, **Admin**) backed by one API and **one shared SQL database**.

When a patient books, the slot disappears for other patients right away. The booking shows up in the doctor's queue and in the admin's records and analytics, because all three apps read and write the same tables.

| App | URL (local) | Who uses it | What it does |
| --- | --- | --- | --- |
| Patient | http://localhost:5201 | Patients | Find a doctor, book a slot, cancel, see visit notes and prescriptions, edit profile |
| Doctor | http://localhost:5202 | Doctors | Daily queue, check in / complete / no-show, notes and prescriptions, patient history, weekly hours, fees |
| Admin | http://localhost:5203 | Clinic owner / front desk | Analytics dashboard, all appointments, add and edit doctors, specialties, patient directory |
| API | http://localhost:4000/api | All three apps | Auth, scheduling rules, analytics, the database |

![Patient app](docs/screenshots/patient-find-doctor.png)
![Doctor app](docs/screenshots/doctor-schedule.png)
![Admin app](docs/screenshots/admin-analytics.png)

---

## 1. Run it locally

Requires **Node.js 20.19+** (22 LTS recommended). No database server is needed for local development; SQLite is used automatically.

```bash
cd platform
npm run setup   # installs packages, creates apps/api/.env, creates and fills the database
npm run dev     # starts the API and all three apps together
```

Open the three URLs above. Each login page has a **Use demo** button that fills in these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@medislot.dev` | `Patient@123` |
| Doctor | `vikram.mehta@medislot.dev` | `Doctor@123` |
| Admin | `admin@medislot.dev` | `Admin@123` |

All 8 seeded doctors use `Doctor@123` (`ananya.nair@…`, `arjun.rao@…`, etc.; the admin's Doctors page lists them). Patients can also sign up on the Patient login page.

**Try the shared database end to end:**

1. In the Patient app, book Dr. Vikram Mehta for tomorrow.
2. In the Doctor app (logged in as Vikram), go to tomorrow. The booking is in the queue. Check the patient in, add notes and a prescription, then complete the visit.
3. Back in the Patient app, under *My appointments → Past*, the prescription is visible.
4. In the Admin app, the appointment shows under *Appointments* and is counted in the analytics.

### Useful commands (run from `platform/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | API + 3 apps with hot reload |
| `npm run dev:api` / `dev:patient` / `dev:doctor` / `dev:admin` | Start just one |
| `npm run db:reset` | Drop everything, recreate tables, load fresh demo data |
| `npm run db:migrate` | Apply new migrations only (keeps data) |
| `npm run db:seed` | Load demo data into an empty database |
| `npm run typecheck` | TypeScript check across every package |
| `npm run build` | Production build of the API and all apps |
| `npm run test:smoke` | 37 end-to-end API checks (API must be running; resets nothing, but adds test bookings) |

---

## 2. Architecture

```
platform/
├── packages/shared/        @medislot/shared – used by every app
│   └── src/
│       ├── types.ts        Data types shared by the API and the UIs
│       ├── api.ts          Typed API client (api.patient.book(...), api.admin.stats(...))
│       ├── format.ts       Dates, ₹ currency, 12h time
│       └── ui/             Design system: AppShell, LoginPage, Button, Card, Modal,
│                           charts, toasts, AuthProvider, styles.css
├── apps/
│   ├── api/                Express 5 + Knex – the only thing that touches the database
│   │   └── src/
│   │       ├── db/         knex.ts, migrations/, seed.ts, mappers.ts (row → JSON)
│   │       ├── services/   scheduling.ts (slots, booking, status rules), analytics.ts
│   │       ├── routes/     auth, catalog, patient, doctor, admin
│   │       └── lib/        auth (JWT, roles), http (validation, errors), time (clinic timezone)
│   ├── patient/            Vite + React app, port 5201 (blue)
│   ├── doctor/             Vite + React app, port 5202 (teal)
│   └── admin/              Vite + React app, port 5203 (violet)
└── docker-compose.yml      Optional local PostgreSQL
```

```
 Patient app ─┐
 Doctor app  ─┼──HTTPS/JSON──►  API  ──SQL──►  one database
 Admin app   ─┘   (JWT token)    (rules + roles)   (SQLite locally / PostgreSQL in production)
```

- **The apps never talk to the database directly.** They call the API, which enforces who can do what. A patient token can't reach `/api/admin/*`, and a doctor can only change their own appointments.
- **One login system, three roles.** The `users` table holds everyone. Each app logs in with its own role, so a doctor's credentials won't open the Admin app. Tokens are stored per app (`medislot.patient.token`, …), so you can be logged into all three in one browser.
- **Scheduling rules live in one place** (`services/scheduling.ts`):
  - Slots are generated from each doctor's weekly hours.
  - Past slots, taken slots and slots more than 60 days ahead can't be booked.
  - A patient can't hold two appointments at the same time.
  - A database-level unique index makes double-booking impossible even if two people click at the same instant (the loser gets a clear "slot just taken" message).
- **Clinic timezone.** "Today", "past slot" and the analytics ranges use `CLINIC_TIMEZONE` (default `Asia/Kolkata`), not the server's timezone, so hosting in a US data centre doesn't shift appointments.

### Appointment lifecycle

```
booked ──► checked_in ──► completed
   │            │
   ├──► cancelled (patient, doctor or admin; frees the slot for rebooking)
   └──► no_show
```

`completed`, `cancelled` and `no_show` are final. Patients can only cancel; doctors and admins can move appointments through the whole flow.

---

## 3. Database

Six tables, created by `apps/api/src/db/migrations/001_initial_schema.ts`. Migrations run **automatically when the API starts**, so a fresh database is set up on first boot.

```
users ─────────┬──────────────┐
 id, role,      │ 1:1          │ 1:1
 name, email,   ▼              ▼
 phone,      doctors        patients
 password_hash id, user_id,   id, user_id,
 created_at    specialty_id,  dob, gender,
               bio, fee,      blood_group,
               experience,    allergies
               is_accepting,      │
               is_active          │
                │   │             │
   specialties ◄┘   │             │
    id, name        │ 1:N         │ 1:N
                    ▼             ▼
       doctor_availability   appointments
        weekday, start_time,  doctor_id, patient_id,
        end_time,             date, start_time, end_time,
        slot_minutes          status, reason, notes,
                              prescription, fee,
                              created_at, updated_at
```

| Table | Purpose |
| --- | --- |
| `users` | Every account (patients, doctors, admins) with a `role` and a bcrypt-hashed password |
| `specialties` | Cardiology, Dermatology, … (admins can add more) |
| `doctors` | Doctor profile: specialty, fee, bio. `is_accepting` lets a doctor pause new bookings; `is_active` lets an admin deactivate a doctor (blocks login and hides them from patients) |
| `patients` | Patient profile and medical basics shown to the doctor during a visit |
| `doctor_availability` | Weekly working hours: one row per block (e.g. Mon 09:00–13:00, 30-min slots) |
| `appointments` | The shared heart of the system. The fee is copied at booking time so later fee changes don't rewrite history |

Design choices that keep it portable between SQLite and PostgreSQL:

- **Dates** are stored as `YYYY-MM-DD` and **times** as `HH:MM` text in clinic-local time. They sort correctly, have no timezone surprises, and behave identically in both databases.
- `role`, `status` and `gender` are constrained to their allowed values with CHECK constraints.
- `appointments_active_slot` is a partial unique index on `(doctor_id, date, start_time)` that ignores cancelled rows. This is the double-booking guard.

**Changing the schema later:** add `002_your_change.ts` next to the first migration, register it in `src/db/migrator.ts`, and restart the API (or run `npm run db:migrate`). Never edit a migration that has already run in production.

### Switching to PostgreSQL

SQLite is perfect for local development and small single-server deployments. For production, use PostgreSQL; the code is the same.

```bash
# Option 1: local Postgres via Docker
docker compose up -d

# Option 2: a free hosted database – Neon (neon.tech) or Supabase (supabase.com)
#   create a project and copy its connection string
```

Then in `apps/api/.env`:

```env
DB_CLIENT=postgres
DATABASE_URL=postgres://medislot:medislot@localhost:5432/medislot
# DATABASE_SSL=true      # required by Neon/Supabase/Render/most hosted providers
```

Run `npm run db:reset` (or just `npm run db:migrate` for an empty production database), then `npm run dev`. `GET /api/health` reports which database is in use.

> The schema and queries are written to run on both databases, but in this environment only SQLite was exercised end to end. Run `npm run test:smoke` once against your Postgres before going live.

---

## 4. API reference

All routes are under `/api`. Send `Authorization: Bearer <token>` except for login, register, health and the public catalog.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` `{email, password, role}` · `POST /auth/register` (patients) · `GET /auth/me` |
| Catalog (public) | `GET /specialties` · `GET /doctors?specialtyId=&search=` · `GET /doctors/:id` · `GET /doctors/:id/slots?date=YYYY-MM-DD` |
| Patient | `GET/PATCH /patient/profile` · `GET/POST /patient/appointments` · `POST /patient/appointments/:id/cancel` |
| Doctor | `GET/PATCH /doctor/me` · `GET /doctor/stats` · `GET /doctor/appointments?date=` · `PATCH /doctor/appointments/:id` · `GET /doctor/patients/:id/appointments` · `GET/PUT /doctor/availability` |
| Admin | `GET /admin/stats?range=7\|30\|90` · `GET/POST /admin/doctors` · `PATCH /admin/doctors/:id` · `POST /admin/specialties` · `GET /admin/patients?search=&page=` · `GET /admin/appointments?from=&to=&status=&doctorId=&page=` · `PATCH /admin/appointments/:id` |

Errors are always `{ "error": "message", "details"?: {...} }` with a proper status code (400 validation, 401 not logged in, 403 wrong role, 404, 409 conflict such as a taken slot).

---

## 5. Deploying

You deploy **one API with one database**, and **three static sites**.

### API + database

Any Node host works. For example, [Render](https://render.com) (free web service) with a [Neon](https://neon.tech) free Postgres:

| Setting | Value |
| --- | --- |
| Root directory | `platform` |
| Build command | `npm ci && npm run build -w @medislot/api` |
| Start command | `npm start -w @medislot/api` |
| Environment | `NODE_ENV=production`, `JWT_SECRET=<openssl rand -hex 32>`, `DB_CLIENT=postgres`, `DATABASE_URL=<from Neon>`, `DATABASE_SSL=true`, `CLINIC_TIMEZONE=Asia/Kolkata`, `CORS_ORIGINS=<the 3 app URLs, comma-separated>` |

Tables are created on the first boot. To load demo data on a sales demo server, run `ALLOW_SEED=true npm run db:seed -w @medislot/api` once. Seeding is blocked in production without that flag.

Railway and Fly.io work the same way. Free tiers sleep when idle, so the first request after a while can take ~30 seconds.

### The three apps

Each app is a static site. Create three sites on Netlify, Vercel or Cloudflare Pages (all free):

| Setting | Patient | Doctor | Admin |
| --- | --- | --- | --- |
| Base / root directory | `platform` | `platform` | `platform` |
| Build command | `npm ci && npm run build -w @medislot/patient` | `… -w @medislot/doctor` | `… -w @medislot/admin` |
| Publish directory | `apps/patient/dist` | `apps/doctor/dist` | `apps/admin/dist` |
| Environment variable | `VITE_API_URL=https://your-api.onrender.com/api` | same | same |

The `_redirects` (Netlify) and `vercel.json` files in each app make page refreshes on routes like `/appointments` work.

Typical domains: `book.yourclinic.com` (Patient), `doctor.yourclinic.com`, `admin.yourclinic.com`, `api.yourclinic.com`. Put all three app origins in the API's `CORS_ORIGINS`.

### Production checklist

- [ ] Strong `JWT_SECRET` (the API refuses to start in production without one)
- [ ] PostgreSQL with automatic backups enabled (Neon/Supabase/Render do this)
- [ ] `CORS_ORIGINS` lists only your three app URLs
- [ ] Change or delete the demo accounts (or don't seed production at all)
- [ ] Set the correct `CLINIC_TIMEZONE`
- [ ] Run `npm run test:smoke` against the deployed API

---

## 6. Extending

- **New page in an app:** add a component in `apps/<app>/src/pages/`, a route in `src/main.tsx`, and a nav item in the `AppShell` `nav` list.
- **New API endpoint:** add it to the router in `apps/api/src/routes/`, add the type to `packages/shared/src/types.ts`, and add a method to `packages/shared/src/api.ts`. All three apps can then call it with full type checking.
- **New column/table:** write a migration (see *Changing the schema later*), then update `db/mappers.ts`.
- Natural next features:
  - SMS/WhatsApp reminders: a scheduled job that reads tomorrow's `booked` appointments.
  - Online payments: a `payments` table linked to `appointments`.
  - Multi-clinic: a `clinics` table and a `clinic_id` on doctors and appointments.
  - File uploads for lab reports.
