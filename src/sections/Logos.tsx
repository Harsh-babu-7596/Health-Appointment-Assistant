import { clientLogos } from "@/data/marketing";

export function Logos() {
  return (
    <section className="logos">
      <div className="container">
        <p>Built for clinics, multi-specialty hospitals and diagnostic centres</p>
        <div className="logos__row">
          {clientLogos.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
