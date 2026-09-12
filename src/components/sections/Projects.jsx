import { ArrowRight, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { personalProjects } from "@/data/portfolio";
import { ProjectCard } from "@/components/projects/ProjectCard";

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
          {personalProjects.slice(0, 3).map((project) => (
            <ProjectCard project={project} key={project.name} />
          ))}
        </div>
      </div>
      <div className="projects-footer">
        <a className="noir-button noir-button-ghost" href="/all-projects">
          View All Projects
          <ArrowRight />
        </a>
      </div>
    </motion.section>
  );
}
