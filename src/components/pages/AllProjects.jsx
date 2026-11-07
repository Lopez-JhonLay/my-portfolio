import { ArrowLeft } from "lucide-react";
import { capstoneProjects, personalProjects, workProjects } from "@/data/portfolio";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectLoadState } from "@/components/projects/project-load-state";
import { usePublicProjects } from "@/features/projects/use-public-projects";

const STATIC_PROJECT_GROUPS = [
  { category: "Personal Project", projects: personalProjects },
  { category: "Work Project", projects: workProjects },
  { category: "Capstone Project", projects: capstoneProjects },
];

export function AllProjects() {
  const projectsState = usePublicProjects({
    resource: "groups",
    staticProjects: STATIC_PROJECT_GROUPS,
  });

  return (
    <main className="all-projects-page">
      <div className="noir-section">
        <a className="noir-button noir-button-ghost back-projects-link" href="/#projects">
          <ArrowLeft />
          Back to Home
        </a>

        {projectsState.status !== "ready" ? (
          <ProjectLoadState
            status={projectsState.status}
            onRetry={projectsState.retry}
          />
        ) : (
          <>
            <section
              className="project-group"
              aria-labelledby="personal-projects-title"
            >
              <div className="eyebrow type">01 - Independent Work</div>
              <h2 id="personal-projects-title">Personal Projects</h2>
              <div className="corkboard">
                <div className="case-grid all-project-grid">
                  {projectsState.projects[0].projects.map((project) => (
                    <ProjectCard
                      project={project}
                      key={project.slug || project.name}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section
              className="project-group"
              aria-labelledby="work-projects-title"
            >
              <div className="eyebrow type">02 - Professional Work</div>
              <h2 id="work-projects-title">Work Projects</h2>
              {projectsState.projects[1].projects.length ? (
                <div className="corkboard">
                  <div className="case-grid all-project-grid">
                    {projectsState.projects[1].projects.map((project) => (
                      <ProjectCard
                        project={project}
                        key={project.slug || project.name}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="work-projects-placeholder">
                  <p>Work projects will be added here soon.</p>
                </div>
              )}
            </section>

            <section
              className="project-group"
              aria-labelledby="capstone-projects-title"
            >
              <div className="eyebrow type">03 - Team Work</div>
              <h2 id="capstone-projects-title">Capstone Projects</h2>
              <div className="corkboard">
                <div className="case-grid all-project-grid">
                  {projectsState.projects[2].projects.map((project) => (
                    <ProjectCard
                      project={project}
                      key={project.slug || project.name}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
