import express from "express";
import type { Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/app.ts";
import { errorHandler } from "../../src/middleware/error-handler.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestLocals = {
  requestId: string;
};

describe("server application", () => {
  it("returns a no-store health response with unique request IDs", async () => {
    const app = createApp();
    const firstResponse = await request(app).get("/health");
    const secondResponse = await request(app).get("/health");
    const firstRequestId = firstResponse.headers["x-request-id"];
    const secondRequestId = secondResponse.headers["x-request-id"];

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers["content-type"]).toMatch(
      /^application\/json\b/,
    );
    expect(firstResponse.headers["cache-control"]).toBe("no-store");
    expect(firstResponse.headers["x-powered-by"]).toBeUndefined();
    expect(firstResponse.body).toEqual({ status: "ok" });
    expect(firstRequestId).toMatch(UUID_PATTERN);
    expect(secondRequestId).toMatch(UUID_PATTERN);
    expect(firstRequestId).not.toBe(secondRequestId);
  });

  it("returns the standardized 404 response for an unknown route", async () => {
    const response = await request(createApp()).get("/missing");
    const requestId = response.headers["x-request-id"];

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/^application\/json\b/);
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(requestId).toMatch(UUID_PATTERN);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
        requestId,
      },
    });
  });

  it("returns the standardized 404 response for an unsupported method", async () => {
    const response = await request(createApp()).post("/health");
    const requestId = response.headers["x-request-id"];

    expect(response.status).toBe(404);
    expect(requestId).toMatch(UUID_PATTERN);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
        requestId,
      },
    });
  });

  it("returns and logs a sanitized internal error", async () => {
    const app = express();
    const requestId = "error-test-request-id";
    const sensitiveMessage = "sensitive implementation detail";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    app.use((_request, response: Response<unknown, RequestLocals>, next) => {
      response.locals.requestId = requestId;
      response.set("X-Request-Id", requestId);
      next();
    });
    app.get("/error", () => {
      throw new Error(sensitiveMessage);
    });
    app.use(errorHandler);

    try {
      const response = await request(app).get("/error");

      expect(response.status).toBe(500);
      expect(response.headers["content-type"]).toMatch(/^application\/json\b/);
      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          requestId,
        },
      });
      expect(JSON.stringify(response.body)).not.toContain(sensitiveMessage);
      expect(consoleError).toHaveBeenCalledOnce();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('"event":"request_failed"'),
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(`"requestId":"${requestId}"`),
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('"method":"GET"'),
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('"errorName":"Error"'),
      );
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining(sensitiveMessage),
      );
      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('"stack"'),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
