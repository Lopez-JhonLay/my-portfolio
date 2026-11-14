import { CheckCircle2, Send, TriangleAlert } from "lucide-react";
import { useMemo } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { OperationAlert } from "../shell/operation-alert";
import type { AdminProject, FeaturedDraft } from "./project-contract";
import { getPublicationReadiness } from "./publication-readiness";
import type { SaveNotice } from "./use-project-workspace";

type PublishUpdatesPageProps = {
  readonly featuredDirty: boolean;
  readonly featuredPending: boolean;
  readonly isLoading: boolean;
  readonly isPublishing: boolean;
  readonly notice: SaveNotice | null;
  readonly onCheckStatus: () => void;
  readonly onPublish: () => void;
  readonly projectDirty: boolean;
  readonly projectPending: boolean;
  readonly projects: readonly AdminProject[];
  readonly publicationPending: boolean;
  readonly savedFeaturedSlots: FeaturedDraft["slots"];
};

const categoryLabels = {
  "Personal Project": "Personal",
  "Work Project": "Work",
  "Capstone Project": "Capstone",
} as const;

export function PublishUpdatesPage({
  featuredDirty,
  featuredPending,
  isLoading,
  isPublishing,
  notice,
  onCheckStatus,
  onPublish,
  projectDirty,
  projectPending,
  projects,
  publicationPending,
  savedFeaturedSlots,
}: PublishUpdatesPageProps) {
  const readiness = useMemo(
    () =>
      getPublicationReadiness({
        featuredDirty,
        featuredPending,
        isLoading,
        projectDirty,
        projectPending,
        projects,
        publicationPending,
        savedSlots: savedFeaturedSlots,
      }),
    [
      featuredDirty,
      featuredPending,
      isLoading,
      projectDirty,
      projectPending,
      projects,
      publicationPending,
      savedFeaturedSlots,
    ],
  );
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const includedProjects = projects.filter(
    (project) =>
      project.lifecycle === "active" && project.publicationIntent === "include",
  );
  const excludedProjects = projects.filter(
    (project) =>
      project.lifecycle === "trashed" ||
      project.publicationIntent === "exclude",
  );

  return (
    <section className="publish-workspace" aria-labelledby="publish-title">
      <header className="publish-page-header">
        <div>
          <h1 id="publish-title">Publish Updates</h1>
          <p>
            Review saved publication inputs, then publish one atomic public
            snapshot. Unsaved changes are never included.
          </p>
        </div>
      </header>

      {notice && <OperationAlert kind={notice.kind} message={notice.message} />}
      {publicationPending && !isPublishing && (
        <Button onClick={onCheckStatus} type="button" variant="outline">
          Check publication status
        </Button>
      )}

      <div className="publish-review">
        <section aria-labelledby="readiness-title">
          <div className="publish-section-heading">
            {readiness.ready ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
            <div>
              <h2 id="readiness-title">Publication readiness</h2>
              <p>
                {readiness.ready
                  ? "No known local blockers. The backend performs the authoritative readiness check."
                  : `${readiness.blockers.length} known ${readiness.blockers.length === 1 ? "blocker" : "blockers"} must be resolved.`}
              </p>
            </div>
          </div>
          {readiness.blockers.length > 0 && (
            <ul className="publish-blockers">
              {readiness.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="candidate-title">
          <div className="publish-section-heading">
            <div>
              <h2 id="candidate-title">Saved Project candidates</h2>
              <p>
                Contract-supported intent only; this is not a change diff or
                authoritative per-row public status.
              </p>
            </div>
          </div>
          <dl className="publish-summary-list">
            <div>
              <dt>Active and marked for inclusion</dt>
              <dd>{includedProjects.length}</dd>
            </div>
            <div>
              <dt>Excluded or trashed</dt>
              <dd>{excludedProjects.length}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="featured-review-title">
          <div className="publish-section-heading">
            <div>
              <h2 id="featured-review-title">Saved Featured order</h2>
              <p>The three saved homepage slots included in publication.</p>
            </div>
          </div>
          <ol className="publish-featured-list">
            {savedFeaturedSlots.map((projectId, index) => {
              const project =
                projectId === null ? undefined : projectById.get(projectId);
              return (
                <li key={index}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{project?.draft.name ?? "Not selected"}</strong>
                    <small>
                      {project === undefined
                        ? "Missing saved selection"
                        : categoryLabels[project.draft.category]}
                    </small>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="content-review-title">
          <div className="publish-section-heading">
            <div>
              <h2 id="content-review-title">Saved portfolio content</h2>
              <p>
                All seven saved content documents are validated by the backend
                and included in the same atomic snapshot.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="publish-actions">
        <span className="form-draft-status" role="status">
          {publicationPending
            ? "Publication outcome unresolved"
            : isPublishing
              ? "Publishing saved updates…"
              : readiness.ready
                ? "Ready for backend readiness check"
                : "Resolve blockers before publishing"}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={!readiness.ready || isPublishing || publicationPending}
              type="button"
            >
              <Send aria-hidden="true" />
              {isPublishing ? "Publishing…" : "Publish Updates"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="dialog-heading">
              <div
                className="dialog-icon dialog-icon--neutral"
                aria-hidden="true"
              >
                <Send size={18} />
              </div>
              <AlertDialogTitle>Publish all saved updates?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This creates one atomic public snapshot from every eligible saved
              Project draft, the saved Featured order, and all saved portfolio
              content. Unsaved edits are not included, and publication is not
              automatically retried.
            </AlertDialogDescription>
            <div className="publish-dialog-scope">
              <span>{includedProjects.length} inclusion candidates</span>
              <span>3 saved Featured slots</span>
              <span>7 saved content sections</span>
            </div>
            <div className="dialog-actions">
              <AlertDialogCancel asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={onPublish} type="button">
                  Publish saved updates
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
