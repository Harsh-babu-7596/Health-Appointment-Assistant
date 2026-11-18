import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { features } from "@/data/marketing";

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <SectionHeader eyebrow="Everything included" title="Built for how real clinics work">
          <p>Every feature your front desk, doctors and management team need, ready on day one.</p>
        </SectionHeader>
        <div className="features">
          {features.map((f) => (
            <Reveal className="feature" key={f.title}>
              <span className="feature__icon"><Icon name={f.icon} /></span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
