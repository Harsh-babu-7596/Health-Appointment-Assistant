import { site } from "@/config/site";
import { cx } from "@/lib/format";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className={cx("logo", light && "logo--light")} aria-label={`${site.agencyFullName} home`}>
      <span className="logo__mark">{site.logoInitial}</span>
      <span className="logo__text">
        {site.agencyName}
        <span>{site.agencyTagline}</span>
      </span>
    </a>
  );
}
