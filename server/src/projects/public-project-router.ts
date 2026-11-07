import { Router } from "express";

import { ApplicationError } from "../middleware/application-error.ts";
import {
  publicFeaturedProjectsSchema,
  publicProjectGroupsSchema,
  publicProjectStatusSchema,
} from "./public-project-contract.ts";
import {
  PublishedSnapshotConsistencyError,
  type PublishedProjectReadRepository,
  type PublishedReadResult,
} from "./published-project-repository.ts";

function noPublishedSnapshot(): ApplicationError {
  return new ApplicationError({
    code: "NOT_FOUND",
    message: "No published Projects snapshot exists.",
    status: 404,
  });
}

function available<Value>(result: PublishedReadResult<Value>): Value {
  if (result.status === "never-published") throw noPublishedSnapshot();
  return result.data;
}

function unavailableSnapshot(error: unknown): never {
  if (error instanceof PublishedSnapshotConsistencyError) {
    throw new ApplicationError({
      code: "PUBLISHED_SNAPSHOT_UNAVAILABLE",
      message: "The published Projects snapshot is unavailable.",
      status: 503,
    });
  }
  throw error;
}

export function createPublicProjectRouter(options: {
  readonly publicOrigin: string;
  readonly repository: PublishedProjectReadRepository;
}): Router {
  const router = Router();

  router.use((request, response, next) => {
    response.set("Cache-Control", "no-store");
    const origin = request.get("Origin");

    if (origin === undefined) {
      next();
      return;
    }
    if (origin !== options.publicOrigin) {
      next(
        new ApplicationError({
          code: "ORIGIN_NOT_ALLOWED",
          message: "The request origin is not allowed.",
          status: 403,
        }),
      );
      return;
    }

    response.set("Access-Control-Allow-Origin", options.publicOrigin);
    response.vary("Origin");
    next();
  });

  router.get("/status", async (_request, response) => {
    response.json(
      publicProjectStatusSchema.parse(await options.repository.readStatus()),
    );
  });

  router.get("/featured", async (_request, response) => {
    try {
      response.json(
        publicFeaturedProjectsSchema.parse(
          available(await options.repository.readFeatured()),
        ),
      );
    } catch (error) {
      unavailableSnapshot(error);
    }
  });

  router.get("/", async (_request, response) => {
    try {
      response.json(
        publicProjectGroupsSchema.parse(
          available(await options.repository.readGroups()),
        ),
      );
    } catch (error) {
      unavailableSnapshot(error);
    }
  });

  return router;
}
