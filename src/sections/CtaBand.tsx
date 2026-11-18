import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/config/site";

export function CtaBand() {
  return (
    <section className="cta-band">
      <Reveal className="container cta-band__inner">
        <div>
          <h2>Ready to give your patients a better booking experience?</h2>
          <p>Join the clinics already growing with {site.productName}.</p>
        </div>
        <a href="#contact" className="btn btn--white btn--lg">
          Book a free demo <Icon name="arrow" />
        </a>
      </Reveal>
    </section>
  );
}
