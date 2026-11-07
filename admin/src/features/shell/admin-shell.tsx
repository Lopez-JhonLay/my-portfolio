import {
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Moon,
  Send,
  Star,
  Sun,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import {
  getNextAdminTheme,
  readStoredAdminTheme,
  setAdminTheme,
  type AdminTheme,
} from "../../lib/admin-theme";

type AdminShellProps = {
  readonly children: ReactNode;
  readonly isBusy: boolean;
  readonly onLogout: () => void;
};

const navigation = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/featured", label: "Featured Projects", icon: Star, end: true },
  { to: "/publish", label: "Publish Updates", icon: Send, end: true },
] as const;

function Navigation({ onNavigate }: { readonly onNavigate?: () => void }) {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          className={({ isActive }) =>
            `admin-nav-link${isActive ? " is-active" : ""}`
          }
          end={end}
          key={to}
          onClick={onNavigate}
          to={to}
        >
          <Icon aria-hidden="true" size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminShell({ children, isBusy, onLogout }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>(() =>
    readStoredAdminTheme(window.localStorage),
  );

  function toggleTheme() {
    const nextTheme = getNextAdminTheme(theme);
    setAdminTheme(document.documentElement, window.localStorage, nextTheme);
    setTheme(nextTheme);
  }

  function logoutFromMobileNavigation() {
    setMobileOpen(false);
    onLogout();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            &lt;/&gt;
          </span>
          <div>
            <strong>Portfolio CMS</strong>
            <small>Content Management</small>
          </div>
        </div>
        <Navigation />
        <button
          className="sidebar-logout"
          disabled={isBusy}
          onClick={onLogout}
          type="button"
        >
          <LogOut aria-hidden="true" size={17} />
          <span>{isBusy ? "Logging out…" : "Log out"}</span>
        </button>
      </aside>
      <div className="admin-workspace">
        <header className="workspace-header">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="icon-button mobile-menu-button"
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" size={19} />
            </SheetTrigger>
            <SheetContent className="mobile-sidebar">
              <SheetTitle className="sheet-title">Portfolio CMS</SheetTitle>
              <Navigation onNavigate={() => setMobileOpen(false)} />
              <button
                className="sidebar-logout"
                disabled={isBusy}
                onClick={logoutFromMobileNavigation}
                type="button"
              >
                <LogOut aria-hidden="true" size={17} />
                <span>{isBusy ? "Logging out…" : "Log out"}</span>
              </button>
            </SheetContent>
          </Sheet>
          <span className="workspace-label">Admin workspace</span>
          <button
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? (
              <Moon aria-hidden="true" size={17} />
            ) : (
              <Sun aria-hidden="true" size={17} />
            )}
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
