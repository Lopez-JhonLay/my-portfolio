import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";

import { ApplicationError } from "../middleware/application-error.ts";
import {
  contentSectionKeySchema,
  parseContentDocument,
  type ContentSectionKey,
} from "./content-contract.ts";
import type { AdminContentReadRepository } from "./content-repository.ts";
import type {
  ContentCommandResult,
  ContentMutationService,
  ContentOperationReadResult,
  ContentOperationView,
} from "./content-service.ts";

const operationIdSchema = z.uuid();
const sectionPathSchema = z.strictObject({
  sectionKey: contentSectionKeySchema,
});
const operationPathSchema = z.strictObject({ operationId: operationIdSchema });
const saveBodySchema = z.strictObject({
  expectedRevision: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .transform((value) => BigInt(value)),
  document: z.unknown(),
});

function validationError(error: z.ZodError): ApplicationError {
  return new ApplicationError({
    code: "VALIDATION_ERROR",
    message: "The request is invalid.",
    status: 422,
    details: {
      issues: error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.map(String),
      })),
    },
  });
}

function parse<Output>(schema: z.ZodType<Output>, input: unknown): Output {
  const result = schema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

function operationId(headers: Record<string, unknown>): string {
  return parse(operationIdSchema, headers["idempotency-key"]);
}

function notFound(): ApplicationError {
  return new ApplicationError({
    code: "NOT_FOUND",
    message: "The requested resource was not found.",
    status: 404,
  });
}

function operationConflict(): ApplicationError {
  return new ApplicationError({
    code: "OPERATION_CONFLICT",
    message: "The operation identifier was already used for another request.",
    status: 409,
  });
}

function sectionDto(section: {
  readonly sectionKey: ContentSectionKey;
  readonly revision: bigint;
  readonly document: unknown;
  readonly isPublished: boolean;
}) {
  return {
    sectionKey: section.sectionKey,
    revision: section.revision.toString(),
    isPublished: section.isPublished,
    document: parseContentDocument(section.sectionKey, section.document),
  };
}

function operationDto(operation: ContentOperationView) {
  return operation.status === "pending"
    ? operation
    : { ...operation, resultRevision: operation.resultRevision.toString() };
}

function readOperationResponse(result: ContentOperationReadResult) {
  if (result.status === "not-found") throw notFound();
  if (result.status === "operation-conflict") throw operationConflict();
  return operationDto(result);
}

async function mutationResponse(
  result: ContentCommandResult,
  readRepository: AdminContentReadRepository,
) {
  if (result.status === "operation-conflict") throw operationConflict();
  if (result.status === "not-found") throw notFound();
  if (result.status === "pending") {
    return { body: operationDto(result), status: 202 };
  }
  const authoritative = await readRepository.read(result.sectionKey);
  if (authoritative === null) throw notFound();
  if (result.status === "failed") {
    throw new ApplicationError({
      code: "STALE_REVISION",
      message: "The content draft was changed by another request.",
      status: 409,
      details: { authoritative: sectionDto(authoritative) },
    });
  }
  return { body: sectionDto(authoritative), status: 200 };
}

/** Protected API for portfolio content draft administration. */
export function createAdminContentRouter(options: {
  readonly mutationService: ContentMutationService;
  readonly readRepository: AdminContentReadRepository;
  readonly requireAdmin: RequestHandler;
  readonly requireCsrf: RequestHandler;
}): Router {
  const router = Router();
  router.use(options.requireAdmin);

  router.get("/content", async (_request, response) => {
    response.json({
      sections: (await options.readRepository.list()).map(sectionDto),
    });
  });

  router.get("/content/:sectionKey", async (request, response) => {
    const { sectionKey } = parse(sectionPathSchema, request.params);
    const section = await options.readRepository.read(sectionKey);
    if (section === null) throw notFound();
    response.json(sectionDto(section));
  });

  router.put(
    "/content/:sectionKey/draft",
    options.requireCsrf,
    async (request, response) => {
      const { sectionKey } = parse(sectionPathSchema, request.params);
      const body = parse(saveBodySchema, request.body);
      const document = parseContentDocument(sectionKey, body.document);
      const result = await options.mutationService.saveDraft({
        operationId: operationId(request.headers),
        sectionKey,
        expectedRevision: body.expectedRevision,
        document,
      });
      const output = await mutationResponse(result, options.readRepository);
      response.status(output.status).json(output.body);
    },
  );

  router.get("/content-operations/:operationId", async (request, response) => {
    const { operationId: parsedOperationId } = parse(
      operationPathSchema,
      request.params,
    );
    response.json(
      readOperationResponse(
        await options.mutationService.readOperation(parsedOperationId),
      ),
    );
  });

  return router;
}
