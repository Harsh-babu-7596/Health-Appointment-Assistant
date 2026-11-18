import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addDays, formatDate, fromISODate, inr, to12h, toISODate } from "@medislot/shared";
import { Avatar, Button, Card, EmptyState, ErrorBanner, Field, Icon, Spinner, cx, errorMessage, useApi, useAsync, useToast } from "@medislot/shared/ui";

const DAYS_SHOWN = 14;

export function BookPage() {
  const { id } = useParams();
  const doctorId = Number(id);
  const api = useApi();
  const toast = useToast();
  const navigate = useNavigate();

  const today = toISODate(new Date());
  const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i)), [today]);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const doctor = useAsync(() => api.catalog.doctor(doctorId), [api, doctorId]);
  const slots = useAsync(() => api.catalog.slots(doctorId, date), [api, doctorId, date]);

  const pickDate = (d: string) => {
    setDate(d);
    setTime(null);
    setBookError(null);
  };

  const confirm = async () => {
    if (!time) return;
    setBooking(true);
    setBookError(null);
    try {
      await api.patient.book({ doctorId, date, startTime: time, reason: reason.trim() || undefined });
      toast(`Booked for ${formatDate(date, { weekday: "short", day: "numeric", month: "short" })} at ${to12h(time)}`);
      navigate("/appointments");
    } catch (err) {
      setBookError(errorMessage(err));
      setTime(null);
      void slots.reload();
    } finally {
      setBooking(false);
    }
  };

  if (doctor.error) return <ErrorBanner message={doctor.error} onRetry={doctor.reload} />;
  if (!doctor.data) return <div className="loading-block"><Spinner /></div>;
  const d = doctor.data;
  const freeCount = slots.data?.slots.filter((s) => s.available).length ?? 0;

  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="chevronLeft" size={16} /> All doctors
      </Link>

      <div className="book-layout">
        <div className="stack">
          <Card>
            <div className="doctor-profile">
              <Avatar name={d.name} size={72} />
              <div>
                <h2>{d.name}</h2>
                <span className="doctor-card__spec">{d.specialty}</span>
                <div className="row small muted" style={{ marginTop: ".35rem" }}>
                  <span>{d.experienceYears} yrs experience</span>·<span>{inr(d.fee)} consultation</span>
                </div>
              </div>
            </div>
            {d.bio && <p className="muted" style={{ margin: "1rem 0 0" }}>{d.bio}</p>}
          </Card>

          <Card title="1. Choose a date">
            <div className="date-strip">
              {days.map((day) => {
                const dt = fromISODate(day);
                return (
                  <button key={day} className={cx("date-pill", day === date && "is-active")} onClick={() => pickDate(day)}>
                    <small>{day === today ? "Today" : dt.toLocaleDateString("en-IN", { weekday: "short" })}</small>
                    <b>{dt.getDate()}</b>
                    <small>{dt.toLocaleDateString("en-IN", { month: "short" })}</small>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="2. Pick a time" actions={slots.data && freeCount > 0 && <span className="muted small">{freeCount} slots free</span>}>
            {slots.loading ? (
              <div className="loading-block"><Spinner /></div>
            ) : slots.error ? (
              <ErrorBanner message={slots.error} onRetry={slots.reload} />
            ) : !slots.data?.slots.length ? (
              <EmptyState icon="clock" title="No slots on this day">{slots.data?.message ?? "Try another date."}</EmptyState>
            ) : freeCount === 0 ? (
              <EmptyState icon="clock" title="Fully booked">All slots on this day are taken. Try another date.</EmptyState>
            ) : (
              <div className="slot-grid">
                {slots.data.slots.map((s) => (
                  <button key={s.time} className={cx("slot", s.time === time && "is-active")} disabled={!s.available} onClick={() => setTime(s.time)}>
                    {to12h(s.time)}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="book-summary">
          <Card title="Booking summary">
            <dl className="summary-list">
              <div><dt>Doctor</dt><dd>{d.name}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(date)}</dd></div>
              <div><dt>Time</dt><dd>{time ? to12h(time) : <span className="muted">Select a slot</span>}</dd></div>
              <div><dt>Fee</dt><dd>{inr(d.fee)}</dd></div>
            </dl>
            <Field label="Reason for visit (optional)" htmlFor="reason">
              <textarea id="reason" rows={3} maxLength={500} placeholder="e.g. Fever for 3 days" value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            {bookError && <div className="alert alert--error">{bookError}</div>}
            <Button size="lg" block disabled={!time} loading={booking} onClick={confirm}>
              Confirm appointment
            </Button>
            <p className="muted small" style={{ textAlign: "center", margin: ".75rem 0 0" }}>Pay at the clinic. Free cancellation before your slot.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
