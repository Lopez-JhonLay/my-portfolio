import { adminRequest } from "../../lib/admin-http";
import {
  PROJECT_CATEGORIES,
  type AdminProject,
  type DraftOperation,
  type ProjectDraft,
  type ProjectList,
  type SaveResult,
} from "./project-contract";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isPositiveIntegerString(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value);
}

function parseProjectDraft(value: unknown): ProjectDraft {
  if (!isRecord(value)) throw new Error("Invalid Project draft response");
  const allowedKeys = [
    "number",
    "name",
    "category",
    "description",
    "role",
    "tech",
    "repo",
    "liveUrl",
    "slug",
    "longDescriptionMarkdown",
    "groupOrder",
  ];
  const requiredStrings = ["number", "name", "description", "slug"];
  if (
    !hasOnlyKeys(value, allowedKeys) ||
    requiredStrings.some((key) => typeof value[key] !== "string") ||
    !PROJECT_CATEGORIES.includes(
      value.category as (typeof PROJECT_CATEGORIES)[number],
    ) ||
    !Array.isArray(value.tech) ||
    !value.tech.every((technology) => typeof technology === "string") ||
    !Number.isInteger(value.groupOrder) ||
    (value.groupOrder as number) <= 0
  ) {
    throw new Error("Invalid Project draft response");
  }
  for (const field of ["role", "repo", "liveUrl", "longDescriptionMarkdown"]) {
    if (value[field] !== undefined && typeof value[field] !== "string")
      throw new Error("Invalid Project draft response");
  }

  return value as ProjectDraft;
}

export function parseAdminProject(value: unknown): AdminProject {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "id",
      "lifecycle",
      "publicationIntent",
      "revision",
      "draft",
    ]) ||
    !isUuid(value.id) ||
    (value.lifecycle !== "active" && value.lifecycle !== "trashed") ||
    (value.publicationIntent !== "include" &&
      value.publicationIntent !== "exclude") ||
    !isPositiveIntegerString(value.revision)
  ) {
    throw new Error("Invalid Project response");
  }
  return {
    id: value.id,
    lifecycle: value.lifecycle,
    publicationIntent: value.publicationIntent,
    revision: value.revision,
    draft: parseProjectDraft(value.draft),
  };
}

function parseOperation(value: unknown): DraftOperation {
  if (
    !isRecord(value) ||
    !isUuid(value.operationId) ||
    (value.kind !== "save_project_draft" &&
      value.kind !== "save_featured_draft") ||
    !(value.projectId === null || isUuid(value.projectId))
  ) {
    throw new Error("Invalid operation response");
  }
  if (
    value.status === "pending" &&
    hasOnlyKeys(value, ["operationId", "kind", "projectId", "status"])
  ) {
    return {
      operationId: value.operationId,
      kind: value.kind,
      projectId: value.projectId,
      status: "pending",
    };
  }
  const outcomes = [
    "project_draft_created",
    "project_draft_saved",
    "featured_draft_saved",
    "stale_revision",
    "invalid_featured_reference",
  ] as const;
  if (
    (value.status === "succeeded" || value.status === "failed") &&
    outcomes.includes(value.outcomeCode as (typeof outcomes)[number]) &&
    isPositiveIntegerString(value.resultRevision) &&
    hasOnlyKeys(value, [
      "operationId",
      "kind",
      "projectId",
      "status",
      "outcomeCode",
      "resultRevision",
    ])
  ) {
    return value as DraftOperation;
  }
  throw new Error("Invalid operation response");
}

function parseSaveResult(value: unknown): SaveResult {
  try {
    return parseAdminProject(value);
  } catch {
    return parseOperation(value);
  }
}

function parseProjectList(value: unknown): ProjectList {
  if (!isRecord(value)) throw new Error("Invalid Project list response");
  const pagination = value.pagination;
  if (
    !hasOnlyKeys(value, ["projects", "pagination"]) ||
    !Array.isArray(value.projects) ||
    !isRecord(pagination) ||
    !hasOnlyKeys(pagination, [
      "page",
      "pageSize",
      "totalItems",
      "totalPages",
    ]) ||
    !["page", "pageSize", "totalItems", "totalPages"].every((key) =>
      Number.isInteger(pagination[key]),
    )
  ) {
    throw new Error("Invalid Project list response");
  }
  return {
    projects: value.projects.map(parseAdminProject),
    pagination: {
      page: pagination.page as number,
      pageSize: pagination.pageSize as number,
      totalItems: pagination.totalItems as number,
      totalPages: pagination.totalPages as number,
    },
  };
}

export function parseAuthoritativeProject(value: unknown): AdminProject | null {
  if (!isRecord(value) || !isRecord(value.authoritative)) return null;
  try {
    return parseAdminProject(value.authoritative);
  } catch {
    return null;
  }
}

export function createProjectClient(apiOrigin: string) {
  return {
    list: async (signal?: AbortSignal) =>
      parseProjectList(
        await adminRequest(
          apiOrigin,
          "/api/admin/projects?page=1&pageSize=100",
          {
            signal,
          },
        ),
      ),
    read: async (projectId: string, signal?: AbortSignal) =>
      parseAdminProject(
        await adminRequest(apiOrigin, `/api/admin/projects/${projectId}`, {
          signal,
        }),
      ),
    create: async (
      operationId: string,
      csrfToken: string,
      draft: ProjectDraft,
      signal?: AbortSignal,
    ) =>
      parseSaveResult(
        await adminRequest(apiOrigin, "/api/admin/projects", {
          body: { draft },
          csrfToken,
          method: "POST",
          operationId,
          signal,
        }),
      ),
    save: async (
      projectId: string,
      operationId: string,
      csrfToken: string,
      expectedRevision: string,
      draft: ProjectDraft,
      signal?: AbortSignal,
    ) =>
      parseSaveResult(
        await adminRequest(
          apiOrigin,
          `/api/admin/projects/${projectId}/draft`,
          {
            body: { draft, expectedRevision },
            csrfToken,
            method: "PUT",
            operationId,
            signal,
          },
        ),
      ),
    readOperation: async (operationId: string, signal?: AbortSignal) =>
      parseOperation(
        await adminRequest(
          apiOrigin,
          `/api/admin/project-operations/${operationId}`,
          { signal },
        ),
      ),
  };
}

export type ProjectClient = ReturnType<typeof createProjectClient>;
