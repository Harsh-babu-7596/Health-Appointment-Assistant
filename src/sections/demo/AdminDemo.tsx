import { useEffect, useMemo, useState } from "react";
import { analyticsByRange, appointmentSeries, specialtyShare, topDoctors } from "@/data/demo";
import { cx, inrCompact } from "@/lib/format";
import type { AnalyticsRange } from "@/types";

const ranges: AnalyticsRange[] = [7, 30, 90];

const donutGradient = (() => {
  let acc = 0;
  const stops = specialtyShare.map(({ pct, color }) => {
    const stop = `${color} ${acc}% ${acc + pct}%`;
    acc += pct;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
})();

export function AdminDemo({ active }: { active: boolean }) {
  const [range, setRange] = useState<AnalyticsRange>(7);
  const [grown, setGrown] = useState(false);

  const stats = analyticsByRange[range];
  const series = useMemo(() => appointmentSeries(range), [range]);
  const max = Math.max(...series);

  useEffect(() => {
    if (!active) return;
    setGrown(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [range, active]);

  const kpis = [
    { label: "Appointments", value: stats.appointments.toLocaleString("en-IN") },
    { label: "Revenue", value: inrCompact(stats.revenue) },
    { label: "No-show rate", value: `${stats.noShowRate}%` },
    { label: "New patients", value: stats.newPatients.toLocaleString("en-IN") },
  ];

  return (
    <div>
      <div className="ad__head">
        <h4>Clinic analytics</h4>
        <div className="seg" role="group" aria-label="Date range">
          {ranges.map((r) => (
            <button key={r} type="button" className={cx(r === range && "is-active")} onClick={() => setRange(r)}>
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="ad__kpis">
        {kpis.map((k, i) => (
          <div className="ad__kpi" key={k.label}>
            <small>{k.label}</small>
            <b>{k.value}</b>
            <em className="up">{stats.deltas[i]} vs prev.</em>
          </div>
        ))}
      </div>

      <div className="ad__grid">
        <div className="card-lite">
          <div className="card-lite__head"><b>Appointments</b><small>Last {range} days</small></div>
          <div className="chart" style={{ gap: range > 30 ? 1 : range > 7 ? 3 : 10 }}>
            {series.map((v, i) => (
              <span key={i} className="chart__bar" data-v={v} style={{ height: grown ? `${(v / max) * 100}%` : 0 }} />
            ))}
          </div>
        </div>
        <div className="card-lite">
          <div className="card-lite__head"><b>By specialty</b></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: donutGradient }}>
              <span><b>{stats.appointments.toLocaleString("en-IN")}</b><small>visits</small></span>
            </div>
            <ul className="legend">
              {specialtyShare.map((s) => (
                <li key={s.label}><i style={{ background: s.color }} />{s.label} <b>{s.pct}%</b></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card-lite">
        <div className="card-lite__head"><b>Top doctors</b><small>by utilisation</small></div>
        <table className="tbl">
          <thead>
            <tr><th>Doctor</th><th>Specialty</th><th>Visits</th><th>Utilisation</th><th>Rating</th></tr>
          </thead>
          <tbody>
            {topDoctors.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.specialty}</td>
                <td>{d.visits}</td>
                <td><span className="meter"><i style={{ width: `${d.utilisation}%` }} /></span> {d.utilisation}%</td>
                <td>{d.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
