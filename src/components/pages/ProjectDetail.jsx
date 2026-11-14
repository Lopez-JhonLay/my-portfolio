import { ExternalLink, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Navigate, useParams } from "react-router-dom";

import {
  capstoneProjects,
  personalProjects,
  workProjects,
} from "@/data/portfolio";
import {
  BackToAllProjectsLink,
  ProjectDetailSkeleton,
} from "@/components/projects/project-load-state";
import { usePublicProjectDetail } from "@/features/projects/use-public-project-detail";

const STATIC_PROJECTS = [
  ...personalProjects,
  ...workProjects,
  ...capstoneProjects,
];

function safeMarkdownUrl(url) {
  if (!URL.canParse(url)) return "";
  const protocol = new URL(url).protocol;
  return protocol === "http:" || protocol === "https:" ? url : "";
}

export function ProjectDetail() {
  const { slug = "" } = useParams();
  const staticProject = STATIC_PROJECTS.find((project) => project.slug === slug);
  const state = usePublicProjectDetail({ slug, staticProject });

  if (state.status === "loading") return <ProjectDetailSkeleton />;
  if (state.status === "error")
    return (
      <main className="project-detail">
        <BackToAllProjectsLink />
        <div className="project-load-state project-detail-error" role="alert">
          <p>This project could not be loaded. Please try again.</p>
          <button
            className="noir-button noir-button-ghost"
            onClick={state.retry}
            type="button"
          >
            <RotateCw />
            Retry
          </button>
        </div>
      </main>
    );

  const project = state.project;
  if (project.slug !== slug) return <Navigate replace to={`/projects/${project.slug}`} />;
  return (
    <main className="project-detail">
      <BackToAllProjectsLink />
      <header>
        <p className="type">{project.number} · {project.category}</p>
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </header>
      {project.gallery.length > 0 ? (
        <div className="project-gallery">
          {project.gallery.map((image) => (
            <img alt={image.altText} key={image.mediaId} src={image.url} />
          ))}
        </div>
      ) : null}
      {project.longDescriptionMarkdown ? (
        <article className="project-markdown">
          <ReactMarkdown urlTransform={safeMarkdownUrl}>
            {project.longDescriptionMarkdown}
          </ReactMarkdown>
        </article>
      ) : null}
      <div className="tagset">
        {project.tech.map((technology) => <span key={technology}>{technology}</span>)}
      </div>
      {project.liveUrl || project.repo ? (
        <div className="project-detail-actions">
          {project.liveUrl ? (
            <a
              className="noir-button noir-button-solid"
              href={project.liveUrl}
              rel="noreferrer"
              target="_blank"
            >
              View Live Site
              <ExternalLink />
            </a>
          ) : null}
          {project.repo ? (
            <a
              className={`noir-button ${project.liveUrl ? "noir-button-ghost" : "noir-button-solid"}`}
              href={project.repo}
              rel="noreferrer"
              target="_blank"
            >
              View Repository
              <ExternalLink />
            </a>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
