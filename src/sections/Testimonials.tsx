import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { testimonials } from "@/data/marketing";

export function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <SectionHeader eyebrow="Loved by clinics" title="What our clients say" />
        <div className="quotes">
          {testimonials.map((t) => (
            <Reveal as="figure" className="quote" key={t.name}>
              <div className="stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" />)}
              </div>
              <blockquote>"{t.quote}"</blockquote>
              <figcaption>
                <i className={`av ${t.tone}`}>{t.initials}</i>
                <span><b>{t.name}</b><small>{t.role}</small></span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
