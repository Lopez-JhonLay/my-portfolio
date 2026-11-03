import { randomBytes, timingSafeEqual } from "node:crypto";

import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";

import { ApplicationError } from "../middleware/application-error.ts";

const SESSION_COOKIE = "portfolio_cms_session";
const OAUTH_STATE_COOKIE = "portfolio_cms_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1_000;
const githubTokenSchema = z.strictObject({ access_token: z.string().min(1) });
const githubUserSchema = z.strictObject({ id: z.number().int().positive() });
const oauthCallbackSchema = z.strictObject({
  code: z.string().min(1).max(512),
  state: z.string().min(32).max(256),
});

export type AdminAuthConfig = {
  readonly adminOrigin: string;
  readonly adminUserId: string;
  readonly githubCallbackUrl: string;
  readonly githubClientId: string;
  readonly sessionTtlMs: number;
};

export type GitHubOAuthClient = {
  exchangeCode(code: string): Promise<{ readonly userId: string }>;
};

type AdminSession = {
  readonly csrfToken: string;
  readonly expiresAt: number;
  readonly githubUserId: string;
  readonly sessionId: string;
};

function opaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (cookieHeader === undefined) return null;

  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator).trim() !== name) continue;

    try {
      return decodeURIComponent(pair.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

function sessionCookie(sessionId: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function oauthStateCookie(state: string, maxAgeSeconds: number): string {
  return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/api/auth/github; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export class AdminSessionStore {
  readonly #now: () => number;
  readonly #sessionTtlMs: number;
  readonly #sessions = new Map<string, AdminSession>();

  constructor(sessionTtlMs: number, now: () => number = Date.now) {
    this.#sessionTtlMs = sessionTtlMs;
    this.#now = now;
  }

  create(githubUserId: string): AdminSession {
    const session: AdminSession = {
      sessionId: opaqueToken(),
      csrfToken: opaqueToken(),
      githubUserId,
      expiresAt: this.#now() + this.#sessionTtlMs,
    };
    this.#sessions.set(session.sessionId, session);
    return session;
  }

  delete(sessionId: string): void {
    this.#sessions.delete(sessionId);
  }

  read(sessionId: string | null): AdminSession | null {
    if (sessionId === null) return null;
    const session = this.#sessions.get(sessionId);

    if (session === undefined) return null;
    if (session.expiresAt <= this.#now()) {
      this.#sessions.delete(sessionId);
      return null;
    }

    return session;
  }
}

export function createAdminOriginMiddleware(
  adminOrigin: string,
): RequestHandler {
  return (request, response, next) => {
    response.set({
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });

    const origin = request.header("Origin");
    if (origin !== undefined && origin !== adminOrigin) {
      next(
        new ApplicationError({
          code: "ORIGIN_NOT_ALLOWED",
          message: "The request origin is not allowed.",
          status: 403,
        }),
      );
      return;
    }

    if (origin === adminOrigin) {
      response.set({
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers":
          "Content-Type, Idempotency-Key, X-CSRF-Token",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Origin": adminOrigin,
        Vary: "Origin",
      });
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  };
}

export function createGitHubOAuthClient(options: {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly fetchImplementation?: typeof fetch;
}): GitHubOAuthClient {
  const fetchImplementation = options.fetchImplementation ?? fetch;

  return {
    exchangeCode: async (code) => {
      const tokenResponse = await fetchImplementation(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new URLSearchParams({
            client_id: options.clientId,
            client_secret: options.clientSecret,
            code,
          }),
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!tokenResponse.ok) throw new Error("GitHub token exchange failed");
      const token = githubTokenSchema.parse(await tokenResponse.json());
      const userResponse = await fetchImplementation(
        "https://api.github.com/user",
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token.access_token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          redirect: "error",
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!userResponse.ok) throw new Error("GitHub identity lookup failed");
      const user = githubUserSchema.parse(await userResponse.json());

      return { userId: String(user.id) };
    },
  };
}

export function createAdminAuth(options: {
  readonly config: AdminAuthConfig;
  readonly githubClient: GitHubOAuthClient;
  readonly now?: () => number;
}) {
  const now = options.now ?? Date.now;
  const sessions = new AdminSessionStore(options.config.sessionTtlMs, now);
  const oauthStates = new Map<string, number>();
  const router = Router();

  function readSession(cookieHeader: string | undefined) {
    return sessions.read(readCookie(cookieHeader, SESSION_COOKIE));
  }

  const requireAdmin: RequestHandler = (request, _response, next) => {
    const session = readSession(request.header("Cookie"));
    if (
      session === null ||
      session.githubUserId !== options.config.adminUserId
    ) {
      next(
        new ApplicationError({
          code: "UNAUTHORIZED",
          message: "Administrator authentication is required.",
          status: 401,
        }),
      );
      return;
    }
    next();
  };

  const requireCsrf: RequestHandler = (request, _response, next) => {
    const session = readSession(request.header("Cookie"));
    const suppliedToken = request.header("X-CSRF-Token");
    if (
      session === null ||
      suppliedToken === undefined ||
      !constantTimeEqual(session.csrfToken, suppliedToken)
    ) {
      next(
        new ApplicationError({
          code: "CSRF_VALIDATION_FAILED",
          message: "CSRF validation failed.",
          status: 403,
        }),
      );
      return;
    }
    next();
  };

  router.get("/github", (_request, response) => {
    for (const [savedState, expiresAt] of oauthStates) {
      if (expiresAt <= now()) oauthStates.delete(savedState);
    }
    const state = opaqueToken();
    oauthStates.set(state, now() + OAUTH_STATE_TTL_MS);
    const authorizationUrl = new URL(
      "https://github.com/login/oauth/authorize",
    );
    authorizationUrl.searchParams.set(
      "client_id",
      options.config.githubClientId,
    );
    authorizationUrl.searchParams.set(
      "redirect_uri",
      options.config.githubCallbackUrl,
    );
    authorizationUrl.searchParams.set("state", state);

    response.setHeader(
      "Set-Cookie",
      oauthStateCookie(state, OAUTH_STATE_TTL_MS / 1_000),
    );
    response.redirect(authorizationUrl.toString());
  });

  router.get("/github/callback", async (request, response) => {
    const parsed = oauthCallbackSchema.safeParse(request.query);
    const cookieState = readCookie(
      request.header("Cookie"),
      OAUTH_STATE_COOKIE,
    );
    const expiresAt = parsed.success
      ? oauthStates.get(parsed.data.state)
      : undefined;

    if (
      !parsed.success ||
      cookieState === null ||
      !constantTimeEqual(cookieState, parsed.data.state) ||
      expiresAt === undefined ||
      expiresAt <= now()
    ) {
      throw new ApplicationError({
        code: "INVALID_OAUTH_STATE",
        message: "The OAuth request is invalid or expired.",
        status: 400,
      });
    }
    oauthStates.delete(parsed.data.state);

    const identity = await options.githubClient.exchangeCode(parsed.data.code);
    if (identity.userId !== options.config.adminUserId) {
      throw new ApplicationError({
        code: "FORBIDDEN",
        message: "This GitHub identity is not authorized.",
        status: 403,
      });
    }

    const session = sessions.create(identity.userId);
    response.setHeader("Set-Cookie", [
      oauthStateCookie("", 0),
      sessionCookie(session.sessionId, options.config.sessionTtlMs / 1_000),
    ]);
    response.redirect(options.config.adminOrigin);
  });

  router.get("/session", (request, response) => {
    const session = readSession(request.header("Cookie"));
    if (session === null) {
      response.json({ authenticated: false });
      return;
    }

    response.json({
      authenticated: true,
      csrfToken: session.csrfToken,
      expiresAt: new Date(session.expiresAt).toISOString(),
    });
  });

  router.post("/logout", requireAdmin, requireCsrf, (request, response) => {
    const sessionId = readCookie(request.header("Cookie"), SESSION_COOKIE);
    if (sessionId !== null) sessions.delete(sessionId);
    response.setHeader("Set-Cookie", sessionCookie("", 0));
    response.status(204).end();
  });

  return { requireAdmin, requireCsrf, router, sessions };
}
