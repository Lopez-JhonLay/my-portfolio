import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";

import { ApplicationError } from "../middleware/application-error.ts";
import {
  projectIdSchema,
  projectLifecycleSchema,
  projectPublicationIntentSchema,
  projectVersionSchema,
} from "./project-contract.ts";
import type {
  AdminProjectDraft,
  AdminProjectDraftReadRepository,
} from "./project-draft-read-repository.ts";
import type {
  MutationCommandResult,
  MutationOperationReadResult,
  MutationOperationView,
  ProjectMutationService,
} from "./project-mutation-service.ts";

export type { AdminProjectDraftReadRepository } from "./project-draft-read-repository.ts";

const operationIdSchema = z.uuid();
const apiProjectIdSchema = z
  .uuid()
  .transform((projectId) => projectIdSchema.parse(projectId));
const projectPathSchema = z.strictObject({ projectId: apiProjectIdSchema });
const operationPathSchema = z.strictObject({ operationId: operationIdSchema });
const paginationSchema = z.strictObject({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
const createBodySchema = z.strictObject({ draft: projectVersionSchema });
const saveBodySchema = z.strictObject({
  expectedRevision: z
    .string()
    .regex(/^[1-9][0-9]*$/)
    .transform((value) => BigInt(value)),
  draft: projectVersionSchema,
});
const projectResponseSchema = z.strictObject({
  id: apiProjectIdSchema,
  lifecycle: projectLifecycleSchema,
  publicationIntent: projectPublicationIntentSchema,
  revision: z.string().regex(/^[1-9][0-9]*$/),
  draft: projectVersionSchema,
});
const operationKindSchema = z.enum([
  "save_project_draft",
  "save_featured_draft",
]);
const operationOutcomeSchema = z.enum([
  "project_draft_created",
  "project_draft_saved",
  "featured_draft_saved",
  "stale_revision",
  "invalid_featured_reference",
]);
const operationResponseSchema = z.union([
  z.strictObject({
    operationId: operationIdSchema,
    kind: operationKindSchema,
    projectId: apiProjectIdSchema.nullable(),
    status: z.literal("pending"),
  }),
  z.strictObject({
    operationId: operationIdSchema,
    kind: operationKindSchema,
    projectId: apiProjectIdSchema.nullable(),
    status: z.enum(["succeeded", "failed"]),
    outcomeCode: operationOutcomeSchema,
    resultRevision: z.string().regex(/^[1-9][0-9]*$/),
  }),
]);

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

function projectDto(project: AdminProjectDraft) {
  return projectResponseSchema.parse({
    id: project.id,
    lifecycle: project.lifecycle,
    publicationIntent: project.publicationIntent,
    revision: project.revision.toString(),
    draft: project.draft,
  });
}

function operationDto(operation: MutationOperationView) {
  return operationResponseSchema.parse(
    operation.status === "pending"
      ? operation
      : { ...operation, resultRevision: operation.resultRevision.toString() },
  );
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

async function mutationResponse(
  result: MutationCommandResult,
  readRepository: AdminProjectDraftReadRepository,
  successStatus: number,
) {
  if (result.status === "operation-conflict") throw operationConflict();
  if (result.status === "project-not-found") throw notFound();
  if (result.status === "pending") {
    return { body: operationDto(result), status: 202 };
  }
  if (result.status === "failed") {
    if (result.outcomeCode !== "stale_revision" || result.projectId === null) {
      throw new ApplicationError({
        code: "BAD_REQUEST",
        message: "The draft could not be saved.",
        status: 400,
      });
    }
    const authoritative = await readRepository.read(result.projectId);
    if (authoritative === null) throw notFound();
    throw new ApplicationError({
      code: "STALE_REVISION",
      message: "The Project draft was changed by another request.",
      status: 409,
      details: { authoritative: projectDto(authoritative) },
    });
  }
  if (result.projectId === null) throw notFound();
  const project = await readRepository.read(result.projectId);
  if (project === null) throw notFound();
  return { body: projectDto(project), status: successStatus };
}

function readOperationResponse(result: MutationOperationReadResult) {
  if (result.status === "not-found") throw notFound();
  if (result.status === "operation-conflict") throw operationConflict();
  return operationDto(result);
}

/** Protected local-development API for Project draft administration. */
export function createAdminProjectRouter(options: {
  readonly mutationService: ProjectMutationService;
  readonly readRepository: AdminProjectDraftReadRepository;
  readonly requireAdmin: RequestHandler;
  readonly requireCsrf: RequestHandler;
}): Router {
  const router = Router();
  router.use(options.requireAdmin);

  router.get("/projects", async (request, response) => {
    const { page, pageSize } = parse(paginationSchema, request.query);
    const result = await options.readRepository.list({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    response.json({
      projects: result.projects.map(projectDto),
      pagination: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / pageSize),
      },
    });
  });

  router.get("/projects/:projectId", async (request, response) => {
    const { projectId } = parse(projectPathSchema, request.params);
    const project = await options.readRepository.read(projectId);
    if (project === null) throw notFound();
    response.json(projectDto(project));
  });

  router.post("/projects", options.requireCsrf, async (request, response) => {
    const body = parse(createBodySchema, request.body);
    const result = await options.mutationService.createProjectDraft({
      operationId: operationId(request.headers),
      draft: body.draft,
    });
    const output = await mutationResponse(result, options.readRepository, 201);
    response.status(output.status).json(output.body);
  });

  router.put(
    "/projects/:projectId/draft",
    options.requireCsrf,
    async (request, response) => {
      const { projectId } = parse(projectPathSchema, request.params);
      const body = parse(saveBodySchema, request.body);
      const result = await options.mutationService.saveProjectDraft({
        operationId: operationId(request.headers),
        projectId,
        expectedRevision: body.expectedRevision,
        draft: body.draft,
      });
      const output = await mutationResponse(
        result,
        options.readRepository,
        200,
      );
      response.status(output.status).json(output.body);
    },
  );

  router.get("/project-operations/:operationId", async (request, response) => {
    const { operationId } = parse(operationPathSchema, request.params);
    const result =
      await options.mutationService.readMutationOperation(operationId);
    response.json(readOperationResponse(result));
  });

  return router;
}
