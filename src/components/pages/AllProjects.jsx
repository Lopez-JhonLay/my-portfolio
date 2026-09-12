import { ArrowLeft } from "lucide-react";
import { capstoneProjects, personalProjects, workProjects } from "@/data/portfolio";
import { ProjectCard } from "@/components/projects/ProjectCard";

export function AllProjects() {
  return (
    <main className="all-projects-page">
      <div className="noir-section">
        <a className="noir-button noir-button-ghost back-projects-link" href="/#projects">
          <ArrowLeft />
          Back to Home
        </a>

        <section className="project-group" aria-labelledby="personal-projects-title">
          <div className="eyebrow type">01 - Independent Work</div>
          <h2 id="personal-projects-title">Personal Projects</h2>
          <div className="corkboard">
            <div className="case-grid all-project-grid">
              {personalProjects.map((project) => (
                <ProjectCard project={project} key={project.name} />
              ))}
            </div>
          </div>
        </section>

        <section className="project-group" aria-labelledby="work-projects-title">
          <div className="eyebrow type">02 - Professional Work</div>
          <h2 id="work-projects-title">Work Projects</h2>
          {workProjects.length ? (
            <div className="corkboard">
              <div className="case-grid all-project-grid">
                {workProjects.map((project) => (
                  <ProjectCard project={project} key={project.name} />
                ))}
              </div>
            </div>
          ) : (
            <div className="work-projects-placeholder">
              <p>Work projects will be added here soon.</p>
            </div>
          )}
        </section>

        <section className="project-group" aria-labelledby="capstone-projects-title">
          <div className="eyebrow type">03 - Team Work</div>
          <h2 id="capstone-projects-title">Capstone Projects</h2>
          <div className="corkboard">
            <div className="case-grid all-project-grid">
              {capstoneProjects.map((project) => (
                <ProjectCard project={project} key={project.name} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
