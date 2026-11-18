import { useState } from "react";
import { APPOINTMENT_STATUSES, addDays, formatDate, inr, statusLabel, to12h, toISODate, type AppointmentStatus } from "@medislot/shared";
import { Avatar, Card, EmptyState, ErrorBanner, PageHeader, Pager, Spinner, StatusBadge, errorMessage, useApi, useAsync, useToast } from "@medislot/shared/ui";

const PAGE_SIZE = 20;

export function AppointmentsPage() {
  const api = useApi();
  const toast = useToast();
  const today = toISODate(new Date());
  const [filters, setFilters] = useState({ from: today, to: addDays(today, 7), status: "" as AppointmentStatus | "", doctorId: "" });
  const [page, setPage] = useState(1);

  const doctors = useAsync(() => api.admin.doctors(), [api]);
  const list = useAsync(
    () =>
      api.admin.appointments({
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        doctorId: filters.doctorId ? Number(filters.doctorId) : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [api, filters, page],
  );

  const setFilter = (patch: Partial<typeof filters>) => {
    setFilters({ ...filters, ...patch });
    setPage(1);
  };

  const changeStatus = async (id: number, status: AppointmentStatus) => {
    try {
      const updated = await api.admin.updateAppointment(id, { status });
      list.setData((prev) => (prev ? { ...prev, items: prev.items.map((a) => (a.id === id ? updated : a)) } : prev!));
      toast(`Marked as ${statusLabel[status].toLowerCase()}`);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const quick = (from: string, to: string) => setFilter({ from, to });

  return (
    <>
      <PageHeader title="Appointments" subtitle={list.data ? `${list.data.total.toLocaleString("en-IN")} matching appointments` : undefined} />

      <Card className="filters">
        <div className="filters__row">
          <label>
            <span>From</span>
            <input type="date" className="input" value={filters.from} onChange={(e) => setFilter({ from: e.target.value })} />
          </label>
          <label>
            <span>To</span>
            <input type="date" className="input" value={filters.to} onChange={(e) => setFilter({ to: e.target.value })} />
          </label>
          <label>
            <span>Status</span>
            <select className="input" value={filters.status} onChange={(e) => setFilter({ status: e.target.value as AppointmentStatus | "" })}>
              <option value="">All statuses</option>
              {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          </label>
          <label>
            <span>Doctor</span>
            <select className="input" value={filters.doctorId} onChange={(e) => setFilter({ doctorId: e.target.value })}>
              <option value="">All doctors</option>
              {doctors.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        </div>
        <div className="chips">
          <button className="chip" onClick={() => quick(today, today)}>Today</button>
          <button className="chip" onClick={() => quick(today, addDays(today, 7))}>Next 7 days</button>
          <button className="chip" onClick={() => quick(addDays(today, -7), today)}>Last 7 days</button>
          <button className="chip" onClick={() => quick(addDays(today, -30), today)}>Last 30 days</button>
          <button className="chip" onClick={() => quick("", "")}>All time</button>
        </div>
      </Card>

      {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}
      <Card padded={false}>
        {list.loading && !list.data ? (
          <div className="loading-block"><Spinner /></div>
        ) : !list.data?.items.length ? (
          <EmptyState title="No appointments match these filters" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Date & time</th><th>Patient</th><th>Doctor</th><th>Fee</th><th>Status</th><th>Change status</th></tr>
                </thead>
                <tbody>
                  {list.data.items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{formatDate(a.date, { day: "numeric", month: "short", year: "numeric" })}</b>
                        <span className="cell-sub">{to12h(a.startTime)} – {to12h(a.endTime)}</span>
                      </td>
                      <td>
                        <div className="cell-person">
                          <Avatar name={a.patient.name} size={30} />
                          <div><b>{a.patient.name}</b><span className="cell-sub">{a.patient.phone ?? a.patient.email}</span></div>
                        </div>
                      </td>
                      <td>{a.doctor.name}<span className="cell-sub">{a.doctor.specialty}</span></td>
                      <td className="mono">{inr(a.fee)}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        {a.status === "booked" || a.status === "checked_in" ? (
                          <select className="input input--sm" value="" onChange={(e) => e.target.value && changeStatus(a.id, e.target.value as AppointmentStatus)} aria-label="Change status">
                            <option value="">Change…</option>
                            {a.status === "booked" && <option value="checked_in">Check in</option>}
                            <option value="completed">Completed</option>
                            <option value="no_show">No-show</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        ) : (
                          <span className="muted small">Final</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pageSize={PAGE_SIZE} total={list.data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
