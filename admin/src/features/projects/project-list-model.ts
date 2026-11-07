import {
  PROJECT_CATEGORIES,
  type AdminProject,
  type ProjectCategory,
} from "./project-contract.ts";

export type ProjectCategoryFilter = "all" | ProjectCategory;
export type ProjectStateFilter =
  "all" | "active" | "trashed" | "included" | "excluded";
export type ProjectSort = "display-order" | "name";

export type ProjectListFilters = {
  readonly category: ProjectCategoryFilter;
  readonly query: string;
  readonly sort: ProjectSort;
  readonly state: ProjectStateFilter;
};

const categoryOrder = new Map(
  PROJECT_CATEGORIES.map((category, index) => [category, index]),
);

function matchesState(
  project: AdminProject,
  state: ProjectStateFilter,
): boolean {
  if (state === "all") return true;
  if (state === "active" || state === "trashed")
    return project.lifecycle === state;
  return (
    project.publicationIntent === (state === "included" ? "include" : "exclude")
  );
}

export function filterAndSortProjects(
  projects: readonly AdminProject[],
  filters: ProjectListFilters,
): readonly AdminProject[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return projects
    .filter((project) => {
      const matchesQuery =
        query.length === 0 ||
        [
          project.draft.name,
          project.draft.slug,
          project.draft.description,
        ].some((value) => value.toLocaleLowerCase().includes(query));
      return (
        matchesQuery &&
        (filters.category === "all" ||
          project.draft.category === filters.category) &&
        matchesState(project, filters.state)
      );
    })
    .sort((left, right) => {
      if (filters.sort === "name")
        return left.draft.name.localeCompare(right.draft.name);
      const categoryDifference =
        (categoryOrder.get(left.draft.category) ?? 0) -
        (categoryOrder.get(right.draft.category) ?? 0);
      return (
        categoryDifference ||
        left.draft.groupOrder - right.draft.groupOrder ||
        left.draft.name.localeCompare(right.draft.name)
      );
    });
}
