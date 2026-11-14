export type AdminView =
  | "overview"
  | "projects"
  | "hero"
  | "about"
  | "timeline"
  | "technologies"
  | "contact"
  | "featured"
  | "publish";

export function resolveAdminView(pathname: string): AdminView | null {
  if (pathname === "/") return "overview";
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return "projects";
  }
  if (pathname === "/featured") return "featured";
  if (pathname === "/hero") return "hero";
  if (pathname === "/about") return "about";
  if (pathname === "/timeline") return "timeline";
  if (pathname === "/technologies") return "technologies";
  if (pathname === "/contact") return "contact";
  if (pathname === "/publish") return "publish";
  return null;
}
