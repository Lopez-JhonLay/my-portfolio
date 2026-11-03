import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EMPTY_PROJECT_FORM, validateProjectForm } from "./project-contract.ts";

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
