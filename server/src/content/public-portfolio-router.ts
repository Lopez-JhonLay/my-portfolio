import { Router } from "express";

import { ApplicationError } from "../middleware/application-error.ts";
import { PublishedSnapshotConsistencyError } from "../projects/published-project-repository.ts";
import type { PublicPortfolioRepository } from "./public-portfolio-repository.ts";

export function createPublicPortfolioRouter(options: {
  readonly publicOrigin: string;
  readonly repository: PublicPortfolioRepository;
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

  router.get("/", async (_request, response) => {
    try {
      response.json(await options.repository.read());
    } catch (error) {
      if (error instanceof PublishedSnapshotConsistencyError) {
        throw new ApplicationError({
          code: "PUBLISHED_SNAPSHOT_UNAVAILABLE",
          message: "The published portfolio snapshot is unavailable.",
          status: 503,
        });
      }
      throw error;
    }
  });

  return router;
}
