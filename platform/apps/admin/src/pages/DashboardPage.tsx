import { useState } from "react";
import { APPOINTMENT_STATUSES, formatDate, inr, inrCompact, statusLabel, type AnalyticsRange } from "@medislot/shared";
import { Avatar, BarChart, Card, ErrorBanner, HBar, PageHeader, Segmented, Spinner, StatCard, StatusBadge, useApi, useAsync } from "@medislot/shared/ui";

export function DashboardPage() {
  const api = useApi();
  const [range, setRange] = useState<AnalyticsRange>(30);
  const stats = useAsync(() => api.admin.stats(range), [api, range]);
  const s = stats.data;

  return (
    <>
      <PageHeader
        title="Clinic analytics"
        subtitle={s ? `${formatDate(s.from, { day: "numeric", month: "short" })} – ${formatDate(s.to, { day: "numeric", month: "short", year: "numeric" })}` : "Loading…"}
        actions={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 7, label: "7 days" },
              { value: 30, label: "30 days" },
              { value: 90, label: "90 days" },
            ]}
          />
        }
      />

      {stats.error && <ErrorBanner message={stats.error} onRetry={stats.reload} />}
      {!s ? (
        <div className="loading-block"><Spinner /></div>
      ) : (
        <div className={stats.loading ? "is-refreshing stack" : "stack"}>
          <div className="grid grid--4">
            <StatCard icon="calendar" tone="violet" label="Appointments" value={s.kpis.appointments.toLocaleString("en-IN")} hint={`${s.kpis.completed.toLocaleString("en-IN")} completed`} />
            <StatCard icon="rupee" tone="green" label="Revenue (completed)" value={inrCompact(s.kpis.revenue)} hint={s.kpis.completed ? `Avg ${inr(s.kpis.revenue / s.kpis.completed)} / visit` : undefined} />
            <StatCard icon="alert" tone="red" label="No-show rate" value={`${s.kpis.noShowRate}%`} hint={`${s.kpis.cancelled} cancelled`} />
            <StatCard icon="users" tone="blue" label="New patients" value={s.kpis.newPatients} hint={`${s.kpis.activeDoctors} active doctors`} />
          </div>

          <div className="dash-grid">
            <Card title="Appointments per day" actions={<span className="muted small">excludes cancellations</span>}>
              <BarChart data={s.series.map((p) => ({ label: p.date, value: p.count }))} height={240} formatLabel={(d) => formatDate(d, { day: "numeric", month: "short" })} />
            </Card>
            <Card title="By specialty">
              {s.bySpecialty.length === 0 ? (
                <p className="muted">No data in this range.</p>
              ) : (
                s.bySpecialty.map((sp) => <HBar key={sp.specialty} label={sp.specialty} value={sp.count} max={s.bySpecialty[0].count} />)
              )}
            </Card>
          </div>

          <div className="dash-grid dash-grid--rev">
            <Card title="Top doctors" padded={false}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Doctor</th><th>Visits</th><th>Revenue</th><th>Utilisation</th></tr>
                  </thead>
                  <tbody>
                    {s.topDoctors.map((d) => (
                      <tr key={d.doctorId}>
                        <td>
                          <div className="cell-person">
                            <Avatar name={d.name} size={32} />
                            <div><b>{d.name}</b><span className="cell-sub">{d.specialty}</span></div>
                          </div>
                        </td>
                        <td className="mono">{d.visits}</td>
                        <td className="mono">{inrCompact(d.revenue)}</td>
                        <td className="mono"><span className="meter"><i style={{ width: `${d.utilisation}%` }} /></span>{d.utilisation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Status breakdown">
              <ul className="status-list">
                {APPOINTMENT_STATUSES.map((st) => {
                  const total = Object.values(s.byStatus).reduce((a, b) => a + b, 0) || 1;
                  return (
                    <li key={st}>
                      <StatusBadge status={st} />
                      <span className="status-list__bar"><i className={`fill-${st}`} style={{ width: `${(s.byStatus[st] / total) * 100}%` }} /></span>
                      <b className="mono" title={statusLabel[st]}>{s.byStatus[st].toLocaleString("en-IN")}</b>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
