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

/** Something that must be resolved before publishing, with where to fix it. */
export type PublicationBlocker = {
  readonly message: string;
  readonly fix?: { readonly label: string; readonly to: string };
};

const OPEN_PROJECTS = { label: "Open Projects", to: "/projects" } as const;
const OPEN_FEATURED = { label: "Open Featured", to: "/featured" } as const;

export function getPublicationReadiness(input: PublicationReadinessInput): {
  readonly blockers: readonly PublicationBlocker[];
  readonly ready: boolean;
} {
  const blockers: PublicationBlocker[] = [];
  if (input.isLoading) {
    blockers.push({ message: "Your projects are still loading." });
  }
  if (input.projectDirty) {
    blockers.push({
      message: "You have unsaved project edits.",
      fix: OPEN_PROJECTS,
    });
  }
  if (input.featuredDirty) {
    blockers.push({
      message: "You have unsaved changes to your featured projects.",
      fix: OPEN_FEATURED,
    });
  }
  if (input.projectPending) {
    blockers.push({
      message: "A project save hasn't been confirmed yet.",
      fix: OPEN_PROJECTS,
    });
  }
  if (input.featuredPending) {
    blockers.push({
      message: "A featured projects save hasn't been confirmed yet.",
      fix: OPEN_FEATURED,
    });
  }
  if (input.publicationPending) {
    blockers.push({ message: "Your last publish hasn't been confirmed yet." });
  }
  if (
    !input.isLoading &&
    !validateFeaturedSlots(input.savedSlots, input.projects).valid
  ) {
    blockers.push({
      message: "Pick 3 visible projects to feature on your homepage.",
      fix: { label: "Choose featured", to: "/featured" },
    });
  }
  return { blockers, ready: blockers.length === 0 };
}
