import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createAdminAuth } from "../../src/auth/admin-auth.ts";
import { createApp } from "../../src/app.ts";

const ADMIN_ORIGIN = "http://127.0.0.1:5174";
const authenticatedSessionSchema = z.strictObject({
  authenticated: z.literal(true),
  csrfToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
});
const forbiddenErrorSchema = z.object({
  error: z.object({ code: z.literal("FORBIDDEN"), requestId: z.uuid() }),
});

function cookieValue(response: request.Response, name: string): string {
  const setCookie = response.headers["set-cookie"] as unknown;
  const cookies = Array.isArray(setCookie)
    ? setCookie.filter((value): value is string => typeof value === "string")
    : typeof setCookie === "string"
      ? [setCookie]
      : [];
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));

  if (cookie === undefined) throw new Error(`Missing ${name} cookie`);
  return cookie.split(";", 1)[0] ?? "";
}

function requiredHeader(response: request.Response, name: string): string {
  const value = response.headers[name] as unknown;
  if (typeof value !== "string") throw new Error(`Missing ${name} header`);
  return value;
}

function serializedSetCookie(response: request.Response): string {
  const value = response.headers["set-cookie"] as unknown;
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .join(";")
    : typeof value === "string"
      ? value
      : "";
}

function responseBody(response: request.Response): unknown {
  return response.body as unknown;
}

function createTestAuth(userId = "12345678") {
  const auth = createAdminAuth({
    config: {
      adminOrigin: ADMIN_ORIGIN,
      adminUserId: "12345678",
      githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
      githubClientId: "test-github-client-id",
      sessionTtlMs: 60_000,
    },
    githubClient: {
      exchangeCode: () => Promise.resolve({ userId }),
    },
  });

  return {
    auth,
    app: createApp({
      adminOrigin: ADMIN_ORIGIN,
      authRouter: auth.router,
    }),
  };
}

describe("admin authentication API", () => {
  it("completes GitHub OAuth for the allowlisted numeric identity", async () => {
    const { app } = createTestAuth();
    const start = await request(app).get("/api/auth/github");
    const stateCookie = cookieValue(start, "portfolio_cms_oauth_state");
    const authorizationUrl = new URL(requiredHeader(start, "location"));

    expect(start.status).toBe(302);
    expect(authorizationUrl.origin).toBe("https://github.com");
    expect(authorizationUrl.pathname).toBe("/login/oauth/authorize");
    expect(authorizationUrl.searchParams.get("client_id")).toBe(
      "test-github-client-id",
    );
    expect(authorizationUrl.searchParams.get("state")).not.toBeNull();
    expect(serializedSetCookie(start)).toMatch(/HttpOnly.*SameSite=Lax/);

    const callback = await request(app)
      .get("/api/auth/github/callback")
      .set("Cookie", stateCookie)
      .query({
        code: "github-code",
        state: authorizationUrl.searchParams.get("state"),
      });
    const sessionCookie = cookieValue(callback, "portfolio_cms_session");

    expect(callback.status).toBe(302);
    expect(requiredHeader(callback, "location")).toBe(ADMIN_ORIGIN);
    expect(serializedSetCookie(callback)).not.toContain("github-code");

    const session = await request(app)
      .get("/api/auth/session")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", sessionCookie);

    expect(session.status).toBe(200);
    expect(requiredHeader(session, "access-control-allow-origin")).toBe(
      ADMIN_ORIGIN,
    );
    expect(requiredHeader(session, "access-control-allow-credentials")).toBe(
      "true",
    );
    expect(
      authenticatedSessionSchema.parse(responseBody(session)),
    ).toMatchObject({
      authenticated: true,
    });
  });

  it("refuses a GitHub identity outside the numeric allowlist", async () => {
    const { app } = createTestAuth("87654321");
    const start = await request(app).get("/api/auth/github");
    const authorizationUrl = new URL(requiredHeader(start, "location"));
    const callback = await request(app)
      .get("/api/auth/github/callback")
      .set("Cookie", cookieValue(start, "portfolio_cms_oauth_state"))
      .query({
        code: "github-code",
        state: authorizationUrl.searchParams.get("state"),
      });

    expect(callback.status).toBe(403);
    expect(forbiddenErrorSchema.parse(responseBody(callback))).toMatchObject({
      error: { code: "FORBIDDEN" },
    });
    expect(JSON.stringify(responseBody(callback))).not.toContain("87654321");
  });

  it("refuses invalid OAuth state without contacting GitHub", async () => {
    const { app } = createTestAuth();
    const response = await request(app)
      .get("/api/auth/github/callback")
      .set("Cookie", "portfolio_cms_oauth_state=wrong-cookie")
      .query({ code: "github-code", state: "wrong-state" });

    expect(response.status).toBe(400);
    expect(responseBody(response)).toMatchObject({
      error: { code: "INVALID_OAUTH_STATE" },
    });
  });

  it("rejects unapproved origins and requires CSRF for logout", async () => {
    const { app, auth } = createTestAuth();
    const session = auth.sessions.create("12345678");
    const cookie = `portfolio_cms_session=${session.sessionId}`;

    const wrongOrigin = await request(app)
      .get("/api/auth/session")
      .set("Origin", "http://127.0.0.1:9999")
      .set("Cookie", cookie);
    const missingCsrf = await request(app)
      .post("/api/auth/logout")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie);
    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", session.csrfToken);

    expect(wrongOrigin.status).toBe(403);
    expect(responseBody(wrongOrigin)).toMatchObject({
      error: { code: "ORIGIN_NOT_ALLOWED" },
    });
    expect(missingCsrf.status).toBe(403);
    expect(responseBody(missingCsrf)).toMatchObject({
      error: { code: "CSRF_VALIDATION_FAILED" },
    });
    expect(logout.status).toBe(204);
    expect(serializedSetCookie(logout)).toContain("portfolio_cms_session=;");
  });

  it("expires opaque sessions and never exposes administrator identity", async () => {
    let now = Date.parse("2026-11-03T00:00:00.000Z");
    const auth = createAdminAuth({
      config: {
        adminOrigin: ADMIN_ORIGIN,
        adminUserId: "12345678",
        githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
        githubClientId: "test-github-client-id",
        sessionTtlMs: 1_000,
      },
      githubClient: {
        exchangeCode: () => Promise.resolve({ userId: "12345678" }),
      },
      now: () => now,
    });
    const app = createApp({
      adminOrigin: ADMIN_ORIGIN,
      authRouter: auth.router,
    });
    const session = auth.sessions.create("12345678");
    now += 1_001;

    const response = await request(app)
      .get("/api/auth/session")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", `portfolio_cms_session=${session.sessionId}`);

    expect(response.status).toBe(200);
    expect(responseBody(response)).toEqual({ authenticated: false });
    expect(JSON.stringify(responseBody(response))).not.toContain("12345678");
  });
});
