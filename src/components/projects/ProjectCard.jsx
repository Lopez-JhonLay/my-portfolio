import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

export function ProjectCard({ project }) {
  return (
    <motion.article
      className="case-card"
      whileHover={{ y: -6, rotate: -0.4 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
    >
      <span className="pin" aria-hidden="true" />
      <div className="num type">{project.number}</div>
      <h3>{project.name}</h3>
      <p className="case-category type">{project.category}</p>
      <p>{project.description}</p>
      {project.role ? (
        <p className="case-role">
          <span className="type">Role</span> {project.role}
        </p>
      ) : null}
      <div className="tagset">
        {project.tech.map((tech) => (
          <span key={tech}>{tech}</span>
        ))}
      </div>
      <a
        className="case-link"
        href={project.liveUrl || project.repo}
        target="_blank"
        rel="noreferrer"
      >
        {project.liveUrl ? "View Live Site" : "View Repository"}
        <ArrowRight />
      </a>
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
  }).isRequired,
};
