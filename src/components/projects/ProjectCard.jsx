import { ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export function ProjectCard({ project }) {
  const externalUrl = project.liveUrl || project.repo;

  return (
    <motion.article
      className="case-card"
      whileHover={{ y: -6, rotate: -0.4 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
    >
      <span className="pin" aria-hidden="true" />
      {project.cover ? (
        <img
          className="case-cover"
          src={project.cover.url}
          alt={project.cover.altText}
        />
      ) : null}

      <header className="case-head">
        <p className="case-meta type">
          <span>{project.number}</span>
          <span aria-hidden="true">·</span>
          <span>{project.category}</span>
        </p>
        <h3 title={project.name}>{project.name}</h3>
      </header>

      <div className="case-body">
        <p className="case-description" title={project.description}>
          {project.description}
        </p>
        {project.role ? (
          <p className="case-role">
            <span className="type">Role</span> {project.role}
          </p>
        ) : null}
      </div>

      <div className="case-tech">
        <span className="case-section-label type">Tech stack</span>
        <div className="tagset">
          {project.tech.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>

      {externalUrl || project.slug ? (
        <footer className="case-actions">
          {externalUrl ? (
            <a
              className="noir-button noir-button-solid"
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              {project.liveUrl ? "View Live Site" : "View Repository"}
              <ExternalLink />
            </a>
          ) : null}
          {project.slug ? (
            <Link
              className="noir-button noir-button-ghost"
              to={`/projects/${project.slug}`}
            >
              View Details
              <ArrowRight />
            </Link>
          ) : null}
        </footer>
      ) : null}
    </motion.article>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    number: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    role: PropTypes.string,
    tech: PropTypes.arrayOf(PropTypes.string).isRequired,
    repo: PropTypes.string,
    liveUrl: PropTypes.string,
    slug: PropTypes.string,
    cover: PropTypes.shape({
      altText: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }),
  }).isRequired,
};
