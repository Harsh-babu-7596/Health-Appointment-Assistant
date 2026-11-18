import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { steps } from "@/data/marketing";

export function Process() {
  return (
    <section className="section section--dark" id="process">
      <div className="container">
        <SectionHeader eyebrow="How we work" title="From first call to go-live in four steps" variant="light">
          <p>We handle the tech end-to-end, so you can focus on your patients.</p>
        </SectionHeader>
        <ol className="steps">
          {steps.map((s, i) => (
            <Reveal as="li" className="step" key={s.title}>
              <span className="step__num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <small><Icon name="clock" /> {s.when}</small>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
