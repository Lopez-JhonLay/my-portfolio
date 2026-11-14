import { RotateCw } from "lucide-react";
import PropTypes from "prop-types";

export function ProjectLoadState({ status, onRetry }) {
  if (status === "loading") {
    return (
      <div className="project-load-state" role="status" aria-live="polite">
        <p>Loading projects. The service may take up to 30 seconds to wake up.</p>
      </div>
    );
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
