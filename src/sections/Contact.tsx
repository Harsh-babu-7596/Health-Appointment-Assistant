import { useState, type ChangeEvent, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { useToast } from "@/components/ui/Toast";
import { site } from "@/config/site";
import { cx } from "@/lib/format";
import { submitLead, type Lead } from "@/lib/leads";
import type { PlanName } from "@/types";

type Status = { type: "idle" | "ok" | "err"; message: string };
type RequiredField = "name" | "clinic" | "email" | "phone";

const emptyLead: Omit<Lead, "plan"> = { name: "", clinic: "", email: "", phone: "", size: "1–3", message: "" };
const requiredFields: RequiredField[] = ["name", "clinic", "email", "phone"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(lead: Lead): Set<RequiredField> {
  const errors = new Set<RequiredField>();
  for (const f of requiredFields) if (!lead[f].trim()) errors.add(f);
  if (lead.email && !EMAIL_RE.test(lead.email)) errors.add("email");
  if (lead.phone && lead.phone.replace(/\D/g, "").length < 7) errors.add("phone");
  return errors;
}

interface ContactProps {
  plan: PlanName | "Not sure yet";
  onPlanChange: (plan: PlanName | "Not sure yet") => void;
}

export function Contact({ plan, onPlanChange }: ContactProps) {
  const toast = useToast();
  const [form, setForm] = useState(emptyLead);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Set<RequiredField>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  const update = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors.has(name as RequiredField)) {
      const next = new Set(errors);
      next.delete(name as RequiredField);
      setErrors(next);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (honeypot) return;

    const lead: Lead = { ...form, plan };
    const found = validate(lead);
    setErrors(found);
    if (found.size) {
      setStatus({ type: "err", message: "Please fill in the highlighted fields." });
      document.getElementById(`f-${[...found][0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitLead(lead);
      if (result.kind === "mailto") {
        setStatus({ type: "ok", message: "Opening your email app. Just hit send!" });
      } else {
        setForm(emptyLead);
        onPlanChange("Not sure yet");
        setStatus({ type: "ok", message: "Thanks! We'll be in touch within 2 business hours." });
        toast("Demo request received 🎉");
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "err", message: `Something went wrong. Please email us at ${site.email}.` });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (name: RequiredField) => cx("field", errors.has(name) && "has-error");

  return (
    <section className="section" id="contact">
      <div className="container contact">
        <Reveal className="contact__copy">
          <span className="eyebrow">Get started</span>
          <h2>Book your free 30-minute demo</h2>
          <p>
            We'll show you {site.productName} configured for a clinic like yours, answer your questions, and give you a clear quote
            with no obligation.
          </p>
          <ul className="contact__list">
            <li>
              <span><Icon name="mail" /></span>
              <div><small>Email</small><a href={`mailto:${site.email}`}>{site.email}</a></div>
            </li>
            <li>
              <span><Icon name="phone" /></span>
              <div><small>Phone / WhatsApp</small><a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a></div>
            </li>
            <li>
              <span><Icon name="pin" /></span>
              <div><small>Office</small><p>{site.location} · Serving clients worldwide</p></div>
            </li>
          </ul>
        </Reveal>

        <Reveal as="form" className="form" noValidate onSubmit={onSubmit}>
          <div className="form__row">
            <div className={fieldClass("name")}>
              <label htmlFor="f-name">Full name *</label>
              <input id="f-name" name="name" autoComplete="name" placeholder="Dr. Priya Sharma" value={form.name} onChange={update} aria-invalid={errors.has("name")} />
            </div>
            <div className={fieldClass("clinic")}>
              <label htmlFor="f-clinic">Clinic / Hospital *</label>
              <input id="f-clinic" name="clinic" autoComplete="organization" placeholder="CityCare Clinic" value={form.clinic} onChange={update} aria-invalid={errors.has("clinic")} />
            </div>
          </div>
          <div className="form__row">
            <div className={fieldClass("email")}>
              <label htmlFor="f-email">Work email *</label>
              <input id="f-email" name="email" type="email" autoComplete="email" placeholder="you@clinic.com" value={form.email} onChange={update} aria-invalid={errors.has("email")} />
            </div>
            <div className={fieldClass("phone")}>
              <label htmlFor="f-phone">Phone / WhatsApp *</label>
              <input id="f-phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98xxxxxx10" value={form.phone} onChange={update} aria-invalid={errors.has("phone")} />
            </div>
          </div>
          <div className="form__row">
            <div className="field">
              <label htmlFor="f-size">Number of doctors</label>
              <select id="f-size" name="size" value={form.size} onChange={update}>
                {["1–3", "4–15", "16–50", "50+"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-plan">Interested plan</label>
              <select id="f-plan" value={plan} onChange={(e) => onPlanChange(e.target.value as ContactProps["plan"])}>
                {["Not sure yet", "Starter", "Growth", "Enterprise"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-message">Tell us about your needs</label>
            <textarea
              id="f-message"
              name="message"
              rows={4}
              placeholder="E.g. 2 branches, 8 doctors, want WhatsApp reminders and online payments…"
              value={form.message}
              onChange={update}
            />
          </div>
          <input
            type="text"
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
            {submitting ? "Sending…" : <>Request my free demo <Icon name="arrow" /></>}
          </button>
          <p className="form__note">We usually respond within 2 business hours. No spam, ever.</p>
          <p className={cx("form__status", status.type !== "idle" && status.type)} role="status" aria-live="polite">
            {status.message}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
