import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { plans } from "@/data/marketing";
import { cx } from "@/lib/format";
import type { Currency, PlanName } from "@/types";

const currencies: { id: Currency; label: string }[] = [
  { id: "inr", label: "₹ INR" },
  { id: "usd", label: "$ USD" },
];

export function Pricing({ onSelectPlan }: { onSelectPlan: (plan: PlanName) => void }) {
  const [currency, setCurrency] = useState<Currency>("inr");

  return (
    <section className="section section--tint" id="pricing">
      <div className="container">
        <SectionHeader eyebrow="Simple pricing" title="One-time setup. Low monthly. No surprises.">
          <p>Every plan includes hosting, updates, security and support.</p>
          <div className="seg seg--center" role="group" aria-label="Currency">
            {currencies.map((c) => (
              <button key={c.id} type="button" className={cx(currency === c.id && "is-active")} onClick={() => setCurrency(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </SectionHeader>

        <div className="pricing">
          {plans.map((plan) => (
            <Reveal className={cx("plan", plan.featured && "plan--featured")} key={plan.name}>
              {plan.featured && <span className="plan__badge">Most popular</span>}
              <h3>{plan.name}</h3>
              <p className="plan__desc">{plan.description}</p>
              <div className="plan__price">
                <b>{plan.monthly ? plan.monthly[currency] : "Custom"}</b>
                {plan.monthly && <span>/month</span>}
              </div>
              <small className="plan__setup">
                {plan.setup ? <>+ {plan.setup[currency]} one-time setup</> : "Tailored to your requirements"}
              </small>
              <ul className="checks">{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <a
                href="#contact"
                className={cx("btn btn--block", plan.featured ? "btn--primary" : "btn--ghost")}
                onClick={() => onSelectPlan(plan.name)}
              >
                {plan.cta}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
