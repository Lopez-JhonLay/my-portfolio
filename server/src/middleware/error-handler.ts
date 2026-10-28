import type { NextFunction, Request, Response } from "express";

type RequestLocals = {
  requestId: string;
};

type InternalServerErrorResponse = {
  error: {
    code: "INTERNAL_SERVER_ERROR";
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
