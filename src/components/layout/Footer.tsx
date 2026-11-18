import { site } from "@/config/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo light />
          <p>We build modern healthcare software that helps clinics grow. Makers of {site.productName}.</p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="#product">Patient App</a>
          <a href="#product">Doctor Portal</a>
          <a href="#product">Admin Dashboard</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#process">How we work</a>
          <a href="#testimonials">Clients</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </div>
        <div>
          <h4>Get in touch</h4>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
          <span>{site.location}</span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} {site.agencyFullName}. All rights reserved.
        </span>
        <span>
          <a href="#">Privacy</a> · <a href="#">Terms</a>
        </span>
      </div>
    </footer>
  );
}
