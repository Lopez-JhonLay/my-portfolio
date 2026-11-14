import assert from "node:assert/strict";
import test from "node:test";

import type { AdminProject, FeaturedDraft } from "./project-contract.ts";
import { getPublicationReadiness } from "./publication-readiness.ts";

function project(id: string): AdminProject {
  return {
    id,
    lifecycle: "active",
    publicationIntent: "include",
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

const savedSlots: FeaturedDraft["slots"] = ["a", "b", "c"];
const projects = [project("a"), project("b"), project("c")];

void test("allows publishing when there are no known local blockers", () => {
  const result = getPublicationReadiness({
    featuredDirty: false,
    featuredPending: false,
    isLoading: false,
    projectDirty: false,
    projectPending: false,
    projects,
    publicationPending: false,
    savedSlots,
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});

void test("reports unsaved, unresolved, and invalid Featured blockers with fixes", () => {
  const result = getPublicationReadiness({
    featuredDirty: true,
    featuredPending: true,
    isLoading: false,
    projectDirty: true,
    projectPending: true,
    projects: projects.slice(0, 2),
    publicationPending: true,
    savedSlots,
  });

  assert.equal(result.ready, false);
  assert.equal(result.blockers.length, 6);
  const projectEdits = result.blockers.find((blocker) =>
    /unsaved project edits/i.test(blocker.message),
  );
  assert.equal(projectEdits?.fix?.to, "/projects");
  const featured = result.blockers.find((blocker) =>
    /Pick 3/i.test(blocker.message),
  );
  assert.equal(featured?.fix?.to, "/featured");
});

void test("waits for data before judging the Featured selection", () => {
  const result = getPublicationReadiness({
    featuredDirty: false,
    featuredPending: false,
    isLoading: true,
    projectDirty: false,
    projectPending: false,
    projects: [],
    publicationPending: false,
    savedSlots,
  });

  assert.equal(result.ready, false);
  assert.deepEqual(
    result.blockers.map((blocker) => blocker.message),
    ["Your projects are still loading."],
  );
});
