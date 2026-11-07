import { RotateCw } from "lucide-react";
import PropTypes from "prop-types";

export function ContentLoadNotice({ onRetry }) {
  return (
    <div className="content-load-notice" role="alert">
      <p>Published portfolio copy could not be loaded. Built-in content is shown.</p>
      <button className="noir-button noir-button-ghost" onClick={onRetry} type="button">
        <RotateCw />
        Retry
      </button>
    </div>
  );
}

ContentLoadNotice.propTypes = { onRetry: PropTypes.func.isRequired };
