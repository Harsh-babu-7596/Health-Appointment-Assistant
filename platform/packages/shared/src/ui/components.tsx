import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { statusLabel, initials as toInitials } from "../format.js";
import type { AppointmentStatus } from "../types.js";
import { Icon, type IconName } from "./icons.js";

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

// ---------- Buttons ----------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: IconName;
  block?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, icon, block, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner spinner--sm" /> : icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

// ---------- Layout bits ----------

export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cx("card", !padded && "card--flush", className)}>
      {(title || actions) && (
        <header className="card__head">
          {title && <h3>{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = "blue" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: IconName; tone?: "blue" | "teal" | "violet" | "amber" | "red" | "green" }) {
  return (
    <div className="stat">
      {icon && (
        <span className={`stat__icon tone-${tone}`}>
          <Icon name={icon} size={20} />
        </span>
      )}
      <div>
        <small>{label}</small>
        <b>{value}</b>
        {hint && <span className="stat__hint">{hint}</span>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge badge--${status}`}>{statusLabel[status]}</span>;
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "red" | "blue" | "amber" }) {
  return <span className={`badge badge--tone-${tone}`}>{children}</span>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${(hue + 40) % 360} 70% 62%))` }}>
      {toInitials(name)}
    </span>
  );
}

export function EmptyState({ icon = "calendar", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={26} />
      </span>
      <h4>{title}</h4>
      {children && <div className="empty__body">{children}</div>}
    </div>
  );
}

export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;

export const FullPageSpinner = () => (
  <div className="center-screen">
    <Spinner />
  </div>
);

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert--error" role="alert">
      <Icon name="alert" />
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ---------- Forms ----------

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className={cx("field", error && "field--error")}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <small className="field__error">{error}</small> : hint ? <small className="field__hint">{hint}</small> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cx("toggle", disabled && "toggle--disabled")}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" />
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group">
      {options.map((o) => (
        <button key={String(o.value)} type="button" className={cx(o.value === value && "is-active")} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  return (
    <div className="pager">
      <span>
        {from}–{Math.min(page * pageSize, total)} of {total.toLocaleString("en-IN")}
      </span>
      <div className="row">
        <Button size="sm" variant="secondary" icon="chevronLeft" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <span>
          Page {page} / {pages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ---------- Modal ----------

export function Modal({ title, open, onClose, children, footer, width = 520 }: { title: string; open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} ref={ref}>
        <header className="modal__head">
          <h3>{title}</h3>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

// ---------- Toasts ----------

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
const ToastContext = createContext<((message: string, tone?: Toast["tone"]) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <Icon name={t.tone === "error" ? "alert" : "check"} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ---------- Charts ----------

export function BarChart({ data, height = 200, formatLabel }: { data: { label: string; value: number }[]; height?: number; formatLabel?: (label: string) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.ceil(data.length / 8);
  return (
    <div className="barchart" style={{ height }}>
      <div className="barchart__bars" style={{ gap: data.length > 40 ? 1 : data.length > 14 ? 3 : 8 }}>
        {data.map((d, i) => (
          <div key={d.label} className="barchart__col">
            <span className="barchart__bar" style={{ height: `${(d.value / max) * 100}%` }} data-tip={`${formatLabel ? formatLabel(d.label) : d.label}: ${d.value}`} />
            {i % step === 0 && <span className="barchart__label">{formatLabel ? formatLabel(d.label) : d.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HBar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  return (
    <div className="hbar">
      <div className="hbar__top">
        <span>{label}</span>
        <b>
          {value.toLocaleString("en-IN")}
          {suffix}
        </b>
      </div>
      <div className="hbar__track">
        <span style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
