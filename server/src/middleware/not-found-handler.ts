import type { Request, Response } from "express";

type RequestLocals = {
  requestId: string;
};

type NotFoundResponse = {
  error: {
    code: "NOT_FOUND";
    message: string;
    requestId: string;
  };
};

export function notFoundHandler(
  _request: Request,
  response: Response<NotFoundResponse, RequestLocals>,
): void {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found.",
      requestId: response.locals.requestId,
    },
  });
}
