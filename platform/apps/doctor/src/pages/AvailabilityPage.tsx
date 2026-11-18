import { useEffect, useState } from "react";
import { to12h, weekdayNames, type AvailabilityRule } from "@medislot/shared";
import { Button, Card, ErrorBanner, Icon, PageHeader, Spinner, errorMessage, useApi, useAsync, useToast } from "@medislot/shared/ui";

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

const slotsIn = (r: AvailabilityRule) => {
  const [sh, sm] = r.startTime.split(":").map(Number);
  const [eh, em] = r.endTime.split(":").map(Number);
  return Math.max(0, Math.floor((eh * 60 + em - (sh * 60 + sm)) / r.slotMinutes));
};

export function AvailabilityPage() {
  const api = useApi();
  const toast = useToast();
  const saved = useAsync(() => api.doctor.availability(), [api]);
  const [rules, setRules] = useState<AvailabilityRule[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saved.data) setRules(saved.data);
  }, [saved.data]);

  if (saved.error) return <ErrorBanner message={saved.error} onRetry={saved.reload} />;
  if (!rules) return <div className="loading-block"><Spinner /></div>;

  const dirty = JSON.stringify(rules) !== JSON.stringify(saved.data);
  const update = (index: number, patch: Partial<AvailabilityRule>) => setRules(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const remove = (index: number) => setRules(rules.filter((_, i) => i !== index));
  const add = (weekday: number) => {
    const last = rules.filter((r) => r.weekday === weekday).sort((a, b) => a.endTime.localeCompare(b.endTime)).at(-1);
    const start = last ? last.endTime : "09:00";
    const [h, m] = start.split(":").map(Number);
    const end = `${String(Math.min(23, h + 3)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setRules([...rules, { weekday, startTime: start, endTime: end, slotMinutes: last?.slotMinutes ?? 30 }]);
  };
  const copyMondayToWeekdays = () => {
    const monday = rules.filter((r) => r.weekday === 1);
    setRules([...rules.filter((r) => r.weekday === 0 || r.weekday === 1), ...[2, 3, 4, 5, 6].flatMap((weekday) => monday.map((r) => ({ ...r, weekday })))]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await api.doctor.setAvailability(rules);
      saved.setData(result);
      setRules(result);
      toast("Availability updated. Patients see the new slots immediately.");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const weeklySlots = rules.reduce((sum, r) => sum + slotsIn(r), 0);

  return (
    <>
      <PageHeader
        title="Weekly availability"
        subtitle={`Patients can book these hours. ${weeklySlots} bookable slots per week.`}
        actions={
          <>
            <Button variant="secondary" onClick={copyMondayToWeekdays}>Copy Monday to Tue–Sat</Button>
            <Button variant="secondary" disabled={!dirty} onClick={() => setRules(saved.data ?? [])}>Discard</Button>
            <Button disabled={!dirty} loading={saving} onClick={save}>Save changes</Button>
          </>
        }
      />
      <div className="alert alert--info">
        <Icon name="alert" />
        <span>Changing your hours doesn't cancel appointments that are already booked.</span>
      </div>

      <div className="stack">
        {DISPLAY_ORDER.map((weekday) => {
          const indexed = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === weekday).sort((a, b) => a.r.startTime.localeCompare(b.r.startTime));
          return (
            <Card key={weekday}>
              <div className="avail-day">
                <div className="avail-day__name">
                  <b>{weekdayNames[weekday]}</b>
                  <small className="muted">{indexed.length ? `${indexed.reduce((s, { r }) => s + slotsIn(r), 0)} slots` : "Day off"}</small>
                </div>
                <div className="avail-day__windows">
                  {indexed.map(({ r, i }) => (
                    <div className="window" key={i}>
                      <input type="time" className="input" value={r.startTime} onChange={(e) => update(i, { startTime: e.target.value })} aria-label="Start time" />
                      <span className="muted">to</span>
                      <input type="time" className="input" value={r.endTime} onChange={(e) => update(i, { endTime: e.target.value })} aria-label="End time" />
                      <select className="input" value={r.slotMinutes} onChange={(e) => update(i, { slotMinutes: Number(e.target.value) })} aria-label="Slot length">
                        {SLOT_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m} min slots</option>
                        ))}
                      </select>
                      <span className="muted small window__count">
                        {slotsIn(r)} slots · {to12h(r.startTime)}–{to12h(r.endTime)}
                      </span>
                      <button className="icon-btn" aria-label="Remove window" onClick={() => remove(i)}>
                        <Icon name="x" />
                      </button>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" icon="plus" onClick={() => add(weekday)}>
                    Add hours
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
