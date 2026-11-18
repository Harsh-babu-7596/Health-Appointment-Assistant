import { useEffect, useRef, useState } from "react";
import { addDays, ageFromDob, formatDate, inr, inrCompact, to12h, toISODate, type Appointment, type AppointmentStatus } from "@medislot/shared";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Icon,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
  Toggle,
  cx,
  errorMessage,
  useApi,
  useAsync,
  useToast,
} from "@medislot/shared/ui";

export function SchedulePage() {
  const api = useApi();
  const toast = useToast();
  const today = toISODate(new Date());
  const [date, setDate] = useState(today);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const me = useAsync(() => api.doctor.me(), [api]);
  const stats = useAsync(() => api.doctor.stats(), [api]);
  const list = useAsync(() => api.doctor.appointments({ date }), [api, date]);

  const appointments = list.data ?? [];
  const selected = appointments.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    if (!list.data) return;
    if (!list.data.some((a) => a.id === selectedId)) {
      const next = list.data.find((a) => a.status === "checked_in") ?? list.data.find((a) => a.status === "booked") ?? list.data[0];
      setSelectedId(next?.id ?? null);
    }
  }, [list.data, selectedId]);

  const detailRef = useRef<HTMLDivElement>(null);
  const selectAppointment = (id: number) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1100px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const onUpdated = (updated: Appointment) => {
    list.setData((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)));
    void stats.reload();
  };

  const toggleAccepting = async (on: boolean) => {
    try {
      me.setData(await api.doctor.updateMe({ isAccepting: on }));
      toast(on ? "You're accepting new bookings" : "New bookings paused");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const active = appointments.filter((a) => a.status !== "cancelled");

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${me.data?.name ?? "Doctor"}`}
        subtitle={me.data ? `${me.data.specialty} · ${formatDate(today, { weekday: "long", day: "numeric", month: "long" })}` : undefined}
        actions={me.data && <Toggle checked={me.data.isAccepting} onChange={toggleAccepting} label={me.data.isAccepting ? "Accepting bookings" : "Bookings paused"} />}
      />

      {stats.data && (
        <div className="grid grid--4" style={{ marginBottom: "1.5rem" }}>
          <StatCard icon="calendar" tone="teal" label="Today's patients" value={stats.data.today.total} hint={`${stats.data.today.remaining} remaining`} />
          <StatCard icon="check" tone="green" label="Completed today" value={stats.data.today.completed} hint={stats.data.today.noShow ? `${stats.data.today.noShow} no-show` : "No no-shows"} />
          <StatCard icon="clock" tone="blue" label="Next 7 days" value={stats.data.upcomingWeek} hint="booked appointments" />
          <StatCard icon="rupee" tone="violet" label="This month" value={inrCompact(stats.data.monthRevenue)} hint={`${stats.data.monthCompleted} consultations`} />
        </div>
      )}

      <div className="schedule">
        <Card padded={false} className="schedule__list">
          <div className="day-nav">
            <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
              <Icon name="chevronLeft" />
            </button>
            <div className="day-nav__label">
              <b>{date === today ? "Today" : formatDate(date, { weekday: "long" })}</b>
              <small>{formatDate(date, { day: "numeric", month: "long", year: "numeric" })}</small>
            </div>
            <button className="icon-btn" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
              <Icon name="chevronRight" />
            </button>
            <input type="date" className="input day-nav__picker" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick date" />
            {date !== today && (
              <Button size="sm" variant="secondary" onClick={() => setDate(today)}>
                Today
              </Button>
            )}
          </div>

          {list.error && <div style={{ padding: "1rem" }}><ErrorBanner message={list.error} onRetry={list.reload} /></div>}
          {list.loading && !list.data ? (
            <div className="loading-block"><Spinner /></div>
          ) : appointments.length === 0 ? (
            <EmptyState title="No appointments">Nothing scheduled for this day.</EmptyState>
          ) : (
            <>
              <div className="queue-summary">
                {active.length} appointment{active.length === 1 ? "" : "s"} · {active.filter((a) => a.status === "completed").length} completed
              </div>
              <ul className="queue">
                {appointments.map((a) => (
                  <li key={a.id}>
                    <button className={cx("queue-item", a.id === selectedId && "is-active", ["completed", "cancelled", "no_show"].includes(a.status) && "is-done")} onClick={() => selectAppointment(a.id)}>
                      <span className="queue-item__time">{to12h(a.startTime)}</span>
                      <Avatar name={a.patient.name} size={34} />
                      <span className="queue-item__main">
                        <b>{a.patient.name}</b>
                        <small>{a.reason ?? "General consultation"}</small>
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <div className="schedule__detail" ref={detailRef}>
          {selected ? <ConsultationPanel key={selected.id} appt={selected} onUpdated={onUpdated} /> : <Card><EmptyState icon="user" title="Select an appointment">Pick a patient from the list to see details.</EmptyState></Card>}
        </div>
      </div>
    </>
  );
}

function ConsultationPanel({ appt, onUpdated }: { appt: Appointment; onUpdated: (a: Appointment) => void }) {
  const api = useApi();
  const toast = useToast();
  const [notes, setNotes] = useState(appt.notes ?? "");
  const [prescription, setPrescription] = useState(appt.prescription ?? "");
  const [busy, setBusy] = useState<AppointmentStatus | "save" | null>(null);
  const history = useAsync(() => api.doctor.patientHistory(appt.patient.id), [api, appt.patient.id]);

  const isOpen = appt.status === "booked" || appt.status === "checked_in";
  const age = ageFromDob(appt.patient.dob);

  const update = async (status?: AppointmentStatus) => {
    setBusy(status ?? "save");
    try {
      const updated = await api.doctor.updateAppointment(appt.id, { status, notes, prescription });
      onUpdated(updated);
      toast(status === "completed" ? "Consultation completed" : status === "checked_in" ? "Patient checked in" : status === "no_show" ? "Marked as no-show" : status === "cancelled" ? "Appointment cancelled" : "Notes saved");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const pastVisits = (history.data ?? []).filter((h) => h.id !== appt.id && h.status === "completed");

  return (
    <div className="stack">
      <Card>
        <div className="patient-head">
          <Avatar name={appt.patient.name} size={56} />
          <div style={{ flex: 1 }}>
            <h2>{appt.patient.name}</h2>
            <div className="muted small">
              {[appt.patient.gender && appt.patient.gender[0].toUpperCase() + appt.patient.gender.slice(1), age !== null && `${age} yrs`].filter(Boolean).join(" · ") || "No demographics on file"}
            </div>
          </div>
          <StatusBadge status={appt.status} />
        </div>
        <dl className="info-grid">
          <div><dt>Time</dt><dd>{to12h(appt.startTime)} – {to12h(appt.endTime)}</dd></div>
          <div><dt>Fee</dt><dd>{inr(appt.fee)}</dd></div>
          <div><dt>Phone</dt><dd>{appt.patient.phone ?? "—"}</dd></div>
          <div><dt>Allergies</dt><dd className={appt.patient.allergies ? "warn" : ""}>{appt.patient.allergies ?? "None recorded"}</dd></div>
          <div className="span-2"><dt>Reason for visit</dt><dd>{appt.reason ?? "—"}</dd></div>
        </dl>

        {isOpen && (
          <div className="action-row">
            {appt.status === "booked" && (
              <Button variant="secondary" icon="check" loading={busy === "checked_in"} onClick={() => update("checked_in")}>
                Check in
              </Button>
            )}
            <Button variant="success" icon="check" loading={busy === "completed"} onClick={() => update("completed")}>
              Complete consultation
            </Button>
            <Button variant="ghost" loading={busy === "no_show"} onClick={() => update("no_show")}>
              No-show
            </Button>
            <Button variant="danger" loading={busy === "cancelled"} onClick={() => update("cancelled")}>
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {appt.status !== "cancelled" && appt.status !== "no_show" && (
        <Card title="Consultation" actions={<Button size="sm" variant="secondary" loading={busy === "save"} onClick={() => update()}>Save notes</Button>}>
          <Field label="Clinical notes" htmlFor="notes">
            <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Symptoms, examination findings, diagnosis…" />
          </Field>
          <Field label="℞ Prescription" htmlFor="rx" hint="Visible to the patient in their app once saved">
            <textarea id="rx" rows={4} value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder={"Paracetamol 650mg — 1 tab SOS\nRest for 3 days"} />
          </Field>
        </Card>
      )}

      <Card title={`Previous visits with you (${pastVisits.length})`}>
        {history.loading ? (
          <Spinner />
        ) : pastVisits.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>This is the patient's first visit with you.</p>
        ) : (
          <ul className="history">
            {pastVisits.slice(0, 5).map((h) => (
              <li key={h.id}>
                <b>{formatDate(h.date)}</b>
                <span className="muted small">{h.reason ?? "Consultation"}</span>
                {h.notes && <p>{h.notes}</p>}
                {h.prescription && <p className="rx">℞ {h.prescription}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
