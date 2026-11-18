import { useState } from "react";
import { Link } from "react-router";
import { formatDate, inr, to12h, toISODate, type Appointment } from "@medislot/shared";
import { Avatar, Button, EmptyState, ErrorBanner, Icon, Modal, PageHeader, Segmented, Spinner, StatusBadge, errorMessage, useApi, useAsync, useToast } from "@medislot/shared/ui";

function isUpcoming(a: Appointment) {
  const now = new Date();
  const today = toISODate(now);
  const time = now.toTimeString().slice(0, 5);
  return (a.status === "booked" || a.status === "checked_in") && (a.date > today || (a.date === today && a.endTime > time));
}

export function AppointmentsPage() {
  const api = useApi();
  const toast = useToast();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<Appointment | null>(null);
  const list = useAsync(() => api.patient.appointments(), [api]);

  const upcoming = (list.data ?? []).filter(isUpcoming).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const past = (list.data ?? []).filter((a) => !isUpcoming(a));
  const shown = tab === "upcoming" ? upcoming : past;

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      const updated = await api.patient.cancel(cancelling.id);
      list.setData((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)));
      toast("Appointment cancelled");
      setCancelling(null);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My appointments"
        subtitle="Upcoming visits, history and prescriptions"
        actions={
          <Link to="/" className="btn btn--primary">
            <Icon name="plus" size={17} /> New booking
          </Link>
        }
      />
      <div style={{ marginBottom: "1rem" }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: `Upcoming (${upcoming.length})` },
            { value: "past", label: `Past & cancelled (${past.length})` },
          ]}
        />
      </div>

      {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? (
        <div className="loading-block"><Spinner /></div>
      ) : shown.length === 0 ? (
        <EmptyState title={tab === "upcoming" ? "No upcoming appointments" : "No past appointments yet"}>
          {tab === "upcoming" && (
            <Link to="/" className="btn btn--primary">
              Book an appointment
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="appt-list">
          {shown.map((a) => (
            <article key={a.id} className="appt-card">
              <div className="appt-card__date">
                <small>{formatDate(a.date, { month: "short" })}</small>
                <b>{Number(a.date.slice(8))}</b>
                <small>{formatDate(a.date, { weekday: "short" })}</small>
              </div>
              <div className="appt-card__main">
                <div className="row">
                  <Avatar name={a.doctor.name} size={36} />
                  <div>
                    <b>{a.doctor.name}</b>
                    <span className="cell-sub">{a.doctor.specialty}</span>
                  </div>
                </div>
                <div className="row small muted" style={{ marginTop: ".5rem" }}>
                  <span><Icon name="clock" size={14} /> {to12h(a.startTime)} – {to12h(a.endTime)}</span>
                  <span>{inr(a.fee)}</span>
                  {a.reason && <span>“{a.reason}”</span>}
                </div>
              </div>
              <div className="appt-card__side">
                <StatusBadge status={a.status} />
                {isUpcoming(a) && a.status === "booked" && (
                  <Button size="sm" variant="danger" onClick={() => setCancelling(a)}>
                    Cancel
                  </Button>
                )}
                {a.status === "completed" && (a.notes || a.prescription) && (
                  <Button size="sm" variant="secondary" icon="file" onClick={() => setDetails(a)}>
                    Prescription
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        title="Cancel appointment?"
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>Keep it</Button>
            <Button variant="danger" loading={busy} onClick={cancel}>Yes, cancel</Button>
          </>
        }
      >
        {cancelling && (
          <p style={{ margin: 0 }}>
            Your appointment with <b>{cancelling.doctor.name}</b> on <b>{formatDate(cancelling.date)}</b> at <b>{to12h(cancelling.startTime)}</b> will be
            cancelled and the slot released to other patients.
          </p>
        )}
      </Modal>

      <Modal title="Visit summary" open={!!details} onClose={() => setDetails(null)}>
        {details && (
          <div className="stack">
            <div className="muted small">
              {details.doctor.name} · {formatDate(details.date)} · {to12h(details.startTime)}
            </div>
            {details.notes && (
              <div>
                <h4 className="label">Doctor's notes</h4>
                <p className="pre" style={{ margin: 0 }}>{details.notes}</p>
              </div>
            )}
            {details.prescription && (
              <div className="rx-box">
                <h4 className="label">℞ Prescription</h4>
                <p className="pre" style={{ margin: 0 }}>{details.prescription}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
