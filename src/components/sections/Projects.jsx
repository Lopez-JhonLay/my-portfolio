import { ArrowRight, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { projects } from "@/data/portfolio";

export function Projects() {
  return (
    <motion.section
      className="noir-section"
      id="projects"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow type">02 - Evidence Board</div>
      <h2 className="section-title">
        <FolderOpen />
        Open Case Files
      </h2>
      <p className="section-lead">
        Pinned, threaded, and ready for inspection. These projects are the main
        proof of work.
      </p>

      <div className="corkboard">
        <div className="string string-one" aria-hidden="true" />
        <div className="string string-two" aria-hidden="true" />
        <div className="case-grid">
          {projects.map((project) => (
            <motion.article
              className="case-card"
              key={project.name}
              whileHover={{ y: -6, rotate: -0.4 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
            >
              <span className="pin" aria-hidden="true" />
              <div className="num type">{project.number}</div>
              <h3>{project.name}</h3>
              <p className="case-category type">{project.category}</p>
              <p>{project.description}</p>
              <p className="case-role">
                <span className="type">Role</span> {project.role}
              </p>
              <div className="tagset">
                {project.tech.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
              <a
                className="case-link"
                href={project.repo}
                target="_blank"
                rel="noreferrer"
              >
                View Repository
                <ArrowRight />
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
