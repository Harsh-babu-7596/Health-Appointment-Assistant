import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./auth.js";
import { Button, Field } from "./components.js";
import { errorMessage, fieldErrors } from "./hooks.js";
import { Icon, type IconName } from "./icons.js";

interface LoginPageProps {
  appName: string;
  tagline: string;
  icon: IconName;
  /** Patients can self-register; doctors and admins are created by an admin. */
  allowRegister?: boolean;
  demo?: { email: string; password: string };
  highlights?: string[];
}

export function LoginPage({ appName, tagline, icon, allowRegister, demo, highlights = [] }: LoginPageProps) {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : "/"} replace />;
  }

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__side">
        <div className="auth__brand">
          <span className="brand-mark">
            <Icon name={icon} size={22} />
          </span>
          <div>
            <b>MediSlot</b>
            <small>{appName}</small>
          </div>
        </div>
        <div className="auth__pitch">
          <h2>{tagline}</h2>
          <ul>
            {highlights.map((h) => (
              <li key={h}>
                <Icon name="check" size={16} /> {h}
              </li>
            ))}
          </ul>
        </div>
        <small className="auth__foot">© {new Date().getFullYear()} MediSlot</small>
      </aside>

      <main className="auth__main">
        <form className="auth__card" onSubmit={submit} noValidate>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">{mode === "login" ? `Log in to the ${appName}.` : "Book appointments with top doctors in seconds."}</p>

          {error && <div className="alert alert--error">{error}</div>}

          {mode === "register" && (
            <>
              <Field label="Full name" htmlFor="name" error={errors.name}>
                <input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
              </Field>
              <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
                <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
              </Field>
            </>
          )}
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint={mode === "register" ? "At least 8 characters" : undefined}>
            <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={set("password")} required />
          </Field>

          <Button type="submit" size="lg" block loading={busy}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>

          {allowRegister && (
            <p className="auth__switch">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setErrors({}); }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          )}

          {demo && mode === "login" && (
            <div className="demo-box">
              <div>
                <small>Demo account</small>
                <code>
                  {demo.email} / {demo.password}
                </code>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setForm((f) => ({ ...f, email: demo.email, password: demo.password }))}>
                Use demo
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
