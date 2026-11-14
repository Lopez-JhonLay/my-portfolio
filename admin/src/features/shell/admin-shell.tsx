import {
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Moon,
  MessageSquare,
  Clock3,
  Wrench,
  Send,
  Sparkles,
  Star,
  Sun,
  UserRound,
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
import type { AdminProfile } from "../auth/auth-client";

type AdminShellProps = {
  readonly children: ReactNode;
  readonly isBusy: boolean;
  readonly onLogout: () => void;
  readonly profile: AdminProfile | null;
};

const navigation = [
  { to: "/", label: "Overview", icon: Home, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/hero", label: "Hero", icon: Sparkles, end: true },
  { to: "/about", label: "About Me", icon: UserRound, end: true },
  { to: "/timeline", label: "Timeline", icon: Clock3, end: true },
  { to: "/technologies", label: "Technologies", icon: Wrench, end: true },
  { to: "/contact", label: "Contact", icon: MessageSquare, end: true },
  { to: "/featured", label: "Featured Projects", icon: Star, end: true },
  { to: "/publish", label: "Publish Updates", icon: Send, end: true },
] as const;

function SidebarProfile({ profile }: { readonly profile: AdminProfile }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayName = profile.name ?? profile.login;

  return (
    <div className="sidebar-profile">
      {profile.avatarUrl && !avatarFailed ? (
        <img
          alt=""
          className="sidebar-profile-avatar"
          height={32}
          onError={() => setAvatarFailed(true)}
          referrerPolicy="no-referrer"
          src={profile.avatarUrl}
          width={32}
        />
      ) : (
        <span aria-hidden="true" className="sidebar-profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="sidebar-profile-text">
        <strong>{displayName}</strong>
        {profile.name && <small>@{profile.login}</small>}
      </div>
    </div>
  );
}

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

export function AdminShell({
  children,
  isBusy,
  onLogout,
  profile,
}: AdminShellProps) {
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
        <div className="sidebar-footer">
          {profile && <SidebarProfile profile={profile} />}
          <button
            className="sidebar-logout"
            disabled={isBusy}
            onClick={onLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={17} />
            <span>{isBusy ? "Logging out…" : "Log out"}</span>
          </button>
        </div>
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
              <div className="sidebar-footer">
                {profile && <SidebarProfile profile={profile} />}
                <button
                  className="sidebar-logout"
                  disabled={isBusy}
                  onClick={logoutFromMobileNavigation}
                  type="button"
                >
                  <LogOut aria-hidden="true" size={17} />
                  <span>{isBusy ? "Logging out…" : "Log out"}</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
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
