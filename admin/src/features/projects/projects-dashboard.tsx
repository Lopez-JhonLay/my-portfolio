import { useMemo } from "react";

import { ConflictPanel } from "./conflict-panel";
import { createProjectClient } from "./project-client";
import { ProjectForm } from "./project-form";
import { useFeaturedDraft } from "./use-featured-draft";
import { useProjectPublication } from "./use-project-publication";
import { useProjectWorkspace } from "./use-project-workspace";

type ProjectsDashboardProps = {
  readonly apiOrigin: string;
  readonly csrfToken: string;
  readonly isLoggingOut: boolean;
  readonly onLogout: () => Promise<void>;
  readonly onUnauthorized: () => void;
};

export function ProjectsDashboard({
  apiOrigin,
  csrfToken,
  isLoggingOut,
  onLogout,
  onUnauthorized,
}: ProjectsDashboardProps) {
  const client = useMemo(() => createProjectClient(apiOrigin), [apiOrigin]);
  const workspace = useProjectWorkspace({ client, csrfToken, onUnauthorized });
  const featured = useFeaturedDraft({ client, csrfToken, onUnauthorized });
  const publication = useProjectPublication({
    client,
    csrfToken,
    onUnauthorized,
  });

  async function requestPublish() {
    if (workspace.dirty || featured.dirty) return;
    if (
      !window.confirm(
        "Publish all saved Project updates now? Public content changes only if the complete publication succeeds.",
      )
    ) {
      return;
    }
    await publication.publish();
  }

  async function requestLogout() {
    if (
      (workspace.dirty || featured.dirty) &&
      !window.confirm("Log out and discard your unsaved Admin changes?")
    ) {
      return;
    }
    await onLogout();
  }

  return (
    <div className="dashboard-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Local administration</p>
          <h1>Portfolio CMS</h1>
        </div>
        <div className="header-actions">
          <span className="session-state">Authenticated administrator</span>
          <button
            className="button"
            disabled={
              isLoggingOut ||
              workspace.isSaving ||
              workspace.pendingOperation !== null ||
              publication.isPublishing ||
              publication.pendingOperationId !== null ||
              featured.isSaving ||
              featured.pendingOperationId !== null
            }
            onClick={() => void requestLogout()}
            type="button"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="project-sidebar" aria-labelledby="projects-title">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">Draft workspace</p>
              <h2 id="projects-title">Projects</h2>
            </div>
            <span className="project-count">{workspace.projects.length}</span>
          </div>
          <div className="sidebar-actions">
            <button
              className="button button--primary"
              disabled={
                workspace.isSaving || workspace.pendingOperation !== null
              }
              onClick={workspace.createNew}
              type="button"
            >
              New project
            </button>
            <button
              className="button button--quiet"
              disabled={
                workspace.isLoading ||
                workspace.isSaving ||
                workspace.pendingOperation !== null
              }
              onClick={() => void workspace.reload()}
              type="button"
            >
              Reload
            </button>
          </div>

          <section className="featured-panel" aria-labelledby="featured-title">
            <p className="eyebrow">Homepage order</p>
            <h3 id="featured-title">Featured Projects</h3>
            <p>Select and save three distinct eligible Projects.</p>
            <fieldset
              disabled={
                featured.isLoading ||
                featured.isSaving ||
                featured.pendingOperationId !== null
              }
            >
              <legend className="sr-only">Featured Project slots</legend>
              {featured.slots.map((projectId, index) => (
                <label className="featured-slot" key={index}>
                  <span>Slot {index + 1}</span>
                  <select
                    onChange={(event) =>
                      featured.setSlot(
                        index as 0 | 1 | 2,
                        event.target.value === "" ? null : event.target.value,
                      )
                    }
                    value={projectId ?? ""}
                  >
                    <option value="">Not selected</option>
                    {workspace.projects
                      .filter(
                        (project) =>
                          project.lifecycle === "active" &&
                          project.publicationIntent === "include",
                      )
                      .map((project) => (
                        <option
                          disabled={
                            project.id !== projectId &&
                            featured.slots.includes(project.id)
                          }
                          key={project.id}
                          value={project.id}
                        >
                          {project.draft.name}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </fieldset>
            <button
              className="button"
              disabled={
                !featured.dirty ||
                featured.isLoading ||
                featured.isSaving ||
                featured.pendingOperationId !== null
              }
              onClick={() => void featured.save()}
              type="button"
            >
              {featured.isSaving ? "Saving…" : "Save featured"}
            </button>
            <div
              className="publication-status"
              aria-live="polite"
              aria-atomic="true"
            >
              {featured.notice && (
                <p className={`notice notice--${featured.notice.kind}`}>
                  {featured.notice.message}
                </p>
              )}
              {featured.pendingOperationId !== null && !featured.isSaving && (
                <button
                  className="button status-action"
                  onClick={() => void featured.checkUnresolved()}
                  type="button"
                >
                  Check featured save
                </button>
              )}
            </div>
          </section>

          <section
            className="publication-panel"
            aria-labelledby="publication-title"
          >
            <p className="eyebrow">Public portfolio</p>
            <h3 id="publication-title">Publish Updates</h3>
            <p>
              Publishes every saved eligible draft and the three saved featured
              slots as one atomic snapshot.
            </p>
            <button
              className="button button--primary"
              disabled={
                workspace.dirty ||
                featured.dirty ||
                featured.isLoading ||
                featured.isSaving ||
                featured.pendingOperationId !== null ||
                workspace.isSaving ||
                workspace.pendingOperation !== null ||
                publication.isPublishing ||
                publication.pendingOperationId !== null
              }
              onClick={() => void requestPublish()}
              type="button"
            >
              {publication.isPublishing ? "Publishing…" : "Publish Updates"}
            </button>
            {(workspace.dirty || featured.dirty) && (
              <p className="field-help">Save or discard Admin changes first.</p>
            )}
            <div
              className="publication-status"
              aria-live="polite"
              aria-atomic="true"
            >
              {publication.notice && (
                <p className={`notice notice--${publication.notice.kind}`}>
                  {publication.notice.message}
                </p>
              )}
              {publication.pendingOperationId !== null &&
                !publication.isPublishing && (
                  <button
                    className="button status-action"
                    onClick={() => void publication.checkUnresolved()}
                    type="button"
                  >
                    Check publish status
                  </button>
                )}
            </div>
          </section>

          {workspace.isLoading && workspace.projects.length === 0 ? (
            <p className="sidebar-message" role="status">
              Loading drafts…
            </p>
          ) : workspace.projects.length === 0 ? (
            <div className="sidebar-message">
              <p>No Project drafts yet.</p>
              <p>Create the first draft to begin.</p>
            </div>
          ) : (
            <ul className="project-list">
              {workspace.projects.map((project) => {
                const selected =
                  workspace.editor?.mode === "edit" &&
                  workspace.editor.project.id === project.id;
                return (
                  <li key={project.id}>
                    <button
                      aria-current={selected ? "page" : undefined}
                      className="project-list-item"
                      disabled={
                        workspace.isSaving ||
                        workspace.pendingOperation !== null
                      }
                      onClick={() => void workspace.select(project.id)}
                      type="button"
                    >
                      <span>{project.draft.name}</span>
                      <small>
                        {project.draft.category} · r{project.revision}
                      </small>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="editor-panel" aria-labelledby="editor-title">
          {workspace.editor === null ? (
            <div className="editor-empty">
              <p className="eyebrow">No draft selected</p>
              <h2 id="editor-title">Create a Project draft</h2>
              <p>
                Choose <strong>New project</strong> or select an existing draft.
              </p>
            </div>
          ) : (
            <>
              <div className="editor-heading">
                <div>
                  <p className="eyebrow">
                    {workspace.editor.mode === "create"
                      ? "New draft"
                      : `Revision ${workspace.editor.project.revision}`}
                  </p>
                  <h2 id="editor-title">
                    {workspace.editor.mode === "create"
                      ? "Create Project"
                      : workspace.editor.project.draft.name}
                  </h2>
                </div>
                <span
                  className={workspace.dirty ? "dirty-state" : "saved-state"}
                >
                  {workspace.dirty ? "Unsaved changes" : "Up to date"}
                </span>
              </div>

              <div
                className="status-region"
                aria-live="polite"
                aria-atomic="true"
              >
                {workspace.notice && (
                  <p className={`notice notice--${workspace.notice.kind}`}>
                    {workspace.notice.message}
                  </p>
                )}
                {workspace.pendingOperation && !workspace.isSaving && (
                  <button
                    className="button status-action"
                    onClick={() => void workspace.checkUnresolved()}
                    type="button"
                  >
                    Check save status
                  </button>
                )}
              </div>

              {workspace.conflict && (
                <ConflictPanel
                  attempted={workspace.conflict.attempted}
                  authoritative={workspace.conflict.authoritative}
                  onKeepEdits={workspace.keepConflictEdits}
                  onUseSaved={workspace.useSavedConflict}
                />
              )}

              <ProjectForm
                disabled={
                  workspace.isSaving || workspace.pendingOperation !== null
                }
                errors={workspace.errors}
                mode={workspace.editor.mode}
                onChange={workspace.setForm}
                onSubmit={() => void workspace.save()}
                submitDisabled={workspace.pendingOperation !== null}
                value={workspace.form}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
