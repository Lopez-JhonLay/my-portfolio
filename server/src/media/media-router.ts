import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";

import { ApplicationError } from "../middleware/application-error.ts";
import {
  mediaAssetIdSchema,
  uploadIntentSchema,
  type MediaAsset,
} from "./media-contract.ts";
import type { MediaService } from "./media-service.ts";

const pathSchema = z.strictObject({ mediaId: mediaAssetIdSchema });

function invalidRequest(): ApplicationError {
  return new ApplicationError({
    code: "VALIDATION_ERROR",
    message: "The media request is invalid.",
    status: 422,
  });
}

function parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
  const result = schema.safeParse(input);
  if (!result.success) throw invalidRequest();
  return result.data;
}

function notFound(): ApplicationError {
  return new ApplicationError({
    code: "NOT_FOUND",
    message: "The requested media was not found.",
    status: 404,
  });
}

function assetDto(asset: MediaAsset) {
  return {
    id: asset.id,
    kind: asset.kind,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    originalFilename: asset.originalFilename,
    status: asset.status,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export function createAdminMediaRouter(options: {
  readonly service: MediaService;
  readonly requireAdmin: RequestHandler;
  readonly requireCsrf: RequestHandler;
}): Router {
  const router = Router();
  router.use(options.requireAdmin);

  router.get("/media", async (_request, response) => {
    response.json({ assets: (await options.service.list()).map(assetDto) });
  });

  router.post(
    "/media/upload-intents",
    options.requireCsrf,
    async (request, response) => {
      const result = await options.service.createUploadIntent(
        parse(uploadIntentSchema, request.body),
      );
      response
        .status(201)
        .json({ asset: assetDto(result.asset), upload: result.upload });
    },
  );

  router.post(
    "/media/:mediaId/finalize",
    options.requireCsrf,
    async (request, response) => {
      const { mediaId } = parse(pathSchema, request.params);
      const asset = await options.service.finalize(mediaId);
      if (asset === null) throw notFound();
      if (asset.status !== "ready") {
        throw new ApplicationError({
          code: "MEDIA_VERIFICATION_FAILED",
          message:
            "The uploaded file did not match the requested type or size.",
          status: 422,
        });
      }
      response.json(assetDto(asset));
    },
  );

  router.get("/media/:mediaId/file", async (request, response) => {
    const { mediaId } = parse(pathSchema, request.params);
    const url = await options.service.adminDownloadUrl(mediaId);
    if (url === null) throw notFound();
    response.redirect(302, url);
  });

  router.delete(
    "/media/:mediaId",
    options.requireCsrf,
    async (request, response) => {
      const { mediaId } = parse(pathSchema, request.params);
      const result = await options.service.delete(mediaId);
      if (result === "not-found") throw notFound();
      if (result === "referenced") {
        throw new ApplicationError({
          code: "MEDIA_IN_USE",
          message:
            "Remove all draft and published references before deleting this file.",
          status: 409,
        });
      }
      response.status(204).end();
    },
  );

  return router;
}

export function createPublicMediaRouter(service: MediaService): Router {
  const router = Router();
  router.get("/:mediaId", async (request, response) => {
    const { mediaId } = parse(pathSchema, request.params);
    const url = await service.publicDownloadUrl(mediaId);
    if (url === null) throw notFound();
    response.set("Cache-Control", "public, max-age=300, must-revalidate");
    response.redirect(302, url);
  });
  return router;
}
