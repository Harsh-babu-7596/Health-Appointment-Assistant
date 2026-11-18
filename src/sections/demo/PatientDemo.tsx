import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import { doctorsBySpecialty, seeded, slotTimes, specialties, type Specialty } from "@/data/demo";
import { cx, shortDate, shortDay, to12h } from "@/lib/format";

const DAYS_AHEAD = 7;

function nextDays(): Date[] {
  const t = new Date();
  return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
}

function isPreBooked(spec: Specialty, date: Date, slotIndex: number) {
  return seeded(spec.length * 31 + date.getDate() * 17 + slotIndex * 7) < 0.32;
}

export function PatientDemo() {
  const toast = useToast();
  const days = useMemo(nextDays, []);
  const [spec, setSpec] = useState<Specialty>("General");
  const [dayIndex, setDayIndex] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Set<string>>(() => new Set());

  const doctor = doctorsBySpecialty[spec];
  const date = days[dayIndex];
  const now = new Date();
  const slotKey = (t: string) => `${spec}|${date.toDateString()}|${t}`;

  const isUnavailable = (t: string, i: number) => {
    const [h, m] = t.split(":").map(Number);
    const past = dayIndex === 0 && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
    return past || isPreBooked(spec, date, i) || booked.has(slotKey(t));
  };

  const confirm = () => {
    if (!time) return;
    setBooked((prev) => new Set(prev).add(slotKey(time)));
    toast(`Booked with ${doctor.name} on ${shortDate.format(date)} at ${to12h(time)}. WhatsApp confirmation sent.`);
    setTime(null);
  };

  return (
    <div className="pt">
      <div>
        <h4>Book an appointment</h4>
        <span className="lbl">Specialty</span>
        <div className="chips">
          {specialties.map((s) => (
            <button
              key={s}
              type="button"
              className={cx("chip", s === spec && "is-active")}
              onClick={() => { setSpec(s); setTime(null); }}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="lbl">Doctor</span>
        <div className="doc-card">
          <i className={`av av--lg ${doctor.tone}`}>{doctor.initials}</i>
          <div>
            <b>{doctor.name}</b>
            <small>{doctor.meta}</small>
            <span className="rating"><Icon name="star" /> 4.9 <em>(1.2k reviews)</em></span>
          </div>
          <span className="fee">₹{doctor.fee}</span>
        </div>

        <span className="lbl">Date</span>
        <div className="dates">
          {days.map((d, i) => (
            <button
              key={d.toDateString()}
              type="button"
              className={cx("date", i === dayIndex && "is-active")}
              aria-label={shortDate.format(d)}
              onClick={() => { setDayIndex(i); setTime(null); }}
            >
              <small>{i === 0 ? "Today" : shortDay.format(d)}</small>
              <b>{d.getDate()}</b>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="lbl">Available slots</span>
        <div className="slots">
          {slotTimes.map((t, i) => (
            <button
              key={t}
              type="button"
              className={cx("slot", t === time && "is-active")}
              disabled={isUnavailable(t, i)}
              onClick={() => setTime(t)}
            >
              {to12h(t)}
            </button>
          ))}
        </div>
        <div className="summary">
          <div>
            <small>Selected</small>
            <b>{time ? `${shortDate.format(date)}, ${to12h(time)} · ₹${doctor.fee}` : "Pick a time slot"}</b>
          </div>
          <button type="button" className="btn btn--primary" disabled={!time} onClick={confirm}>
            Confirm booking
          </button>
        </div>
      </div>
    </div>
  );
}
