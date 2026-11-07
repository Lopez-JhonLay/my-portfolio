export type AdminView = "overview" | "projects" | "featured" | "publish";

export function resolveAdminView(pathname: string): AdminView | null {
  if (pathname === "/") return "overview";
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return "projects";
  }
  if (pathname === "/featured") return "featured";
  if (pathname === "/publish") return "publish";
  return null;
}
