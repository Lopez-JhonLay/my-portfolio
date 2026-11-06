import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EMPTY_PROJECT_FORM, validateProjectForm } from "./project-contract.ts";
import {
  parseFeaturedDraft,
  parsePublicationOperation,
} from "./project-client.ts";

void describe("Project form contract", () => {
  void it("returns field errors instead of an invalid draft", () => {
    const result = validateProjectForm(EMPTY_PROJECT_FORM);

    assert.equal(result.draft, undefined);
    assert.deepEqual(result.errors, {
      number: "Display number is required.",
      name: "Name is required.",
      description: "Short description is required.",
      tech: "Add at least one technology.",
      slug: "Use lowercase letters, numbers, and single hyphens.",
    });
  });

  void it("preserves technology order and omits cleared optional fields", () => {
    const result = validateProjectForm({
      ...EMPTY_PROJECT_FORM,
      number: " File 09 ",
      name: " Admin dashboard ",
      description: " Editable draft ",
      tech: "React, TypeScript\nPostgreSQL",
      slug: "admin-dashboard",
      role: "  ",
      repo: "",
      liveUrl: "",
      longDescriptionMarkdown: "",
    });

    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.draft, {
      number: "File 09",
      name: "Admin dashboard",
      category: "Personal Project",
      description: "Editable draft",
      tech: ["React", "TypeScript", "PostgreSQL"],
      slug: "admin-dashboard",
      groupOrder: 1,
    });
  });

  void it("rejects unsafe links and whitespace-only Markdown", () => {
    const result = validateProjectForm({
      ...EMPTY_PROJECT_FORM,
      number: "File 01",
      name: "Unsafe input",
      description: "Validation example",
      tech: "TypeScript",
      slug: "unsafe-input",
      repo: "javascript:alert(1)",
      liveUrl: "ftp://example.com",
      longDescriptionMarkdown: "   ",
    });

    assert.deepEqual(result.errors, {
      repo: "Use a complete HTTP or HTTPS URL.",
      liveUrl: "Use a complete HTTP or HTTPS URL.",
      longDescriptionMarkdown: "Markdown cannot contain only spaces.",
    });
  });
});

void describe("Publication response contract", () => {
  void it("accepts pending and successful publication outcomes", () => {
    assert.deepEqual(
      parsePublicationOperation({
        operationId: "11111111-1111-4111-8111-111111111111",
        kind: "publish",
        status: "pending",
      }),
      {
        operationId: "11111111-1111-4111-8111-111111111111",
        kind: "publish",
        status: "pending",
      },
    );
    assert.deepEqual(
      parsePublicationOperation({
        operationId: "11111111-1111-4111-8111-111111111111",
        kind: "publish",
        status: "succeeded",
        outcomeCode: "published",
        snapshotRevision: "2",
      }),
      {
        operationId: "11111111-1111-4111-8111-111111111111",
        kind: "publish",
        status: "succeeded",
        outcomeCode: "published",
        snapshotRevision: "2",
      },
    );
  });

  void it("rejects unknown publication fields and invalid revisions", () => {
    assert.throws(() =>
      parsePublicationOperation({
        operationId: "11111111-1111-4111-8111-111111111111",
        kind: "publish",
        status: "succeeded",
        outcomeCode: "published",
        snapshotRevision: "0",
        draft: true,
      }),
    );
  });
});

void describe("Featured draft response contract", () => {
  void it("preserves the three selected slots in order", () => {
    assert.deepEqual(
      parseFeaturedDraft({
        revision: "4",
        slots: [
          "11111111-1111-4111-8111-111111111111",
          null,
          "22222222-2222-4222-8222-222222222222",
        ],
      }),
      {
        revision: "4",
        slots: [
          "11111111-1111-4111-8111-111111111111",
          null,
          "22222222-2222-4222-8222-222222222222",
        ],
      },
    );
  });
});
