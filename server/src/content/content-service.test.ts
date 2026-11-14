import { describe, expect, it } from "vitest";

import type { TransactionSessionBoundary } from "../db/database-session.ts";
import { parseContentDocument } from "./content-contract.ts";
import {
  createContentMutationService,
  type ContentMutationQueries,
  type ContentOperationLookup,
} from "./content-service.ts";

const HERO_DOCUMENT = parseContentDocument("hero", {
  browserTitle: "Portfolio",
  name: "Jhon Lay Lopez",
  brand: "JL",
  role: "Software Engineer",
  heroRole: "Application Developer",
  location: "Pasay, Philippines",
  navigation: [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Projects", href: "/#projects" },
    { label: "Experience", href: "/#experience" },
    { label: "Skills", href: "/#skills" },
    { label: "Contact", href: "/#contact" },
  ],
  sectionTag: "Open file",
  title: "Web & Mobile",
  description: "Practical software.",
  resumeButtonLabel: "Download Portfolio",
  scrollCue: "Descend",
});

function createContext() {
  let section = {
    sectionKey: "hero" as const,
    revision: 1n,
    document: HERO_DOCUMENT,
  };
  const operations = new Map<string, ContentOperationLookup>();
  const sessions: TransactionSessionBoundary<null> = {
    withTransaction: (mutate) => mutate(null),
  };
  const queries: ContentMutationQueries = {
    readOperation: (operationId) =>
      Promise.resolve(operations.get(operationId) ?? null),
    lockOperation: (operationId) =>
      Promise.resolve(operations.get(operationId) ?? null),
    insertOperation: (operation) => {
      if (operations.has(operation.operationId)) return Promise.resolve(false);
      operations.set(operation.operationId, operation);
      return Promise.resolve(true);
    },
    completeOperation: (operationId, completion) => {
      const operation = operations.get(operationId);
      if (operation === undefined || operation.kind === "foreign") {
        return Promise.resolve(false);
      }
      operations.set(operationId, { ...operation, ...completion });
      return Promise.resolve(true);
    },
    lockSection: (sectionKey) =>
      Promise.resolve(sectionKey === section.sectionKey ? section : null),
    updateSection: (sectionKey, expectedRevision, document) => {
      if (
        sectionKey !== section.sectionKey ||
        section.revision !== expectedRevision
      ) {
        return Promise.resolve(null);
      }
      section = { ...section, revision: section.revision + 1n, document };
      return Promise.resolve(section.revision);
    },
  };
  return {
    service: createContentMutationService(sessions, () => queries),
    getSection: () => section,
    setRevision: (revision: bigint) => {
      section = { ...section, revision };
    },
    operations,
  };
}

describe("content mutation service", () => {
  it("saves once and replays the authoritative operation outcome", async () => {
    const context = createContext();
    const command = {
      operationId: "11111111-1111-4111-8111-111111111111",
      sectionKey: "hero" as const,
      expectedRevision: 1n,
      document: { ...HERO_DOCUMENT, description: "Updated introduction" },
    };

    await expect(context.service.saveDraft(command)).resolves.toMatchObject({
      status: "succeeded",
      outcomeCode: "content_draft_saved",
      resultRevision: 2n,
    });
    await expect(context.service.saveDraft(command)).resolves.toMatchObject({
      status: "succeeded",
      resultRevision: 2n,
    });
    expect(context.getSection().document).toMatchObject({
      description: "Updated introduction",
    });
  });

  it("records stale revisions without changing the content draft", async () => {
    const context = createContext();
    context.setRevision(3n);

    await expect(
      context.service.saveDraft({
        operationId: "22222222-2222-4222-8222-222222222222",
        sectionKey: "hero",
        expectedRevision: 1n,
        document: { ...HERO_DOCUMENT, description: "Must not save" },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "stale_revision",
      resultRevision: 3n,
    });
    expect(context.getSection().document).toEqual(HERO_DOCUMENT);
  });

  it("treats operation identifiers from another mutation kind as conflicts", async () => {
    const context = createContext();
    context.operations.set("33333333-3333-4333-8333-333333333333", {
      operationId: "33333333-3333-4333-8333-333333333333",
      kind: "foreign",
    });

    await expect(
      context.service.readOperation("33333333-3333-4333-8333-333333333333"),
    ).resolves.toEqual({
      operationId: "33333333-3333-4333-8333-333333333333",
      status: "operation-conflict",
    });
  });
});
