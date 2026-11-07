import assert from "node:assert/strict";
import test from "node:test";

import type { AdminProject } from "./project-contract.ts";
import { filterAndSortProjects } from "./project-list-model.ts";

function project(
  overrides: Partial<AdminProject> & { id: string; name: string },
): AdminProject {
  return {
    id: overrides.id,
    lifecycle: overrides.lifecycle ?? "active",
    publicationIntent: overrides.publicationIntent ?? "include",
    revision: overrides.revision ?? "1",
    draft: {
      number: "01",
      name: overrides.name,
      category: overrides.draft?.category ?? "Personal Project",
      description: "Description",
      tech: ["React"],
      slug:
        overrides.draft?.slug ??
        overrides.name.toLowerCase().replaceAll(" ", "-"),
      groupOrder: overrides.draft?.groupOrder ?? 1,
    },
  };
}

void test("filters Projects by search, category, and supported state", () => {
  const projects = [
    project({
      id: "1",
      name: "Portfolio CMS",
      draft: {
        category: "Work Project",
        slug: "portfolio-cms",
        groupOrder: 2,
      } as AdminProject["draft"],
    }),
    project({
      id: "2",
      name: "Archived Site",
      lifecycle: "trashed",
      publicationIntent: "exclude",
    }),
  ];

  assert.deepEqual(
    filterAndSortProjects(projects, {
      category: "Work Project",
      query: "cms",
      sort: "display-order",
      state: "active",
    }).map(({ id }) => id),
    ["1"],
  );
  assert.deepEqual(
    filterAndSortProjects(projects, {
      category: "all",
      query: "",
      sort: "display-order",
      state: "excluded",
    }).map(({ id }) => id),
    ["2"],
  );
});

void test("uses category and group order by default and supports name sorting", () => {
  const projects = [
    project({
      id: "1",
      name: "Zulu",
      draft: {
        category: "Work Project",
        groupOrder: 1,
      } as AdminProject["draft"],
    }),
    project({
      id: "2",
      name: "Beta",
      draft: {
        category: "Personal Project",
        groupOrder: 2,
      } as AdminProject["draft"],
    }),
    project({
      id: "3",
      name: "Alpha",
      draft: {
        category: "Personal Project",
        groupOrder: 1,
      } as AdminProject["draft"],
    }),
  ];

  const filters = {
    category: "all" as const,
    query: "",
    state: "all" as const,
  };
  assert.deepEqual(
    filterAndSortProjects(projects, { ...filters, sort: "display-order" }).map(
      ({ id }) => id,
    ),
    ["3", "2", "1"],
  );
  assert.deepEqual(
    filterAndSortProjects(projects, { ...filters, sort: "name" }).map(
      ({ id }) => id,
    ),
    ["3", "2", "1"],
  );
});
