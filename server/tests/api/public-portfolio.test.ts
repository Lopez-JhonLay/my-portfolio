import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createPublicPortfolioRouter } from "../../src/content/public-portfolio-router.ts";
import type { PublicPortfolioRepository } from "../../src/content/public-portfolio-repository.ts";
import { errorHandler } from "../../src/middleware/error-handler.ts";

const PUBLIC_ORIGIN = "http://127.0.0.1:5173";

function createApi(repository: PublicPortfolioRepository) {
  const app = express();
  app.use(
    "/api/portfolio",
    createPublicPortfolioRouter({ publicOrigin: PUBLIC_ORIGIN, repository }),
  );
  app.use(errorHandler);
  return app;
}

describe("public portfolio API", () => {
  it("returns an explicit migration fallback state before publication", async () => {
    const repository: PublicPortfolioRepository = {
      read: () => Promise.resolve({ status: "never-published", sections: [] }),
    };
    const response = await request(createApi(repository)).get("/api/portfolio");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({ status: "never-published", sections: [] });
  });

  it("returns only the published portfolio snapshot and accepts its public origin", async () => {
    const repository: PublicPortfolioRepository = {
      read: () =>
        Promise.resolve({
          status: "published",
          snapshotRevision: "4",
          sections: [
            {
              sectionKey: "media-resume",
              document: {
                profileImageMediaId: null,
                resumeMediaId: null,
              },
            },
          ],
          featuredProjects: { projects: [] as never },
          projectGroups: [] as never,
        }),
    };
    const response = await request(createApi(repository))
      .get("/api/portfolio")
      .set("Origin", PUBLIC_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(PUBLIC_ORIGIN);
    expect(response.body).toMatchObject({ snapshotRevision: "4" });
    expect(JSON.stringify(response.body)).not.toMatch(
      /draft|operation|requestFingerprint|updatedAt/,
    );
  });
});
