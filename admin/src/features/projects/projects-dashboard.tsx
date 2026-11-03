import { useMemo } from "react";

import { ConflictPanel } from "./conflict-panel";
import { createProjectClient } from "./project-client";
import { ProjectForm } from "./project-form";
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

  async function requestLogout() {
    if (
      workspace.dirty &&
      !window.confirm("Log out and discard your unsaved Project changes?")
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
              workspace.pendingOperation !== null
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
