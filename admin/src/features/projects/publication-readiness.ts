import type { AdminProject, FeaturedDraft } from "./project-contract.ts";
import { validateFeaturedSlots } from "./featured-projects-model.ts";

type PublicationReadinessInput = {
  readonly featuredDirty: boolean;
  readonly featuredPending: boolean;
  readonly isLoading: boolean;
  readonly projectDirty: boolean;
  readonly projectPending: boolean;
  readonly projects: readonly AdminProject[];
  readonly publicationPending: boolean;
  readonly savedSlots: FeaturedDraft["slots"];
};

export function getPublicationReadiness(input: PublicationReadinessInput): {
  readonly blockers: readonly string[];
  readonly ready: boolean;
} {
  const blockers: string[] = [];
  if (input.isLoading)
    blockers.push("Project and Featured data is still loading.");
  if (input.projectDirty)
    blockers.push("Save or discard unsaved Project edits.");
  if (input.featuredDirty)
    blockers.push("Save or discard unsaved Featured changes.");
  if (input.projectPending)
    blockers.push("Resolve the outstanding Project draft save.");
  if (input.featuredPending)
    blockers.push("Resolve the outstanding Featured save.");
  if (input.publicationPending)
    blockers.push("Resolve the outstanding publication operation.");
  if (!validateFeaturedSlots(input.savedSlots, input.projects).valid) {
    blockers.push(
      "The saved Featured selection must contain three eligible Projects.",
    );
  }
  return { blockers, ready: blockers.length === 0 };
}
