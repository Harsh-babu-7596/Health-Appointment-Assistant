import { useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cx } from "@/lib/format";
import { AdminDemo } from "./AdminDemo";
import { DoctorDemo } from "./DoctorDemo";
import { PatientDemo } from "./PatientDemo";

type TabId = "patient" | "doctor" | "admin";

const tabs: { id: TabId; label: string; icon: IconName; url: string }[] = [
  { id: "patient", label: "Patient", icon: "user", url: "book.yourclinic.com" },
  { id: "doctor", label: "Doctor", icon: "stethoscope", url: "doctor.yourclinic.com" },
  { id: "admin", label: "Admin", icon: "chart", url: "admin.yourclinic.com" },
];

export function DemoSection() {
  const [active, setActive] = useState<TabId>("patient");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ patient: null, doctor: null, admin: null });

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const current = tabs.find((t) => t.id === active)!;

  return (
    <section className="section section--tint" id="demo">
      <div className="container">
        <SectionHeader eyebrow="Interactive preview" title="See all three portals in action">
          <p>Click around. This is a simplified preview of what your clinic gets.</p>
        </SectionHeader>

        <Reveal className="demo">
          <div className="tabs" role="tablist" aria-label="Portal previews">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[t.id] = el; }}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={active === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={active === t.id ? 0 : -1}
                className={cx("tab", active === t.id && "is-active")}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <Icon name={t.icon} /> {t.label}
              </button>
            ))}
          </div>

          <div className="demo__window">
            <div className="mock__bar">
              <i />
              <i />
              <i />
              <span>{current.url}</span>
            </div>
            {/* Panels stay mounted so each demo keeps its state when switching tabs. */}
            <div className="panel" role="tabpanel" id="panel-patient" aria-labelledby="tab-patient" hidden={active !== "patient"}>
              <PatientDemo />
            </div>
            <div className="panel" role="tabpanel" id="panel-doctor" aria-labelledby="tab-doctor" hidden={active !== "doctor"}>
              <DoctorDemo />
            </div>
            <div className="panel" role="tabpanel" id="panel-admin" aria-labelledby="tab-admin" hidden={active !== "admin"}>
              <AdminDemo active={active === "admin"} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
