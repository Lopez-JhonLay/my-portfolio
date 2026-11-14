import { ArrowLeft, RotateCw } from "lucide-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const LOADING_MESSAGE =
  "Loading projects. The service may take up to 30 seconds to wake up.";

function ProjectCardSkeleton() {
  return (
    <article className="case-card case-card-skeleton" aria-hidden="true">
      <span className="pin" />
      <span className="skeleton-block skeleton-card-meta" />
      <span className="skeleton-block skeleton-card-title" />
      <div className="case-body">
        <span className="skeleton-block skeleton-card-line" />
        <span className="skeleton-block skeleton-card-line" />
        <span className="skeleton-block skeleton-card-line" />
        <span className="skeleton-block skeleton-card-line skeleton-card-line-short" />
      </div>
      <div className="case-tech">
        <span className="skeleton-block skeleton-card-meta" />
        <div className="skeleton-pill-list">
          <span className="skeleton-block skeleton-pill" />
          <span className="skeleton-block skeleton-pill" />
          <span className="skeleton-block skeleton-pill" />
        </div>
      </div>
      <div className="case-actions">
        <span className="skeleton-block skeleton-card-button" />
        <span className="skeleton-block skeleton-card-button" />
      </div>
    </article>
  );
}

/** Card-shaped placeholders laid out in the same grid as the real cards. */
export function ProjectCardsSkeleton({ className = "", count = 3 }) {
  return (
    <div className={`case-grid content-skeleton ${className}`.trim()} role="status">
      <span className="content-skeleton-message">{LOADING_MESSAGE}</span>
      {Array.from({ length: count }, (_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

ProjectCardsSkeleton.propTypes = {
  className: PropTypes.string,
  count: PropTypes.number,
};

export function BackToAllProjectsLink() {
  return (
    <Link
      className="noir-button noir-button-ghost back-projects-link"
      to="/all-projects"
    >
      <ArrowLeft />
      Back to All Projects
    </Link>
  );
}

/** Project page placeholder: meta, title, description, tech, and actions. */
export function ProjectDetailSkeleton() {
  return (
    <main className="project-detail" aria-busy="true">
      <BackToAllProjectsLink />
      <div className="content-skeleton project-detail-skeleton" role="status">
        <span className="content-skeleton-message">Loading project</span>
        <span className="skeleton-block skeleton-label" aria-hidden="true" />
        <span className="skeleton-block skeleton-detail-title" aria-hidden="true" />
        <span className="skeleton-block skeleton-detail-line" aria-hidden="true" />
        <span
          className="skeleton-block skeleton-detail-line skeleton-detail-line-short"
          aria-hidden="true"
        />
        <div className="skeleton-pill-list" aria-hidden="true">
          <span className="skeleton-block skeleton-pill" />
          <span className="skeleton-block skeleton-pill" />
          <span className="skeleton-block skeleton-pill" />
          <span className="skeleton-block skeleton-pill" />
        </div>
        <div className="skeleton-detail-actions" aria-hidden="true">
          <span className="skeleton-block skeleton-button" />
          <span className="skeleton-block skeleton-button" />
        </div>
      </div>
    </main>
  );
}

export function ProjectLoadState({ status, onRetry }) {
  if (status === "loading") {
    return <ProjectCardsSkeleton />;
  }

  return (
    <div className="project-load-state" role="alert">
      <p>Projects could not be loaded. Please try again.</p>
      <button
        className="noir-button noir-button-ghost"
        type="button"
        onClick={onRetry}
      >
        <RotateCw />
        Retry
      </button>
    </div>
  );
}

ProjectLoadState.propTypes = {
  status: PropTypes.oneOf(["loading", "error"]).isRequired,
  onRetry: PropTypes.func.isRequired,
};
