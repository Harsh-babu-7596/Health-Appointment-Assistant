import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { site } from "@/config/site";
import { portals, withProduct, withoutProduct } from "@/data/marketing";

export function WhySwitch() {
  return (
    <section className="section" id="product">
      <div className="container">
        <SectionHeader eyebrow="Why clinics switch" title="Phone queues and paper registers are costing you patients">
          <p>
            Missed calls, double bookings and no-shows quietly eat into your revenue every day. {site.productName} replaces them
            with a single connected system.
          </p>
        </SectionHeader>

        <Reveal className="compare">
          <div className="compare__col compare__col--bad">
            <h3>Without {site.productName}</h3>
            <ul>{withoutProduct.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="compare__col compare__col--good">
            <h3>With {site.productName}</h3>
            <ul>{withProduct.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </Reveal>

        <div className="portals">
          {portals.map((p) => (
            <Reveal as="article" className="portal" key={p.title}>
              <div className={`portal__icon portal__icon--${p.tone}`}><Icon name={p.icon} /></div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <ul className="checks">{p.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
