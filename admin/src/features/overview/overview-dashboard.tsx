import { CheckCircle2, CircleAlert, LoaderCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";

import {
  getOverviewAttention,
  getPublishedSectionCount,
  type OverviewReadiness,
} from "./overview-model";

type OverviewDashboardProps = {
  readonly contentReadiness: OverviewReadiness;
  readonly featuredCount: number;
  readonly hasUnsavedChanges: boolean;
  readonly isWorkspaceLoading: boolean;
  readonly pendingOperationCount: number;
  readonly projectCount: number;
};

export function OverviewDashboard({
  contentReadiness,
  featuredCount,
  hasUnsavedChanges,
  isWorkspaceLoading,
  pendingOperationCount,
  projectCount,
}: OverviewDashboardProps) {
  const publishedSectionCount = getPublishedSectionCount(contentReadiness);
  const totalSectionCount =
    contentReadiness.status === "ready"
      ? contentReadiness.sections.length
      : null;
  const allSectionsPublished =
    totalSectionCount !== null &&
    totalSectionCount > 0 &&
    publishedSectionCount === totalSectionCount;
  const attention = isWorkspaceLoading
    ? ({
        kind: "loading",
        message: "Checking Projects, Featured selections, and content status…",
      } as const)
    : getOverviewAttention({
        hasUnsavedChanges,
        pendingOperationCount,
        readiness: contentReadiness,
      });
  const AttentionIcon =
    attention.kind === "success"
      ? CheckCircle2
      : attention.kind === "loading"
        ? LoaderCircle
        : CircleAlert;

  return (
    <main className="page-content overview-dashboard">
      <header className="overview-header">
        <div>
          <h1>Portfolio overview</h1>
          <p>See what is live and whether anything needs your attention.</p>
        </div>
        <div className="overview-header-actions">
          <Link className="button button--primary" to="/publish">
            <Send aria-hidden="true" size={15} />
            Publish updates
          </Link>
        </div>
      </header>

      <section
        className="overview-site-status"
        aria-labelledby="site-status-title"
      >
        <div className="overview-site-status-copy">
          <span
            className={`overview-live-status${allSectionsPublished ? " is-live" : ""}`}
          >
            <span aria-hidden="true" />
            {contentReadiness.status === "loading"
              ? "Checking site status"
              : contentReadiness.status === "error"
                ? "Status unavailable"
                : allSectionsPublished
                  ? "Published site is live"
                  : "Publishing is incomplete"}
          </span>
          <h2 id="site-status-title">
            {allSectionsPublished
              ? "Your portfolio content is published."
              : contentReadiness.status === "ready"
                ? "Some saved content is not live yet."
                : "Review your portfolio publishing status."}
          </h2>
          <p>
            Publish Updates sends all saved Projects, Featured selections, and
            content sections live together.
          </p>
        </div>
        <dl className="overview-summary">
          <div>
            <dt>Projects</dt>
            <dd>{isWorkspaceLoading ? "—" : projectCount}</dd>
          </div>
          <div>
            <dt>Featured</dt>
            <dd>{isWorkspaceLoading ? "—" : `${featuredCount} / 3`}</dd>
          </div>
          <div>
            <dt>Published sections</dt>
            <dd>
              {totalSectionCount === null
                ? "—"
                : `${publishedSectionCount} / ${totalSectionCount}`}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="overview-panel overview-attention"
        aria-labelledby="attention-title"
      >
        <div className={`overview-attention-icon is-${attention.kind}`}>
          <AttentionIcon aria-hidden="true" size={19} />
        </div>
        <div>
          <p className="eyebrow">Workspace status</p>
          <h2 id="attention-title">
            {attention.kind === "success"
              ? "No action needed"
              : attention.kind === "loading"
                ? "Checking your workspace"
                : "Needs attention"}
          </h2>
          <p>{attention.message}</p>
        </div>
        {attention.kind !== "success" && attention.kind !== "loading" && (
          <Link className="button" to="/publish">
            Review publish status
          </Link>
        )}
      </section>
    </main>
  );
}
