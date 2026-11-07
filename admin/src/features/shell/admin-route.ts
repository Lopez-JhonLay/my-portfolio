export type AdminView =
  | "overview"
  | "projects"
  | "hero"
  | "about"
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
  if (pathname === "/contact") return "contact";
  if (pathname === "/publish") return "publish";
  return null;
}
