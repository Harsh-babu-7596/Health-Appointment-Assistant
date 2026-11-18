import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { initialQueue } from "@/data/demo";
import { cx, longDate } from "@/lib/format";
import type { QueuePatient, QueueStatus } from "@/types";

const statusTag: Record<QueueStatus, string> = {
  "In consult": "tag--blue",
  "Checked-in": "tag--green",
  Waiting: "tag--amber",
  Booked: "tag--gray",
  Completed: "tag--gray",
};

const COMPLETED_BEFORE_QUEUE = 6;

export function DoctorDemo() {
  const toast = useToast();
  const [queue, setQueue] = useState<QueuePatient[]>(initialQueue);
  const [activeIndex, setActiveIndex] = useState(0);
  const [available, setAvailable] = useState(true);

  const patient = queue[activeIndex];
  const completedToday = COMPLETED_BEFORE_QUEUE + queue.filter((p) => p.status === "Completed").length;
  const inQueue = queue.filter((p) => p.status !== "Completed").length;

  const complete = () => {
    if (patient.status === "Completed") return;
    const updated = queue.map((p, i) => (i === activeIndex ? { ...p, status: "Completed" as const } : p));
    const next = updated.findIndex((p) => p.status !== "Completed");
    if (next !== -1) updated[next] = { ...updated[next], status: "In consult" };
    setQueue(updated);
    if (next !== -1) setActiveIndex(next);
    toast(`${patient.name} marked completed. Summary sent to patient.`);
  };

  const toggleAvailability = (on: boolean) => {
    setAvailable(on);
    toast(on ? "You're now accepting bookings." : "Bookings paused. Patients will see the next available slot.");
  };

  return (
    <div>
      <div className="dr__head">
        <div>
          <h4>Good morning, Dr. Mehta</h4>
          <small>{longDate.format(new Date())} · Cardiology OPD</small>
        </div>
        <label className="switch">
          <input type="checkbox" checked={available} onChange={(e) => toggleAvailability(e.target.checked)} />
          <span className="switch__track" />
          <span className="switch__label">{available ? "Accepting bookings" : "On break"}</span>
        </label>
      </div>

      <div className="dr__kpis">
        <div><small>Appointments</small><b>18</b></div>
        <div><small>Completed</small><b>{completedToday}</b></div>
        <div><small>In queue</small><b>{inQueue}</b></div>
        <div><small>Today's earnings</small><b>₹9,000</b></div>
      </div>

      <div className="dr__grid">
        <div className="queue">
          {queue.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className={cx("q-item", i === activeIndex && "is-active", p.status === "Completed" && "is-done")}
              onClick={() => setActiveIndex(i)}
            >
              <span className="q-time">{p.time}</span>
              <i className={`av ${p.tone}`}>{p.initials}</i>
              <p><b>{p.name}</b><small>{p.reason}</small></p>
              <span className={`tag ${statusTag[p.status]}`}>{p.status}</span>
            </button>
          ))}
        </div>

        <div className="patient-card">
          <div className="patient-card__head">
            <i className={`av av--lg ${patient.tone}`}>{patient.initials}</i>
            <div><b>{patient.name}</b><small>{patient.meta}</small></div>
          </div>
          <dl>
            <div><dt>Reason</dt><dd>{patient.reason}</dd></div>
            <div><dt>Last visit</dt><dd>{patient.lastVisit}</dd></div>
            <div><dt>Allergies</dt><dd>{patient.allergy}</dd></div>
          </dl>
          <div className="patient-card__actions">
            <button type="button" className="btn btn--primary btn--sm" disabled={patient.status === "Completed"} onClick={complete}>
              {patient.status === "Completed" ? "Completed ✓" : "Mark completed"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => toast("E-prescription editor opened (demo)")}>
              Write Rx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
