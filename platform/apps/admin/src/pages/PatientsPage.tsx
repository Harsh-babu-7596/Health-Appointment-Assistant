import { useEffect, useState } from "react";
import { ageFromDob, formatDate } from "@medislot/shared";
import { Avatar, Card, EmptyState, ErrorBanner, Icon, PageHeader, Pager, Spinner, useApi, useAsync } from "@medislot/shared/ui";

const PAGE_SIZE = 20;

export function PatientsPage() {
  const api = useApi();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const list = useAsync(() => api.admin.patients({ search: debounced || undefined, page, pageSize: PAGE_SIZE }), [api, debounced, page]);

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={list.data ? `${list.data.total.toLocaleString("en-IN")} registered patients` : undefined}
        actions={
          <div className="search" style={{ width: 300 }}>
            <Icon name="search" />
            <input className="input" placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search patients" />
          </div>
        }
      />
      {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}
      <Card padded={false}>
        {list.loading && !list.data ? (
          <div className="loading-block"><Spinner /></div>
        ) : !list.data?.items.length ? (
          <EmptyState icon="users" title="No patients found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Patient</th><th>Phone</th><th>Age / Gender</th><th>Blood</th><th>Allergies</th><th>Visits</th><th>Last visit</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {list.data.items.map((p) => {
                    const age = ageFromDob(p.dob);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="cell-person">
                            <Avatar name={p.name} size={32} />
                            <div><b>{p.name}</b><span className="cell-sub">{p.email}</span></div>
                          </div>
                        </td>
                        <td>{p.phone ?? "—"}</td>
                        <td>{[age !== null ? `${age}` : null, p.gender ? p.gender[0].toUpperCase() : null].filter(Boolean).join(" / ") || "—"}</td>
                        <td>{p.bloodGroup ?? "—"}</td>
                        <td className={p.allergies ? "text-red" : ""}>{p.allergies ?? "—"}</td>
                        <td className="mono">{p.appointmentCount}</td>
                        <td>{p.lastVisit ? formatDate(p.lastVisit, { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        <td className="muted">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      </tr>
                    );
                  })}
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
