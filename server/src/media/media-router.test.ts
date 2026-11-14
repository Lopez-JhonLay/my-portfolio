import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import type { MediaService } from "./media-service.ts";
import { createAdminMediaRouter } from "./media-router.ts";

function fakeService(): MediaService {
  return {
    list: vi.fn(() => Promise.resolve([])),
    createUploadIntent: vi.fn(),
    finalize: vi.fn(),
    adminDownloadUrl: vi.fn(),
    publicDownloadUrl: vi.fn(),
    delete: vi.fn(),
  };
}

describe("Admin media router authorization", () => {
  it("does not expose media inventory without an administrator session", async () => {
    const listMedia = vi.fn(() => Promise.resolve([]));
    const service = { ...fakeService(), list: listMedia };
    const app = express().use(
      "/api/admin",
      createAdminMediaRouter({
        service,
        requireAdmin: (_request, response) => {
          response.status(401).json({ error: "unauthorized" });
        },
        requireCsrf: (_request, _response, next) => next(),
      }),
    );

    const response = await request(app).get("/api/admin/media");

    expect(response.status).toBe(401);
    expect(listMedia).not.toHaveBeenCalled();
  });
});
