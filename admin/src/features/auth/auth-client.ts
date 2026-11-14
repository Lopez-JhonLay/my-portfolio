import { adminRequest } from "../../lib/admin-http";

/** Display-only GitHub profile of the signed-in administrator. */
export type AdminProfile = {
  readonly avatarUrl: string | null;
  readonly login: string;
  readonly name: string | null;
};

export type AdminSession =
  | { readonly authenticated: false }
  | {
      readonly authenticated: true;
      readonly csrfToken: string;
      readonly expiresAt: string;
      readonly profile: AdminProfile | null;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(value: unknown): AdminProfile | null {
  if (value === undefined) return null;
  if (
    !isRecord(value) ||
    typeof value.login !== "string" ||
    (value.name !== null && typeof value.name !== "string") ||
    (value.avatarUrl !== null && typeof value.avatarUrl !== "string")
  ) {
    throw new Error("Invalid session response");
  }
  let avatarUrl: string | null = null;
  if (typeof value.avatarUrl === "string") {
    const url = new URL(value.avatarUrl);
    if (url.protocol === "https:") avatarUrl = url.toString();
  }
  return { avatarUrl, login: value.login, name: value.name };
}

function parseSession(value: unknown): AdminSession {
  if (!isRecord(value) || typeof value.authenticated !== "boolean") {
    throw new Error("Invalid session response");
  }
  if (!value.authenticated && Object.keys(value).length === 1) {
    return { authenticated: false };
  }
  if (
    value.authenticated &&
    typeof value.csrfToken === "string" &&
    typeof value.expiresAt === "string" &&
    Number.isFinite(Date.parse(value.expiresAt)) &&
    Object.keys(value).every((key) =>
      ["authenticated", "csrfToken", "expiresAt", "profile"].includes(key),
    )
  ) {
    return {
      authenticated: true,
      csrfToken: value.csrfToken,
      expiresAt: value.expiresAt,
      profile: parseProfile(value.profile),
    };
  }
  throw new Error("Invalid session response");
}

export function createAuthClient(apiOrigin: string) {
  return {
    getLoginUrl: () => new URL("/api/auth/github", apiOrigin).toString(),
    getSession: async (signal?: AbortSignal) =>
      parseSession(
        await adminRequest(apiOrigin, "/api/auth/session", { signal }),
      ),
    logout: (csrfToken: string, signal?: AbortSignal) =>
      adminRequest(apiOrigin, "/api/auth/logout", {
        csrfToken,
        method: "POST",
        signal,
      }),
  };
}
