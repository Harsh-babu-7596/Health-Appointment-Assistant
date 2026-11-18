import { useEffect, useState, type FormEvent } from "react";
import type { PatientProfile } from "@medislot/shared";
import { Button, Card, ErrorBanner, Field, PageHeader, Spinner, errorMessage, fieldErrors, useApi, useAsync, useAuth, useToast } from "@medislot/shared/ui";

type Form = { name: string; phone: string; dob: string; gender: string; bloodGroup: string; allergies: string };

const toForm = (p: PatientProfile): Form => ({
  name: p.name,
  phone: p.phone ?? "",
  dob: p.dob ?? "",
  gender: p.gender ?? "",
  bloodGroup: p.bloodGroup ?? "",
  allergies: p.allergies ?? "",
});

export function ProfilePage() {
  const api = useApi();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const profile = useAsync(() => api.patient.profile(), [api]);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) setForm(toForm(profile.data));
  }, [profile.data]);

  if (profile.error) return <ErrorBanner message={profile.error} onRetry={profile.reload} />;
  if (!form) return <div className="loading-block"><Spinner /></div>;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const updated = await api.patient.updateProfile({
        name: form.name,
        phone: form.phone || null,
        dob: form.dob || null,
        gender: (form.gender || null) as PatientProfile["gender"],
        bloodGroup: form.bloodGroup || null,
        allergies: form.allergies || null,
      });
      profile.setData(updated);
      if (user) setUser({ ...user, name: updated.name, phone: updated.phone });
      toast("Profile saved");
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Doctors see these details when you visit, so keep them up to date." />
      <form onSubmit={save} style={{ maxWidth: 720 }}>
        <Card title="Personal details">
          <div className="grid grid--2">
            <Field label="Full name" htmlFor="name" error={errors.name}>
              <input id="name" value={form.name} onChange={set("name")} required />
            </Field>
            <Field label="Email" htmlFor="email" hint="Contact support to change your email">
              <input id="email" value={profile.data?.email ?? ""} disabled />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <input id="phone" type="tel" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Date of birth" htmlFor="dob" error={errors.dob}>
              <input id="dob" type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={set("dob")} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <select id="gender" value={form.gender} onChange={set("gender")}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood group" htmlFor="blood">
              <select id="blood" value={form.bloodGroup} onChange={set("bloodGroup")}>
                <option value="">Unknown</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Allergies" htmlFor="allergies" hint="Medicines or foods you're allergic to" error={errors.allergies}>
            <textarea id="allergies" rows={2} value={form.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin" />
          </Field>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </Card>
      </form>
    </>
  );
}
