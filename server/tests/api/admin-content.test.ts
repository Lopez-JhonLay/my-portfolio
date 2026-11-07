import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createAdminAuth } from "../../src/auth/admin-auth.ts";
import { createAdminContentRouter } from "../../src/content/admin-content-router.ts";
import { parseContentDocument } from "../../src/content/content-contract.ts";
import type { AdminContentReadRepository } from "../../src/content/content-repository.ts";
import type { ContentMutationService } from "../../src/content/content-service.ts";
import { errorHandler } from "../../src/middleware/error-handler.ts";

const ADMIN_ORIGIN = "http://127.0.0.1:5174";
const OPERATION_ID = "11111111-1111-4111-8111-111111111111";
const HERO_DOCUMENT = parseContentDocument("hero", {
  browserTitle: "Portfolio",
  name: "Jhon Lay Lopez",
  brand: "JL",
  role: "Software Engineer",
  heroRole: "Application Developer",
  location: "Pasay, Philippines",
  navigation: [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Projects", href: "/#projects" },
    { label: "Experience", href: "/#experience" },
    { label: "Skills", href: "/#skills" },
    { label: "Contact", href: "/#contact" },
  ],
  sectionTag: "Open file",
  title: "Web & Mobile",
  description: "Practical software.",
  resumeButtonLabel: "Download Portfolio",
  scrollCue: "Descend",
});

function createApi() {
  const section = {
    sectionKey: "hero" as const,
    revision: 2n,
    isPublished: false,
    document: HERO_DOCUMENT,
  };
  const readRepository: AdminContentReadRepository = {
    list: () => Promise.resolve([section]),
    read: (sectionKey) =>
      Promise.resolve(sectionKey === "hero" ? section : null),
  };
  const mutationService: ContentMutationService = {
    saveDraft: () =>
      Promise.resolve({
        operationId: OPERATION_ID,
        kind: "save_content_draft",
        sectionKey: "hero",
        status: "succeeded",
        outcomeCode: "content_draft_saved",
        resultRevision: 2n,
      }),
    readOperation: () => Promise.resolve({ status: "not-found" }),
  };
  const auth = createAdminAuth({
    config: {
      adminOrigin: ADMIN_ORIGIN,
      adminUserId: "12345678",
      githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
      githubClientId: "test-client-id",
      sessionTtlMs: 60_000,
    },
    githubClient: {
      exchangeCode: () => Promise.resolve({ userId: "12345678" }),
    },
  });
  const session = auth.sessions.create("12345678");
  const app = express();
  app.use(express.json());
  app.use(
    "/api/admin",
    createAdminContentRouter({
      mutationService,
      readRepository,
      requireAdmin: auth.requireAdmin,
      requireCsrf: auth.requireCsrf,
    }),
  );
  app.use(errorHandler);
  return {
    app,
    cookie: `portfolio_cms_session=${session.sessionId}`,
    csrfToken: session.csrfToken,
  };
}

describe("authenticated content API", () => {
  it("protects reads and returns only the section DTO allowlist", async () => {
    const context = createApi();
    const unauthorized = await request(context.app).get("/api/admin/content");
    const authorized = await request(context.app)
      .get("/api/admin/content")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", context.cookie);

    expect(unauthorized.status).toBe(401);
    expect(authorized.status).toBe(200);
    expect(authorized.body).toEqual({
      sections: [
        {
          sectionKey: "hero",
          revision: "2",
          isPublished: false,
          document: HERO_DOCUMENT,
        },
      ],
    });
    expect(JSON.stringify(authorized.body)).not.toMatch(
      /requestFingerprint|updatedAt/,
    );
  });

  it("requires CSRF and a client operation ID for explicit saves", async () => {
    const context = createApi();
    const missingCsrf = await request(context.app)
      .put("/api/admin/content/hero/draft")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", context.cookie)
      .set("Idempotency-Key", OPERATION_ID)
      .send({ expectedRevision: "1", document: HERO_DOCUMENT });
    const saved = await request(context.app)
      .put("/api/admin/content/hero/draft")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", context.cookie)
      .set("X-CSRF-Token", context.csrfToken)
      .set("Idempotency-Key", OPERATION_ID)
      .send({ expectedRevision: "1", document: HERO_DOCUMENT });

    expect(missingCsrf.status).toBe(403);
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({
      sectionKey: "hero",
      revision: "2",
    });
  });
});
