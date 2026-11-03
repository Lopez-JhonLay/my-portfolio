import type { NextFunction, Request, Response } from "express";

import { ApplicationError } from "./application-error.ts";

type RequestLocals = {
  requestId: string;
};

type InternalServerErrorResponse = {
  error: {
    code: string;
    details?: unknown;
    message: string;
    requestId: string;
  };
};

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response<InternalServerErrorResponse, RequestLocals>,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  const requestId = response.locals.requestId;
  if (error instanceof ApplicationError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        requestId,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "The request body is malformed.",
        requestId,
      },
    });
    return;
  }

  const errorName = error instanceof Error ? error.name : "UnknownError";

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "request_failed",
      requestId,
      method: request.method,
      errorName,
    }),
  );

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      requestId,
    },
  });
}
