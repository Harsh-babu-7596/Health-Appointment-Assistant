import { useEffect, useState } from "react";
import { Link } from "react-router";
import { inr } from "@medislot/shared";
import { Avatar, Badge, EmptyState, ErrorBanner, Icon, PageHeader, Spinner, cx, useApi, useAsync, useAuth } from "@medislot/shared/ui";

export function FindDoctorsPage() {
  const api = useApi();
  const { user } = useAuth();
  const [specialtyId, setSpecialtyId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const specialties = useAsync(() => api.catalog.specialties(), [api]);
  const doctors = useAsync(() => api.catalog.doctors({ specialtyId, search: debounced || undefined }), [api, specialtyId, debounced]);

  return (
    <>
      <div className="hero-card">
        <div>
          <h1>Hi {user?.name.split(" ")[0]}, how are you feeling today?</h1>
          <p>Find the right specialist and book a confirmed appointment instantly.</p>
        </div>
        <div className="search hero-card__search">
          <Icon name="search" />
          <input className="input" placeholder="Search doctor or specialty…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search doctors" />
        </div>
      </div>

      <PageHeader title="Find a doctor" subtitle={doctors.data ? `${doctors.data.length} doctor${doctors.data.length === 1 ? "" : "s"} available` : undefined} />

      <div className="chips" style={{ marginBottom: "1.25rem" }}>
        <button className={cx("chip", !specialtyId && "is-active")} onClick={() => setSpecialtyId(undefined)}>
          All
        </button>
        {specialties.data
          ?.filter((s) => s.doctorCount > 0)
          .map((s) => (
            <button key={s.id} className={cx("chip", specialtyId === s.id && "is-active")} onClick={() => setSpecialtyId(s.id)}>
              {s.name}
            </button>
          ))}
      </div>

      {doctors.error && <ErrorBanner message={doctors.error} onRetry={doctors.reload} />}
      {doctors.loading && !doctors.data ? (
        <div className="loading-block"><Spinner /></div>
      ) : doctors.data?.length === 0 ? (
        <EmptyState icon="search" title="No doctors found">Try a different specialty or search term.</EmptyState>
      ) : (
        <div className="doctor-grid">
          {doctors.data?.map((d) => (
            <article className="doctor-card" key={d.id}>
              <div className="doctor-card__top">
                <Avatar name={d.name} size={56} />
                <div>
                  <h3>{d.name}</h3>
                  <span className="doctor-card__spec">{d.specialty}</span>
                  <span className="muted small">{d.experienceYears} yrs experience</span>
                </div>
              </div>
              {d.bio && <p className="doctor-card__bio">{d.bio}</p>}
              <div className="doctor-card__foot">
                <div>
                  <small className="muted">Consultation</small>
                  <b>{inr(d.fee)}</b>
                </div>
                {d.isAccepting ? (
                  <Link to={`/doctors/${d.id}`} className="btn btn--primary">
                    Book now
                  </Link>
                ) : (
                  <Badge tone="amber">Not taking bookings</Badge>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
