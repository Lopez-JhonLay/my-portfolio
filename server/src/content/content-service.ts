import { createHash } from "node:crypto";

import type { TransactionSessionBoundary } from "../db/database-session.ts";
import {
  parseContentDocument,
  type ContentDocument,
  type ContentSectionKey,
  type ContentSectionRecord,
} from "./content-contract.ts";

export type ContentOperationRecord = {
  readonly operationId: string;
  readonly kind: "save_content_draft";
  readonly sectionKey: ContentSectionKey;
  readonly requestFingerprint: string;
  readonly status: "pending" | "succeeded" | "failed";
  readonly outcomeCode: string | null;
  readonly resultRevision: bigint | null;
};

export type ContentOperationLookup =
  | ContentOperationRecord
  | { readonly operationId: string; readonly kind: "foreign" };

export type ContentOperationView =
  | {
      readonly operationId: string;
      readonly kind: "save_content_draft";
      readonly sectionKey: ContentSectionKey;
      readonly status: "pending";
    }
  | {
      readonly operationId: string;
      readonly kind: "save_content_draft";
      readonly sectionKey: ContentSectionKey;
      readonly status: "succeeded" | "failed";
      readonly outcomeCode: "content_draft_saved" | "stale_revision";
      readonly resultRevision: bigint;
    };

export type ContentCommandResult =
  | ContentOperationView
  | { readonly operationId: string; readonly status: "operation-conflict" }
  | { readonly sectionKey: ContentSectionKey; readonly status: "not-found" };

export type ContentOperationReadResult =
  | ContentOperationView
  | { readonly operationId: string; readonly status: "operation-conflict" }
  | { readonly status: "not-found" };

export type ContentMutationQueries = {
  readOperation(operationId: string): Promise<ContentOperationLookup | null>;
  lockOperation(operationId: string): Promise<ContentOperationLookup | null>;
  insertOperation(operation: ContentOperationRecord): Promise<boolean>;
  completeOperation(
    operationId: string,
    completion: {
      readonly status: "succeeded" | "failed";
      readonly outcomeCode: "content_draft_saved" | "stale_revision";
      readonly resultRevision: bigint;
    },
  ): Promise<boolean>;
  lockSection(
    sectionKey: ContentSectionKey,
  ): Promise<ContentSectionRecord | null>;
  updateSection(
    sectionKey: ContentSectionKey,
    expectedRevision: bigint,
    document: ContentDocument,
  ): Promise<bigint | null>;
};

export type ContentMutationService = {
  saveDraft(command: {
    readonly operationId: string;
    readonly sectionKey: ContentSectionKey;
    readonly expectedRevision: bigint;
    readonly document: ContentDocument;
  }): Promise<ContentCommandResult>;
  readOperation(operationId: string): Promise<ContentOperationReadResult>;
};

export class ContentMutationConsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentMutationConsistencyError";
  }
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function operationView(
  operation: ContentOperationRecord,
): ContentOperationView {
  const base = {
    operationId: operation.operationId,
    kind: operation.kind,
    sectionKey: operation.sectionKey,
  } as const;
  if (operation.status === "pending") return { ...base, status: "pending" };
  if (
    (operation.outcomeCode !== "content_draft_saved" &&
      operation.outcomeCode !== "stale_revision") ||
    operation.resultRevision === null
  ) {
    throw new ContentMutationConsistencyError(
      "Terminal content operation has an invalid persisted outcome",
    );
  }
  return {
    ...base,
    status: operation.status,
    outcomeCode: operation.outcomeCode,
    resultRevision: operation.resultRevision,
  };
}

function matches(
  operation: ContentOperationLookup,
  expected: {
    readonly sectionKey: ContentSectionKey;
    readonly requestFingerprint: string;
  },
): boolean {
  return (
    operation.kind === "save_content_draft" &&
    operation.sectionKey === expected.sectionKey &&
    operation.requestFingerprint === expected.requestFingerprint
  );
}

export function createContentMutationService<Session>(
  sessions: TransactionSessionBoundary<Session>,
  createQueries: (session: Session) => ContentMutationQueries,
): ContentMutationService {
  return {
    saveDraft: async ({
      operationId,
      sectionKey,
      expectedRevision,
      document,
    }) => {
      const normalizedDocument = parseContentDocument(sectionKey, document);
      const expected = {
        sectionKey,
        requestFingerprint: fingerprint({
          action: "save_content_draft",
          sectionKey,
          expectedRevision: expectedRevision.toString(),
          document: normalizedDocument,
        }),
      };
      const claim = await sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const existing = await queries.readOperation(operationId);
        if (existing !== null) {
          return matches(existing, expected)
            ? operationView(existing as ContentOperationRecord)
            : { operationId, status: "operation-conflict" as const };
        }
        const current = await queries.lockSection(sectionKey);
        if (current === null)
          return { sectionKey, status: "not-found" as const };
        const operation: ContentOperationRecord = {
          operationId,
          kind: "save_content_draft",
          sectionKey,
          requestFingerprint: expected.requestFingerprint,
          status: "pending",
          outcomeCode: null,
          resultRevision: null,
        };
        if (await queries.insertOperation(operation)) {
          return { status: "claimed" as const };
        }
        const raced = await queries.readOperation(operationId);
        if (raced === null) {
          throw new ContentMutationConsistencyError(
            "Conflicting content operation could not be read",
          );
        }
        return matches(raced, expected)
          ? operationView(raced as ContentOperationRecord)
          : { operationId, status: "operation-conflict" as const };
      });
      if (claim.status !== "claimed") return claim;

      return sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const operation = await queries.lockOperation(operationId);
        if (operation === null) {
          throw new ContentMutationConsistencyError(
            "Claimed content operation is missing",
          );
        }
        if (!matches(operation, expected)) {
          return { operationId, status: "operation-conflict" as const };
        }
        if (operation.kind === "foreign") {
          return { operationId, status: "operation-conflict" as const };
        }
        if (operation.status !== "pending") return operationView(operation);

        const current = await queries.lockSection(sectionKey);
        if (current === null) {
          throw new ContentMutationConsistencyError(
            "Claimed content section is missing",
          );
        }
        let completion: {
          status: "succeeded" | "failed";
          outcomeCode: "content_draft_saved" | "stale_revision";
          resultRevision: bigint;
        };
        if (current.revision === expectedRevision) {
          const resultRevision = await queries.updateSection(
            sectionKey,
            expectedRevision,
            normalizedDocument,
          );
          if (resultRevision === null) {
            throw new ContentMutationConsistencyError(
              "Locked content section changed unexpectedly",
            );
          }
          completion = {
            status: "succeeded",
            outcomeCode: "content_draft_saved",
            resultRevision,
          };
        } else {
          completion = {
            status: "failed",
            outcomeCode: "stale_revision",
            resultRevision: current.revision,
          };
        }
        if (!(await queries.completeOperation(operationId, completion))) {
          throw new ContentMutationConsistencyError(
            "Pending content operation could not be completed",
          );
        }
        const completed = await queries.readOperation(operationId);
        if (completed === null || completed.kind === "foreign") {
          throw new ContentMutationConsistencyError(
            "Completed content operation could not be read",
          );
        }
        return operationView(completed);
      });
    },

    readOperation: (operationId) =>
      sessions.withTransaction(async (session) => {
        const operation =
          await createQueries(session).readOperation(operationId);
        return operation === null
          ? { status: "not-found" as const }
          : operation.kind === "foreign"
            ? { status: "operation-conflict" as const, operationId }
            : operationView(operation);
      }),
  };
}
