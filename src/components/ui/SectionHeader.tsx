import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { cx } from "@/lib/format";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  variant?: "center" | "left" | "light";
}

export function SectionHeader({ eyebrow, title, children, variant = "center" }: SectionHeaderProps) {
  return (
    <Reveal className={cx("section__head", variant === "left" && "section__head--left", variant === "light" && "section__head--light")}>
      <span className={cx("eyebrow", variant === "light" && "eyebrow--light")}>{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </Reveal>
  );
}
