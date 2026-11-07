import { Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { PROJECT_CATEGORIES, type AdminProject } from "./project-contract";
import {
  filterAndSortProjects,
  type ProjectCategoryFilter,
  type ProjectSort,
  type ProjectStateFilter,
} from "./project-list-model";

type ProjectsListProps = {
  readonly featuredSlots: readonly (string | null)[];
  readonly isBusy: boolean;
  readonly isLoading: boolean;
  readonly onCreate: () => void;
  readonly onEdit: (projectId: string) => void;
  readonly onReload: () => void;
  readonly projects: readonly AdminProject[];
  readonly selectedProjectId?: string;
};

const categoryLabels = {
  "Personal Project": "Personal",
  "Work Project": "Work",
  "Capstone Project": "Capstone",
} as const;

export function ProjectsList({
  featuredSlots,
  isBusy,
  isLoading,
  onCreate,
  onEdit,
  onReload,
  projects,
  selectedProjectId,
}: ProjectsListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProjectCategoryFilter>("all");
  const [state, setState] = useState<ProjectStateFilter>("all");
  const [sort, setSort] = useState<ProjectSort>("display-order");
  const visibleProjects = useMemo(
    () => filterAndSortProjects(projects, { category, query, sort, state }),
    [category, projects, query, sort, state],
  );

  return (
    <section className="projects-list-section" aria-labelledby="projects-title">
      <header className="projects-page-header">
        <div>
          <h1 id="projects-title">Projects</h1>
          <p>Find, create, and open saved Project drafts.</p>
        </div>
        <Button disabled={isBusy} onClick={onCreate} type="button">
          <Plus aria-hidden="true" /> New Project
        </Button>
      </header>

      <div className="projects-toolbar" role="search">
        <label className="project-search">
          <span className="sr-only">Search Projects</span>
          <Search aria-hidden="true" size={16} />
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Projects"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            onChange={(event) =>
              setCategory(event.target.value as ProjectCategoryFilter)
            }
            value={category}
          >
            <option value="all">All categories</option>
            {PROJECT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {categoryLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by workspace state</span>
          <select
            onChange={(event) =>
              setState(event.target.value as ProjectStateFilter)
            }
            value={state}
          >
            <option value="all">All states</option>
            <option value="active">Active</option>
            <option value="trashed">Trashed</option>
            <option value="included">Included on publish</option>
            <option value="excluded">Excluded from publish</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort Projects</span>
          <select
            onChange={(event) => setSort(event.target.value as ProjectSort)}
            value={sort}
          >
            <option value="display-order">Display order</option>
            <option value="name">Name</option>
          </select>
        </label>
        <Button
          aria-label="Reload Projects"
          disabled={isBusy || isLoading}
          onClick={onReload}
          size="icon"
          type="button"
          variant="outline"
        >
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="projects-list-skeleton" aria-busy="true" role="status">
          <span className="sr-only">Loading Project drafts…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <div className="projects-skeleton-row" key={index}>
              <Skeleton className="h-4 w-48 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="projects-list-message">
          <strong>No Project drafts yet.</strong>
          <p>Create the first draft to begin.</p>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="projects-list-message">
          <strong>No matching Projects.</strong>
          <p>Try a broader search or clear a filter.</p>
        </div>
      ) : (
        <div className="projects-table-frame">
          <table className="projects-table">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Category</th>
                <th scope="col">Workspace</th>
                <th scope="col">Featured</th>
                <th scope="col">Revision</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((project) => {
                const featuredIndex = featuredSlots.indexOf(project.id);
                return (
                  <tr
                    aria-selected={selectedProjectId === project.id}
                    key={project.id}
                  >
                    <td data-label="Project">
                      <strong>{project.draft.name}</strong>
                      <small>/{project.draft.slug}</small>
                    </td>
                    <td data-label="Category">
                      <span className="table-tag">
                        {categoryLabels[project.draft.category]}
                      </span>
                    </td>
                    <td data-label="Workspace">
                      <span>
                        {project.lifecycle === "trashed" ? "Trashed" : "Active"}
                      </span>
                      <small>
                        {project.publicationIntent === "include"
                          ? "Included on publish"
                          : "Excluded from publish"}
                      </small>
                    </td>
                    <td data-label="Featured">
                      {featuredIndex < 0 ? "—" : `Slot ${featuredIndex + 1}`}
                    </td>
                    <td data-label="Revision">r{project.revision}</td>
                    <td className="table-actions">
                      <Button
                        disabled={isBusy}
                        onClick={() => onEdit(project.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Pencil aria-hidden="true" /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="projects-result-count" aria-live="polite">
        Showing {visibleProjects.length} of {projects.length} Projects
      </p>
    </section>
  );
}
