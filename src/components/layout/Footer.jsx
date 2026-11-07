import PropTypes from "prop-types";

export function Footer({ content }) {
  return (
    <footer className="noir-footer">
      <p className="type">{content.footerPrimary}</p>
      <p>{content.footerSecondary}</p>
    </footer>
  );
}

Footer.propTypes = {
  content: PropTypes.shape({
    footerPrimary: PropTypes.string.isRequired,
    footerSecondary: PropTypes.string.isRequired,
  }).isRequired,
};
