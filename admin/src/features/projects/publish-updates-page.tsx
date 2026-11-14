import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Send,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

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
import type { ContentSectionKey } from "../content/content-contract";
import type { OverviewReadiness } from "../overview/overview-model";
import { OperationAlert } from "../shell/operation-alert";
import type { AdminProject, FeaturedDraft } from "./project-contract";
import { getPublicationReadiness } from "./publication-readiness";
import type { SaveNotice } from "./use-project-workspace";

type PublishUpdatesPageProps = {
  readonly contentReadiness: OverviewReadiness;
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

const sectionDetails: Record<
  ContentSectionKey,
  { readonly label: string; readonly to?: string }
> = {
  hero: { label: "Hero", to: "/hero" },
  about: { label: "About Me", to: "/about" },
  "projects-presentation": { label: "Projects section" },
  timeline: { label: "Timeline", to: "/timeline" },
  technologies: { label: "Technologies", to: "/technologies" },
  contact: { label: "Contact", to: "/contact" },
  "media-resume": { label: "Resume PDF", to: "/hero" },
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function PublishUpdatesPage({
  contentReadiness,
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
  const activeProjects = projects.filter(
    (project) => project.lifecycle === "active",
  );
  const shownProjects = activeProjects.filter(
    (project) => project.publicationIntent === "include",
  );
  const hiddenCount = activeProjects.length - shownProjects.length;
  const trashedCount = projects.length - activeProjects.length;
  const sectionCount =
    contentReadiness.status === "ready"
      ? contentReadiness.sections.length
      : null;

  const status = isPublishing
    ? "publishing"
    : publicationPending
      ? "unconfirmed"
      : isLoading
        ? "loading"
        : readiness.ready
          ? "ready"
          : "blocked";
  // While a publish is unconfirmed the card already explains it, so only
  // list the other things that still need fixing.
  const listedBlockers =
    status === "blocked"
      ? readiness.blockers
      : status === "unconfirmed"
        ? readiness.blockers.filter((blocker) => blocker.fix !== undefined)
        : [];

  const publishButton = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={status !== "ready"} size="lg" type="button">
          <Send aria-hidden="true" />
          Publish updates
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="dialog-heading">
          <div className="dialog-icon dialog-icon--neutral" aria-hidden="true">
            <Send size={18} />
          </div>
          <AlertDialogTitle>Publish to your live site?</AlertDialogTitle>
        </div>
        <AlertDialogDescription>
          Visitors will see your saved changes right away. Edits you
          haven&apos;t saved won&apos;t be included.
        </AlertDialogDescription>
        <div className="publish-dialog-scope">
          <span>{pluralize(shownProjects.length, "project")}</span>
          <span>3 featured</span>
          {sectionCount !== null && (
            <span>{pluralize(sectionCount, "page section")}</span>
          )}
        </div>
        <div className="dialog-actions">
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onPublish} type="button">
              Publish now
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <section className="publish-workspace" aria-labelledby="publish-title">
      <header className="publish-page-header">
        <h1 id="publish-title">Publish updates</h1>
        <p>
          Make your saved changes live on your portfolio. Anything you
          haven&apos;t saved stays private.
        </p>
      </header>

      <section
        aria-labelledby="publish-status-title"
        className={`publish-status is-${status}`}
      >
        <div className="publish-status-icon" aria-hidden="true">
          {status === "ready" ? (
            <CheckCircle2 size={20} />
          ) : status === "blocked" ? (
            <TriangleAlert size={20} />
          ) : status === "unconfirmed" ? (
            <Clock3 size={20} />
          ) : (
            <LoaderCircle className="publish-spin" size={20} />
          )}
        </div>
        <div className="publish-status-body">
          <h2 id="publish-status-title">
            {status === "ready"
              ? "Ready to publish"
              : status === "blocked"
                ? `${pluralize(readiness.blockers.length, "thing")} to fix before publishing`
                : status === "unconfirmed"
                  ? "Waiting to confirm your last publish"
                  : status === "publishing"
                    ? "Publishing…"
                    : "Checking your changes…"}
          </h2>
          <p>
            {status === "ready"
              ? "Everything is saved. Your live site will update all at once."
              : status === "blocked"
                ? "Your live site stays as it is until these are sorted out."
                : status === "unconfirmed"
                  ? "Check its status before publishing again so nothing goes out twice."
                  : status === "publishing"
                    ? "Sending your saved changes to your live site."
                    : "This only takes a moment."}
          </p>
          {listedBlockers.length > 0 && (
            <ul className="publish-fix-list">
              {listedBlockers.map((blocker) => (
                <li key={blocker.message}>
                  <span>{blocker.message}</span>
                  {blocker.fix && (
                    <Link to={blocker.fix.to}>
                      {blocker.fix.label}
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="publish-status-action">
          {status === "unconfirmed" ? (
            <Button onClick={onCheckStatus} size="lg" type="button">
              Check status
            </Button>
          ) : (
            publishButton
          )}
        </div>
      </section>

      {notice && <OperationAlert kind={notice.kind} message={notice.message} />}

      <h2 className="publish-group-title">What goes live</h2>
      <div className="publish-groups">
        <section className="publish-group" aria-labelledby="publish-projects">
          <header>
            <div>
              <h3 id="publish-projects">Projects</h3>
              <p>
                {isLoading
                  ? "Loading…"
                  : [
                      `${shownProjects.length} shown on your site`,
                      hiddenCount > 0 && `${hiddenCount} hidden`,
                      trashedCount > 0 && `${trashedCount} in trash`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            </div>
            <Link className="publish-group-link" to="/projects">
              Manage
            </Link>
          </header>
          {!isLoading && shownProjects.length > 0 && (
            <ul className="publish-chip-list">
              {shownProjects.map((project) => (
                <li key={project.id}>{project.draft.name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="publish-group" aria-labelledby="publish-featured">
          <header>
            <div>
              <h3 id="publish-featured">Featured on your homepage</h3>
              <p>Shown in this order.</p>
            </div>
            <Link className="publish-group-link" to="/featured">
              Edit
            </Link>
          </header>
          <ol className="publish-rows">
            {savedFeaturedSlots.map((projectId, index) => {
              const project =
                projectId === null ? undefined : projectById.get(projectId);
              return (
                <li key={index}>
                  <span className="publish-slot-number">{index + 1}</span>
                  <span className="publish-row-name">
                    {project?.draft.name ?? (
                      <span className="publish-row-missing">Empty slot</span>
                    )}
                  </span>
                  {project && (
                    <span className="publish-row-meta">
                      {categoryLabels[project.draft.category]}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="publish-group" aria-labelledby="publish-sections">
          <header>
            <div>
              <h3 id="publish-sections">Page sections</h3>
              <p>All sections are published together with your projects.</p>
            </div>
          </header>
          {contentReadiness.status === "ready" ? (
            <ul className="publish-rows">
              {contentReadiness.sections.map((section) => {
                const details = sectionDetails[section.sectionKey];
                return (
                  <li key={section.sectionKey}>
                    <span className="publish-row-name">{details.label}</span>
                    <span
                      className={`publish-pill${section.isPublished ? " is-live" : ""}`}
                    >
                      {section.isPublished ? "Live" : "Not live yet"}
                    </span>
                    {details.to ? (
                      <Link className="publish-row-link" to={details.to}>
                        Edit
                      </Link>
                    ) : (
                      <span className="publish-row-link" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="publish-group-note">
              {contentReadiness.status === "loading"
                ? "Loading section status…"
                : "Couldn't load section status. Reload the page to try again."}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
