import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { faqs } from "@/data/marketing";

export function Faq() {
  return (
    <section className="section section--tint" id="faq">
      <div className="container faq-wrap">
        <SectionHeader eyebrow="FAQ" title="Questions, answered" variant="left">
          <p>
            Can't find what you're looking for? <a href="#contact">Get in touch</a> and we'll reply within a few hours.
          </p>
        </SectionHeader>
        <Reveal className="faq">
          {faqs.map((f) => (
            <details key={f.question}>
              <summary>
                {f.question}
                <Icon name="plus" />
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
