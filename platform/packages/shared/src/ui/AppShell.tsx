import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "./auth.js";
import { Avatar, cx } from "./components.js";
import { Icon, type IconName } from "./icons.js";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

interface AppShellProps {
  appName: string;
  icon: IconName;
  nav: NavItem[];
  /** "sidebar" for staff apps (doctor/admin), "top" for the patient app. */
  layout?: "sidebar" | "top";
  headerExtra?: ReactNode;
}

export function AppShell({ appName, icon, nav, layout = "sidebar", headerExtra }: AppShellProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const links = nav.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cx("nav-link", isActive && "is-active")}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  ));

  const userBlock = user && (
    <div className="user-chip">
      <Avatar name={user.name} size={34} />
      <div className="user-chip__text">
        <b>{user.name}</b>
        <small>{user.email}</small>
      </div>
      <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
        <Icon name="logout" />
      </button>
    </div>
  );

  const brand = (
    <div className="brand">
      <span className="brand-mark">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <b>MediSlot</b>
        <small>{appName}</small>
      </div>
    </div>
  );

  if (layout === "top") {
    return (
      <div className="shell shell--top">
        <header className="topbar">
          <div className="container topbar__inner">
            {brand}
            <nav className={cx("topbar__nav", menuOpen && "is-open")}>{links}</nav>
            <div className="topbar__right">
              {headerExtra}
              {userBlock}
              <button className="icon-btn topbar__menu" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
                <Icon name={menuOpen ? "x" : "menu"} />
              </button>
            </div>
          </div>
        </header>
        <main className="container shell__main">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="shell shell--sidebar">
      <aside className={cx("sidebar", menuOpen && "is-open")}>
        {brand}
        <nav className="sidebar__nav">{links}</nav>
        <div className="sidebar__foot">{userBlock}</div>
      </aside>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="shell__content">
        <header className="mobilebar">
          <button className="icon-btn" aria-label="Menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          {brand}
        </header>
        <main className="shell__main">
          {headerExtra}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
