import PropTypes from "prop-types";

const THREE_ITEMS = [0, 1, 2];
const FOUR_ITEMS = [0, 1, 2, 3];
const FIVE_ITEMS = [0, 1, 2, 3, 4];

function LoadingMessage({ children }) {
  return <span className="content-skeleton-message">{children}</span>;
}
LoadingMessage.propTypes = { children: PropTypes.node.isRequired };

export function HeroBodySkeleton() {
  return (
    <div className="content-skeleton hero-body-skeleton" role="status">
      <LoadingMessage>Loading Hero content</LoadingMessage>
      <span className="skeleton-block skeleton-role" aria-hidden="true" />
      <span className="skeleton-block skeleton-copy" aria-hidden="true" />
      <span className="skeleton-block skeleton-copy skeleton-copy-short" aria-hidden="true" />
      <span className="skeleton-block skeleton-button" aria-hidden="true" />
    </div>
  );
}

export function AboutBodySkeleton() {
  return (
    <div className="dossier content-skeleton" role="status">
      <LoadingMessage>Loading About content</LoadingMessage>
      <aside className="dossier-photo-panel" aria-hidden="true">
        <span className="skeleton-block skeleton-photo" />
      </aside>
      <div className="dossier-body" aria-hidden="true">
        <span className="skeleton-block skeleton-heading" />
        <span className="skeleton-block skeleton-label" />
        {FOUR_ITEMS.map((item) => (
          <span className="skeleton-block skeleton-copy" key={item} />
        ))}
      </div>
      <div className="file-facts" aria-hidden="true">
        {FOUR_ITEMS.map((item) => (
          <div key={item}>
            <span className="skeleton-block skeleton-label" />
            <span className="skeleton-block skeleton-fact" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineBodySkeleton() {
  return (
    <div className="timeline content-skeleton" role="status">
      <LoadingMessage>Loading Timeline content</LoadingMessage>
      {THREE_ITEMS.map((item) => (
        <article className="timeline-item" aria-hidden="true" key={item}>
          <div className="timeline-marker" />
          <span className="skeleton-block skeleton-label" />
          <span className="skeleton-block skeleton-heading" />
          <span className="skeleton-block skeleton-copy skeleton-copy-short" />
          <span className="skeleton-block skeleton-copy" />
        </article>
      ))}
    </div>
  );
}

export function TechnologiesBodySkeleton() {
  return (
    <div className="arsenal-grid content-skeleton" role="status">
      <LoadingMessage>Loading Technologies content</LoadingMessage>
      {FIVE_ITEMS.map((item) => (
        <article className="weapon-card" aria-hidden="true" key={item}>
          <span className="skeleton-block skeleton-heading" />
          <div className="skeleton-pill-list">
            {THREE_ITEMS.map((pill) => (
              <span className="skeleton-block skeleton-pill" key={pill} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ContactBodySkeleton() {
  return (
    <div className="contact-wrap content-skeleton" role="status">
      <LoadingMessage>Loading Contact content</LoadingMessage>
      <div className="contact-note" aria-hidden="true">
        <span className="skeleton-block skeleton-heading" />
        <span className="skeleton-block skeleton-copy" />
        <span className="skeleton-block skeleton-copy skeleton-copy-short" />
        <span className="skeleton-block skeleton-contact-line" />
        <span className="skeleton-block skeleton-contact-line" />
      </div>
      <div className="social-board" aria-hidden="true">
        {THREE_ITEMS.map((item) => (
          <span className="skeleton-block skeleton-social-card" key={item} />
        ))}
      </div>
    </div>
  );
}

