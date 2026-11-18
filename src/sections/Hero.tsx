import type { CSSProperties } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/config/site";
import { heroStats } from "@/data/marketing";

const weekBars = [45, 62, 55, 78, 70, 92, 60];

const upcoming = [
  { initials: "AS", tone: "av--1", name: "Aarav Shah", meta: "Cardiology · 10:30 AM", tag: "tag--green", status: "Confirmed" },
  { initials: "PK", tone: "av--2", name: "Priya Kapoor", meta: "Dermatology · 11:00 AM", tag: "tag--blue", status: "Checked-in" },
  { initials: "RM", tone: "av--3", name: "Rohan Mehta", meta: "Orthopedics · 11:30 AM", tag: "tag--amber", status: "Pending" },
];

function DashboardMock() {
  return (
    <div className="hero__visual" aria-hidden="true">
      <div className="mock">
        <div className="mock__bar">
          <i />
          <i />
          <i />
          <span>admin.yourclinic.com</span>
        </div>
        <div className="mock__body">
          <aside className="mock__side">
            <span className="mock__logo" />
            <span className="active" />
            <span />
            <span />
            <span />
            <span />
          </aside>
          <div className="mock__main">
            <div className="mock__kpis">
              <div><small>Today's bookings</small><b>148</b><em className="up">+12%</em></div>
              <div><small>Revenue</small><b>₹2.4L</b><em className="up">+8%</em></div>
              <div><small>No-show rate</small><b>4.1%</b><em className="up">−38%</em></div>
            </div>
            <div className="mock__chart">
              <div className="mock__chart-head"><b>Appointments this week</b><span>Live</span></div>
              <div className="bars">
                {weekBars.map((h, i) => (
                  <span key={i} style={{ "--h": `${h}%` } as CSSProperties} />
                ))}
              </div>
            </div>
            <div className="mock__list">
              {upcoming.map((u) => (
                <div key={u.name}>
                  <i className={`av ${u.tone}`}>{u.initials}</i>
                  <p><b>{u.name}</b><small>{u.meta}</small></p>
                  <span className={`tag ${u.tag}`}>{u.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="float float--1">
        <span className="float__icon float__icon--green"><Icon name="check" /></span>
        <p><b>Appointment confirmed</b><small>Dr. Mehta · Tomorrow, 10:30 AM</small></p>
      </div>
      <div className="float float--2">
        <span className="float__icon float__icon--blue"><Icon name="bell" /></span>
        <p><b>WhatsApp reminder sent</b><small>312 patients today</small></p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__inner">
        <Reveal className="hero__copy">
          <span className="pill"><span className="pill__dot" /> Now onboarding clinics for Q1 2027</span>
          <h1>
            Your clinic's own <span className="grad">appointment app</span>, live in weeks, not months.
          </h1>
          <p className="lead">
            We build, brand and run <strong>{site.productName}</strong>, a complete doctor appointment platform with separate
            portals for <strong>patients</strong>, <strong>doctors</strong> and <strong>admins</strong>. It includes smart reminders,
            online payments and real-time analytics.
          </p>
          <div className="hero__actions">
            <a href="#contact" className="btn btn--primary btn--lg">Book a free demo <Icon name="arrow" /></a>
            <a href="#demo" className="btn btn--ghost btn--lg">Try the live preview</a>
          </div>
          <ul className="hero__trust">
            {["White-labelled with your brand", "Web + Android + iOS", "No long-term lock-in"].map((t) => (
              <li key={t}><Icon name="check" /> {t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal>
          <DashboardMock />
        </Reveal>
      </div>

      <div className="container">
        <Reveal className="stats">
          {heroStats.map((s) => (
            <div key={s.label}>
              <CountUp to={s.value} suffix={s.suffix} />
              <span>{s.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
