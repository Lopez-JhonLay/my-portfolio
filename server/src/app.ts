import { randomUUID } from "node:crypto";

import express from "express";
import type { Express, Response, Router } from "express";

import { createAdminOriginMiddleware } from "./auth/admin-auth.ts";
import { healthRouter } from "./health/health-router.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { notFoundHandler } from "./middleware/not-found-handler.ts";

type RequestLocals = {
  requestId: string;
};

export type AppOptions = {
  readonly adminOrigin: string;
  readonly adminProjectRouter?: Router;
  readonly authRouter: Router;
};

export function createApp(options?: AppOptions): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use((_request, response: Response<unknown, RequestLocals>, next) => {
    const requestId = randomUUID();

    response.locals.requestId = requestId;
    response.set("X-Request-Id", requestId);
    next();
  });

  app.use(express.json({ limit: "32kb", strict: true }));

  app.use("/health", healthRouter);
  if (options !== undefined) {
    const originMiddleware = createAdminOriginMiddleware(options.adminOrigin);
    app.use("/api/auth", originMiddleware, options.authRouter);
    if (options.adminProjectRouter !== undefined) {
      app.use("/api/admin", originMiddleware, options.adminProjectRouter);
    }
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
