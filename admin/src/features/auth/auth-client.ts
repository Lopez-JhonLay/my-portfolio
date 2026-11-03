import { adminRequest } from "../../lib/admin-http";

export type AdminSession =
  | { readonly authenticated: false }
  | {
      readonly authenticated: true;
      readonly csrfToken: string;
      readonly expiresAt: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      ["authenticated", "csrfToken", "expiresAt"].includes(key),
    )
  ) {
    return {
      authenticated: true,
      csrfToken: value.csrfToken,
      expiresAt: value.expiresAt,
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
