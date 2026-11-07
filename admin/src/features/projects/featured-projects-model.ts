import type { AdminProject, FeaturedDraft } from "./project-contract.ts";

export type FeaturedValidation = {
  readonly errors: readonly [string | null, string | null, string | null];
  readonly valid: boolean;
};

export function isFeaturedEligible(project: AdminProject): boolean {
  return (
    project.lifecycle === "active" && project.publicationIntent === "include"
  );
}

export function validateFeaturedSlots(
  slots: FeaturedDraft["slots"],
  projects: readonly AdminProject[],
): FeaturedValidation {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const errors = slots.map((projectId) => {
    if (projectId === null) return "A Featured Project is required.";
    if (slots.filter((slot) => slot === projectId).length > 1) {
      return "This Project is selected more than once.";
    }
    const project = projectById.get(projectId);
    if (project === undefined || !isFeaturedEligible(project)) {
      return "This Project is not eligible for Featured selection.";
    }
    return null;
  }) as [string | null, string | null, string | null];

  return { errors, valid: errors.every((error) => error === null) };
}

export function moveFeaturedSlot(
  slots: FeaturedDraft["slots"],
  index: 0 | 1 | 2,
  direction: "down" | "up",
): FeaturedDraft["slots"] {
  const destination = direction === "up" ? index - 1 : index + 1;
  if (destination < 0 || destination > 2) return slots;
  const next: [string | null, string | null, string | null] = [...slots];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
