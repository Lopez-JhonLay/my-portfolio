export type ProjectWorkspaceRoute =
  | { readonly kind: "list" }
  | { readonly kind: "new" }
  | { readonly kind: "edit"; readonly projectId: string };

export function resolveProjectWorkspaceRoute(
  pathname: string,
): ProjectWorkspaceRoute | null {
  if (pathname === "/projects") return { kind: "list" };
  if (pathname === "/projects/new") return { kind: "new" };
  const match = /^\/projects\/([^/]+)$/.exec(pathname);
  if (match?.[1] === undefined) return null;
  try {
    const projectId = decodeURIComponent(match[1]);
    return projectId.length === 0 ? null : { kind: "edit", projectId };
  } catch {
    return null;
  }
}
