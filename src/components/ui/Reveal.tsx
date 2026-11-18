import { useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import { useInView } from "@/hooks/useInView";
import { cx } from "@/lib/format";

type RevealProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

/** Fades its content in when scrolled into view. Renders a `div` unless `as` is given. */
export function Reveal<T extends ElementType = "div">({ as, className, ...rest }: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);
  return <Tag ref={ref} className={cx("reveal", visible && "is-visible", className)} {...rest} />;
}
