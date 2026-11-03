import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createAdminAuth,
  createGitHubOAuthClient,
} from "../../src/auth/admin-auth.ts";
import { createApp } from "../../src/app.ts";

const ADMIN_ORIGIN = "http://127.0.0.1:5174";
const GITHUB_OAUTH_ISSUER = "https://github.com/login/oauth";
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

describe("GitHub OAuth client", () => {
  it("accepts documented fields in GitHub token and user responses", async () => {
    const responses = [
      new Response(
        JSON.stringify({
          access_token: "synthetic-access-token",
          scope: "",
          token_type: "bearer",
        }),
        { status: 200 },
      ),
      new Response(
        JSON.stringify({
          id: 12_345_678,
          login: "synthetic-admin",
          node_id: "synthetic-node-id",
        }),
        { status: 200 },
      ),
    ];
    const fetchImplementation: typeof fetch = () => {
      const response = responses.shift();
      if (response === undefined) {
        throw new Error("Unexpected GitHub request");
      }
      return Promise.resolve(response);
    };
    const client = createGitHubOAuthClient({
      clientId: "test-github-client-id",
      clientSecret: "test-github-client-secret",
      fetchImplementation,
    });

    await expect(client.exchangeCode("synthetic-code")).resolves.toEqual({
      userId: "12345678",
    });
  });
});

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

  it("round-trips OAuth state through a browser cookie jar exactly once", async () => {
    const { app } = createTestAuth();
    const browser = request.agent(app);
    const start = await browser.get("/api/auth/github");
    const authorizationUrl = new URL(requiredHeader(start, "location"));
    const state = authorizationUrl.searchParams.get("state");

    expect(serializedSetCookie(start)).toMatch(
      /Path=\/api\/auth\/github; HttpOnly; SameSite=Lax; Max-Age=600/,
    );

    const callback = await browser
      .get("/api/auth/github/callback")
      .query({ code: "github-code", state });
    const replay = await browser
      .get("/api/auth/github/callback")
      .query({ code: "github-code", state });

    expect(callback.status).toBe(302);
    expect(requiredHeader(callback, "location")).toBe(ADMIN_ORIGIN);
    expect(replay.status).toBe(400);
    expect(responseBody(replay)).toMatchObject({
      error: { code: "INVALID_OAUTH_STATE" },
    });
  });

  it("accepts only the expected optional GitHub OAuth issuer", async () => {
    const expectedIssuerBrowser = request.agent(createTestAuth().app);
    const expectedIssuerStart =
      await expectedIssuerBrowser.get("/api/auth/github");
    const expectedIssuerAuthorizationUrl = new URL(
      requiredHeader(expectedIssuerStart, "location"),
    );
    const expectedIssuerCallback = await expectedIssuerBrowser
      .get("/api/auth/github/callback")
      .query({
        code: "github-code",
        iss: GITHUB_OAUTH_ISSUER,
        state: expectedIssuerAuthorizationUrl.searchParams.get("state"),
      });

    const mismatchedIssuerBrowser = request.agent(createTestAuth().app);
    const mismatchedIssuerStart =
      await mismatchedIssuerBrowser.get("/api/auth/github");
    const mismatchedIssuerAuthorizationUrl = new URL(
      requiredHeader(mismatchedIssuerStart, "location"),
    );
    const mismatchedIssuerState =
      mismatchedIssuerAuthorizationUrl.searchParams.get("state");
    const mismatchedIssuerCallback = await mismatchedIssuerBrowser
      .get("/api/auth/github/callback")
      .query({
        code: "github-code",
        iss: "https://example.invalid/login/oauth",
        state: mismatchedIssuerState,
      });
    const callbackWithoutIssuer = await mismatchedIssuerBrowser
      .get("/api/auth/github/callback")
      .query({ code: "github-code", state: mismatchedIssuerState });

    expect(expectedIssuerCallback.status).toBe(302);
    expect(mismatchedIssuerCallback.status).toBe(400);
    expect(responseBody(mismatchedIssuerCallback)).toMatchObject({
      error: { code: "INVALID_OAUTH_STATE" },
    });
    expect(callbackWithoutIssuer.status).toBe(302);
  });

  it("does not consume valid OAuth state when a mismatched callback arrives", async () => {
    const { app } = createTestAuth();
    const browser = request.agent(app);
    const start = await browser.get("/api/auth/github");
    const authorizationUrl = new URL(requiredHeader(start, "location"));
    const state = authorizationUrl.searchParams.get("state");

    const mismatched = await browser.get("/api/auth/github/callback").query({
      code: "github-code",
      state: "synthetic-mismatched-state-value-123456",
    });
    const valid = await browser
      .get("/api/auth/github/callback")
      .query({ code: "github-code", state });

    expect(mismatched.status).toBe(400);
    expect(responseBody(mismatched)).toMatchObject({
      error: { code: "INVALID_OAUTH_STATE" },
    });
    expect(valid.status).toBe(302);
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
