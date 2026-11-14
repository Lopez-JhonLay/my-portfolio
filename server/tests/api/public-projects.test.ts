import express from "express";
import type { Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { errorHandler } from "../../src/middleware/error-handler.ts";
import { createPublicProjectRouter } from "../../src/projects/public-project-router.ts";
import {
  publicFeaturedProjectsSchema,
  publicProjectGroupsSchema,
} from "../../src/projects/public-project-contract.ts";
import type { PublishedProjectReadRepository } from "../../src/projects/published-project-repository.ts";
import { PublishedSnapshotConsistencyError } from "../../src/projects/published-project-repository.ts";

const PUBLIC_ORIGIN = "http://127.0.0.1:5173";
const errorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
  }),
});
const PROJECT = {
  number: "File 01",
  name: "Published Project",
  category: "Personal Project" as const,
  description: "Published description",
  tech: ["TypeScript"],
  repo: "https://example.com/repository",
  slug: "published-project",
};
const FEATURED_PROJECTS = [
  PROJECT,
  { ...PROJECT, name: "Published Project Two", slug: "published-project-two" },
  {
    ...PROJECT,
    name: "Published Project Three",
    slug: "published-project-three",
  },
] as const;

function createRepository(
  status: "never-published" | "published" = "published",
): PublishedProjectReadRepository {
  return {
    readStatus: () => Promise.resolve({ status }),
    readGroups: () =>
      Promise.resolve(
        status === "never-published"
          ? { status }
          : {
              status: "available" as const,
              data: [
                { category: "Personal Project" as const, projects: [PROJECT] },
                { category: "Work Project" as const, projects: [] },
                { category: "Capstone Project" as const, projects: [] },
              ] as const,
            },
      ),
    readFeatured: () =>
      Promise.resolve(
        status === "never-published"
          ? { status }
          : {
              status: "available" as const,
              data: { projects: FEATURED_PROJECTS },
            },
      ),
    readBySlug: () => Promise.resolve({ status: "not-found" }),
  };
}

function createApi(repository: PublishedProjectReadRepository) {
  const app = express();

  app.use((_request, response: Response, next) => {
    response.locals.requestId = "public-projects-test-request";
    next();
  });
  app.use(
    "/api/projects",
    createPublicProjectRouter({ publicOrigin: PUBLIC_ORIGIN, repository }),
  );
  app.use(errorHandler);
  return app;
}

describe("public Projects API", () => {
  it("reports never-published without exposing publication metadata", async () => {
    const response = await request(
      createApi(createRepository("never-published")),
    )
      .get("/api/projects/status")
      .set("Origin", PUBLIC_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["access-control-allow-origin"]).toBe(PUBLIC_ORIGIN);
    expect(response.headers.vary).toContain("Origin");
    expect(response.body).toEqual({ status: "never-published" });
    expect(JSON.stringify(response.body)).not.toMatch(
      /revision|operation|draft|publishedAt/,
    );
  });

  it("returns only published grouped and featured DTO fields", async () => {
    const app = createApi(createRepository());
    const groupedResponse = await request(app).get("/api/projects");
    const featuredResponse = await request(app).get("/api/projects/featured");
    const grouped = publicProjectGroupsSchema.parse(groupedResponse.body);
    const featured = publicFeaturedProjectsSchema.parse(featuredResponse.body);

    expect(groupedResponse.status).toBe(200);
    expect(groupedResponse.headers["cache-control"]).toBe("no-store");
    expect(grouped[0].projects[0]).toEqual(PROJECT);
    expect(featuredResponse.status).toBe(200);
    expect(featured.projects).toHaveLength(3);
    expect(JSON.stringify([grouped, featured])).not.toMatch(
      /lifecycle|publicationIntent|draft|operation|revision/,
    );
  });

  it("returns a non-availability 404 when no publication exists", async () => {
    const app = createApi(createRepository("never-published"));
    const grouped = await request(app).get("/api/projects");
    const featured = await request(app).get("/api/projects/featured");

    expect(grouped.status).toBe(404);
    expect(errorResponseSchema.parse(grouped.body).error.code).toBe(
      "NOT_FOUND",
    );
    expect(featured.status).toBe(404);
    expect(errorResponseSchema.parse(featured.body).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("allows originless reads and rejects unapproved browser origins", async () => {
    const app = createApi(createRepository());
    const originless = await request(app).get("/api/projects/status");
    const rejected = await request(app)
      .get("/api/projects/status")
      .set("Origin", "http://127.0.0.1:9999");

    expect(originless.status).toBe(200);
    expect(originless.headers["access-control-allow-origin"]).toBeUndefined();
    expect(rejected.status).toBe(403);
    expect(rejected.headers["cache-control"]).toBe("no-store");
    expect(errorResponseSchema.parse(rejected.body).error.code).toBe(
      "ORIGIN_NOT_ALLOWED",
    );
  });

  it("returns a redacted availability error for an inconsistent snapshot", async () => {
    const repository = createRepository();
    repository.readFeatured = () =>
      Promise.reject(
        new PublishedSnapshotConsistencyError("sensitive consistency detail"),
      );
    const response = await request(createApi(repository)).get(
      "/api/projects/featured",
    );
    const error = errorResponseSchema.parse(response.body);

    expect(response.status).toBe(503);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(error.error.code).toBe("PUBLISHED_SNAPSHOT_UNAVAILABLE");
    expect(JSON.stringify(error)).not.toContain("sensitive consistency detail");
  });
});
