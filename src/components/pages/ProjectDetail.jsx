import { ArrowLeft, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, Navigate, useParams } from "react-router-dom";

import {
  capstoneProjects,
  personalProjects,
  workProjects,
} from "@/data/portfolio";
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

  if (state.status === "loading")
    return <main className="project-detail" aria-busy="true"><p>Loading Project…</p></main>;
  if (state.status === "error")
    return (
      <main className="project-detail">
        <h1>Project unavailable</h1>
        <button onClick={state.retry}>Retry</button>
        <Link to="/all-projects">Back to Projects</Link>
      </main>
    );

  const project = state.project;
  if (project.slug !== slug) return <Navigate replace to={`/projects/${project.slug}`} />;
  return (
    <main className="project-detail">
      <Link className="case-link" to="/all-projects"><ArrowLeft /> All Projects</Link>
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
      <div className="project-detail-actions">
        {project.liveUrl ? <a href={project.liveUrl} rel="noreferrer" target="_blank">Live site <ExternalLink /></a> : null}
        {project.repo ? <a href={project.repo} rel="noreferrer" target="_blank">Repository <ExternalLink /></a> : null}
      </div>
    </main>
  );
}

