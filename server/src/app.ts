import { randomUUID } from "node:crypto";

import express from "express";
import type { Express, Response } from "express";

import { healthRouter } from "./health/health-router.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { notFoundHandler } from "./middleware/not-found-handler.ts";

type RequestLocals = {
  requestId: string;
};

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use((_request, response: Response<unknown, RequestLocals>, next) => {
    const requestId = randomUUID();

    response.locals.requestId = requestId;
    response.set("X-Request-Id", requestId);
    next();
  });

  app.use("/health", healthRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
