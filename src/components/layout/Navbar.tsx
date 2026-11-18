import { useEffect, useState } from "react";
import { navLinks } from "@/config/site";
import { cx } from "@/lib/format";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={cx("nav", scrolled && "is-scrolled")} id="top">
      <div className="container nav__inner">
        <Logo />
        <nav className={cx("nav__links", open && "is-open")} aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={close}>
              {link.label}
            </a>
          ))}
          <a href="#contact" className="btn btn--primary btn--sm nav__cta-mobile" onClick={close}>
            Book a demo
          </a>
        </nav>
        <a href="#contact" className="btn btn--primary btn--sm nav__cta">
          Book a free demo
        </a>
        <button
          className="nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
