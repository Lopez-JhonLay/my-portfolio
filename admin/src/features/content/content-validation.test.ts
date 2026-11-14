import assert from "node:assert/strict";
import test from "node:test";

import type {
  HeroDocument,
  MediaResumeDocument,
  TimelineDocument,
} from "./content-contract.ts";
import { validateEditableContent } from "./content-validation.ts";

const hero: HeroDocument = {
  name: " Jhon ",
  role: " Developer ",
  heroRole: " Engineer ",
  location: " Pasay ",
  description: " Description ",
};

void test("normalizes a valid Hero document", () => {
  const result = validateEditableContent("hero", hero);
  assert.deepEqual(result.errors, {});
  assert.equal((result.document as HeroDocument).name, "Jhon");
});

void test("reports required personal-information validation errors", () => {
  const result = validateEditableContent("hero", {
    ...hero,
    name: " ",
  });
  assert.equal(result.document, undefined);
  assert.equal(result.errors.name, "This field is required.");
});

void test("rejects duplicate technology names and preserves text-only technologies", () => {
  const result = validateEditableContent("technologies", {
    groups: [
      {
        category: "Frontend",
        technologies: [{ name: "React", iconKey: "react" }, { name: "react" }],
      },
    ],
  });
  assert.equal(result.document, undefined);
  assert.match(result.errors["groups.0.technologies"] ?? "", /unique/);
});

void test("validates ordered timeline entries", () => {
  const result = validateEditableContent("timeline", {
    entries: [
      {
        role: "Developer",
        organization: "Company",
        location: "City",
        date: "2026",
        detail: "Built software.",
      },
    ],
  });
  assert.deepEqual(result.errors, {});
  assert.equal((result.document as TimelineDocument).entries.length, 1);
});

void test("accepts the bundled profile image fallback", () => {
  const result = validateEditableContent("media-resume", {
    profileImageMediaId: null,
    resumeMediaId: null,
  });
  assert.deepEqual(result.errors, {});
  assert.equal(
    (result.document as MediaResumeDocument).profileImageMediaId,
    null,
  );
});
