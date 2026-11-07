import assert from "node:assert/strict";
import test from "node:test";

import type { AdminProject, FeaturedDraft } from "./project-contract.ts";
import {
  moveFeaturedSlot,
  validateFeaturedSlots,
} from "./featured-projects-model.ts";

function project(
  id: string,
  overrides: Partial<AdminProject> = {},
): AdminProject {
  return {
    id,
    lifecycle: overrides.lifecycle ?? "active",
    publicationIntent: overrides.publicationIntent ?? "include",
    revision: "1",
    draft: {
      number: id,
      name: `Project ${id}`,
      category: "Personal Project",
      description: "Description",
      tech: ["React"],
      slug: `project-${id}`,
      groupOrder: 1,
    },
  };
}

void test("requires three distinct eligible Featured Projects", () => {
  const projects = [
    project("a"),
    project("b", { publicationIntent: "exclude" }),
  ];
  const result = validateFeaturedSlots(["a", "a", "b"], projects);

  assert.equal(result.valid, false);
  assert.match(result.errors[0] ?? "", /more than once/i);
  assert.match(result.errors[1] ?? "", /more than once/i);
  assert.match(result.errors[2] ?? "", /not eligible/i);
  assert.match(
    validateFeaturedSlots(["a", null, null], projects).errors[1] ?? "",
    /required/i,
  );
});

void test("accepts exactly three eligible selections and reorders them", () => {
  const projects = [project("a"), project("b"), project("c")];
  const slots: FeaturedDraft["slots"] = ["a", "b", "c"];

  assert.equal(validateFeaturedSlots(slots, projects).valid, true);
  assert.deepEqual(moveFeaturedSlot(slots, 1, "up"), ["b", "a", "c"]);
  assert.deepEqual(moveFeaturedSlot(slots, 1, "down"), ["a", "c", "b"]);
  assert.deepEqual(moveFeaturedSlot(slots, 0, "up"), slots);
});
