import { useState, type FormEvent } from "react";
import { inr, type Doctor, type NewDoctorInput } from "@medislot/shared";
import { Avatar, Badge, Button, Card, ErrorBanner, Field, Modal, PageHeader, Spinner, Toggle, errorMessage, fieldErrors, useApi, useAsync, useToast } from "@medislot/shared/ui";

const emptyForm = { name: "", email: "", phone: "", password: "", specialtyId: "", fee: "500", experienceYears: "5", bio: "" };

export function DoctorsPage() {
  const api = useApi();
  const toast = useToast();
  const doctors = useAsync(() => api.admin.doctors(), [api]);
  const specialties = useAsync(() => api.catalog.specialties(), [api]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [specOpen, setSpecOpen] = useState(false);

  const patchDoctor = async (d: Doctor, patch: Parameters<typeof api.admin.updateDoctor>[1], message: string) => {
    try {
      const updated = await api.admin.updateDoctor(d.id, patch);
      doctors.setData((prev) => (prev ?? []).map((x) => (x.id === d.id ? updated : x)));
      toast(message);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const active = doctors.data?.filter((d) => d.isActive).length ?? 0;

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle={doctors.data ? `${active} active · ${doctors.data.length - active} deactivated` : undefined}
        actions={
          <>
            <Button variant="secondary" icon="plus" onClick={() => setSpecOpen(true)}>Specialty</Button>
            <Button icon="plus" onClick={() => setAdding(true)}>Add doctor</Button>
          </>
        }
      />

      {doctors.error && <ErrorBanner message={doctors.error} onRetry={doctors.reload} />}
      <Card padded={false}>
        {!doctors.data ? (
          <div className="loading-block"><Spinner /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Doctor</th><th>Specialty</th><th>Fee</th><th>Experience</th><th>Online bookings</th><th>Account</th><th /></tr>
              </thead>
              <tbody>
                {doctors.data.map((d) => (
                  <tr key={d.id} className={d.isActive ? "" : "row-muted"}>
                    <td>
                      <div className="cell-person">
                        <Avatar name={d.name} size={34} />
                        <div><b>{d.name}</b><span className="cell-sub">{d.email}</span></div>
                      </div>
                    </td>
                    <td>{d.specialty}</td>
                    <td className="mono">{inr(d.fee)}</td>
                    <td>{d.experienceYears} yrs</td>
                    <td>
                      <Toggle checked={d.isAccepting} disabled={!d.isActive} onChange={(v) => patchDoctor(d, { isAccepting: v }, v ? `${d.name} is accepting bookings` : `Bookings paused for ${d.name}`)} />
                    </td>
                    <td>{d.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
                    <td>
                      <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <Button size="sm" variant="secondary" onClick={() => setEditing(d)}>Edit</Button>
                        <Button size="sm" variant={d.isActive ? "danger" : "secondary"} onClick={() => patchDoctor(d, { isActive: !d.isActive }, d.isActive ? `${d.name} deactivated` : `${d.name} reactivated`)}>
                          {d.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddDoctorModal
        open={adding}
        onClose={() => setAdding(false)}
        specialties={specialties.data ?? []}
        onCreated={(d) => {
          doctors.setData((prev) => [...(prev ?? []), d].sort((a, b) => a.name.localeCompare(b.name)));
          setAdding(false);
          toast(`${d.name} added. They can log in to the Doctor Portal now.`);
        }}
      />
      {editing && (
        <EditDoctorModal
          doctor={editing}
          specialties={specialties.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(d) => {
            doctors.setData((prev) => (prev ?? []).map((x) => (x.id === d.id ? d : x)));
            setEditing(null);
            toast("Doctor updated");
          }}
        />
      )}
      <SpecialtyModal open={specOpen} onClose={() => setSpecOpen(false)} onCreated={() => { specialties.reload(); setSpecOpen(false); toast("Specialty added"); }} />
    </>
  );
}

type SpecialtyOption = { id: number; name: string };

function AddDoctorModal({ open, onClose, specialties, onCreated }: { open: boolean; onClose: () => void; specialties: SpecialtyOption[]; onCreated: (d: Doctor) => void }) {
  const api = useApi();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setError(null);
    try {
      const input: NewDoctorInput = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        specialtyId: Number(form.specialtyId),
        fee: Number(form.fee),
        experienceYears: Number(form.experienceYears),
        bio: form.bio || undefined,
      };
      onCreated(await api.admin.createDoctor(input));
      setForm(emptyForm);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add a doctor"
      open={open}
      onClose={onClose}
      width={620}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-doctor" loading={saving}>Create doctor</Button>
        </>
      }
    >
      <form id="add-doctor" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="grid grid--2">
          <Field label="Full name" htmlFor="d-name" error={errors.name}>
            <input id="d-name" placeholder="Dr. Jane Doe" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Specialty" htmlFor="d-spec" error={errors.specialtyId}>
            <select id="d-spec" value={form.specialtyId} onChange={set("specialtyId")} required>
              <option value="">Select…</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Login email" htmlFor="d-email" error={errors.email}>
            <input id="d-email" type="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Temporary password" htmlFor="d-pass" error={errors.password} hint="Share it with the doctor securely">
            <input id="d-pass" type="text" value={form.password} onChange={set("password")} required minLength={8} />
          </Field>
          <Field label="Phone" htmlFor="d-phone" error={errors.phone}>
            <input id="d-phone" type="tel" value={form.phone} onChange={set("phone")} />
          </Field>
          <div className="grid grid--2">
            <Field label="Fee (₹)" htmlFor="d-fee" error={errors.fee}>
              <input id="d-fee" type="number" min={0} value={form.fee} onChange={set("fee")} required />
            </Field>
            <Field label="Experience" htmlFor="d-exp" error={errors.experienceYears}>
              <input id="d-exp" type="number" min={0} value={form.experienceYears} onChange={set("experienceYears")} required />
            </Field>
          </div>
        </div>
        <Field label="Bio (optional)" htmlFor="d-bio">
          <textarea id="d-bio" rows={3} value={form.bio} onChange={set("bio")} />
        </Field>
        <p className="muted small" style={{ margin: 0 }}>New doctors start with Mon–Sat, 9 AM–1 PM and 2–6 PM availability. They can change it in the Doctor Portal.</p>
      </form>
    </Modal>
  );
}

function EditDoctorModal({ doctor, specialties, onClose, onSaved }: { doctor: Doctor; specialties: SpecialtyOption[]; onClose: () => void; onSaved: (d: Doctor) => void }) {
  const api = useApi();
  const [form, setForm] = useState({ specialtyId: String(doctor.specialtyId), fee: String(doctor.fee), experienceYears: String(doctor.experienceYears), phone: doctor.phone ?? "", bio: doctor.bio ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await api.admin.updateDoctor(doctor.id, {
          specialtyId: Number(form.specialtyId),
          fee: Number(form.fee),
          experienceYears: Number(form.experienceYears),
          phone: form.phone || null,
          bio: form.bio || null,
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit ${doctor.name}`}
      open
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-doctor" loading={saving}>Save</Button>
        </>
      }
    >
      <form id="edit-doctor" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="grid grid--2">
          <Field label="Specialty" htmlFor="e-spec">
            <select id="e-spec" value={form.specialtyId} onChange={set("specialtyId")}>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Phone" htmlFor="e-phone">
            <input id="e-phone" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Fee (₹)" htmlFor="e-fee">
            <input id="e-fee" type="number" min={0} value={form.fee} onChange={set("fee")} />
          </Field>
          <Field label="Experience (years)" htmlFor="e-exp">
            <input id="e-exp" type="number" min={0} value={form.experienceYears} onChange={set("experienceYears")} />
          </Field>
        </div>
        <Field label="Bio" htmlFor="e-bio">
          <textarea id="e-bio" rows={3} value={form.bio} onChange={set("bio")} />
        </Field>
      </form>
    </Modal>
  );
}

function SpecialtyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const api = useApi();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.admin.createSpecialty(name);
      setName("");
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Add specialty"
      open={open}
      onClose={onClose}
      width={420}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-spec" loading={saving}>Add</Button>
        </>
      }
    >
      <form id="add-spec" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <Field label="Specialty name" htmlFor="s-name">
          <input id="s-name" placeholder="e.g. Neurology" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
      </form>
    </Modal>
  );
}
