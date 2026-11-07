export const ADMIN_THEME_STORAGE_KEY = "portfolio-cms:admin-theme";

export type AdminTheme = "light" | "dark";

export function getNextAdminTheme(theme: AdminTheme): AdminTheme {
  return theme === "light" ? "dark" : "light";
}

type ThemeReader = Pick<Storage, "getItem">;
type ThemeWriter = Pick<Storage, "setItem">;
type ThemeRoot = {
  readonly classList: Pick<DOMTokenList, "toggle">;
  readonly style: Pick<CSSStyleDeclaration, "colorScheme">;
};

export function readStoredAdminTheme(storage: ThemeReader): AdminTheme {
  try {
    return storage.getItem(ADMIN_THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function applyAdminTheme(root: ThemeRoot, theme: AdminTheme): void {
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function writeStoredAdminTheme(
  storage: ThemeWriter,
  theme: AdminTheme,
): void {
  try {
    storage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    // The in-memory theme remains usable when browser storage is unavailable.
  }
}

export function setAdminTheme(
  root: ThemeRoot,
  storage: ThemeWriter,
  theme: AdminTheme,
): void {
  applyAdminTheme(root, theme);
  writeStoredAdminTheme(storage, theme);
}

export function initializeAdminTheme(): AdminTheme {
  const theme = readStoredAdminTheme(window.localStorage);
  applyAdminTheme(document.documentElement, theme);
  return theme;
}
