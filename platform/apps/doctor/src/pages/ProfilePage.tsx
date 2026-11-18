import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, ErrorBanner, Field, PageHeader, Spinner, Toggle, errorMessage, fieldErrors, useApi, useAsync, useToast } from "@medislot/shared/ui";

export function ProfilePage() {
  const api = useApi();
  const toast = useToast();
  const me = useAsync(() => api.doctor.me(), [api]);
  const [form, setForm] = useState({ fee: "", experienceYears: "", bio: "", phone: "", isAccepting: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me.data) {
      setForm({ fee: String(me.data.fee), experienceYears: String(me.data.experienceYears), bio: me.data.bio ?? "", phone: me.data.phone ?? "", isAccepting: me.data.isAccepting });
    }
  }, [me.data]);

  if (me.error) return <ErrorBanner message={me.error} onRetry={me.reload} />;
  if (!me.data) return <div className="loading-block"><Spinner /></div>;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      me.setData(
        await api.doctor.updateMe({
          fee: Number(form.fee),
          experienceYears: Number(form.experienceYears),
          bio: form.bio || null,
          phone: form.phone || null,
          isAccepting: form.isAccepting,
        }),
      );
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
      <PageHeader title="Profile & fees" subtitle="This is what patients see when they book with you." />
      <form onSubmit={save} style={{ maxWidth: 720 }}>
        <Card>
          <div className="grid grid--2">
            <Field label="Name" htmlFor="name" hint="Ask your admin to change your name or specialty">
              <input id="name" value={me.data.name} disabled />
            </Field>
            <Field label="Specialty" htmlFor="spec">
              <input id="spec" value={me.data.specialty} disabled />
            </Field>
            <Field label="Consultation fee (₹)" htmlFor="fee" error={errors.fee}>
              <input id="fee" type="number" min={0} step={50} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} required />
            </Field>
            <Field label="Years of experience" htmlFor="exp" error={errors.experienceYears}>
              <input id="exp" type="number" min={0} max={70} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} required />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="email">
              <input id="email" value={me.data.email} disabled />
            </Field>
          </div>
          <Field label="About you" htmlFor="bio" hint="Shown on your booking page" error={errors.bio}>
            <textarea id="bio" rows={4} maxLength={1000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <div className="row row--between">
            <Toggle checked={form.isAccepting} onChange={(v) => setForm({ ...form, isAccepting: v })} label="Accept new online bookings" />
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </Card>
      </form>
    </>
  );
}
