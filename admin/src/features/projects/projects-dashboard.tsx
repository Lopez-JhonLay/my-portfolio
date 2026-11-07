import { ChevronRight } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import type { AdminView } from "../shell/admin-route";
import { OperationAlert } from "../shell/operation-alert";

import { ConflictPanel } from "./conflict-panel";
import { createProjectClient } from "./project-client";
import { ProjectForm } from "./project-form";
import { resolveProjectWorkspaceRoute } from "./project-workspace-route";
import { ProjectsList } from "./projects-list";
import { useFeaturedDraft } from "./use-featured-draft";
import { useProjectPublication } from "./use-project-publication";
import { useProjectWorkspace } from "./use-project-workspace";

const FeaturedProjectsPage = lazy(() =>
  import("./featured-projects-page").then((module) => ({
    default: module.FeaturedProjectsPage,
  })),
);
const PublishUpdatesPage = lazy(() =>
  import("./publish-updates-page").then((module) => ({
    default: module.PublishUpdatesPage,
  })),
);

function WorkspaceLoading({
  id,
  label,
}: {
  readonly id: string;
  readonly label: string;
}) {
  return (
    <div className="workspace-loading" role="status">
      <h1 className="sr-only" id={id}>
        {label}
      </h1>
      <span className="sr-only">Loading&hellip;</span>
      <span aria-hidden="true" className="workspace-loading-heading" />
      <span aria-hidden="true" className="workspace-loading-line" />
      <span aria-hidden="true" className="workspace-loading-panel" />
    </div>
  );
}

type ProjectsDashboardProps = {
  readonly apiOrigin: string;
  readonly csrfToken: string;
  readonly onUnauthorized: () => void;
  readonly onDiscardReady: (discard: () => void) => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly view: AdminView;
};

export function ProjectsDashboard({
  apiOrigin,
  csrfToken,
  onDiscardReady,
  onUnauthorized,
  onDirtyChange,
  view,
}: ProjectsDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedProjectRoute = useMemo(
    () => resolveProjectWorkspaceRoute(location.pathname),
    [location.pathname],
  );
  const projectRoute = useMemo(
    () =>
      view === "projects" && resolvedProjectRoute !== null
        ? resolvedProjectRoute
        : ({ kind: "list" } as const),
    [resolvedProjectRoute, view],
  );
  const client = useMemo(() => createProjectClient(apiOrigin), [apiOrigin]);
  const workspace = useProjectWorkspace({
    client,
    csrfToken,
    initialRoute: projectRoute,
    onUnauthorized,
  });
  const featured = useFeaturedDraft({ client, csrfToken, onUnauthorized });
  const publication = useProjectPublication({
    client,
    csrfToken,
    onUnauthorized,
  });

  const dirty = workspace.dirty || featured.dirty;
  const synchronizedRoute = useRef<string | null>(null);

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onDiscardReady(() => {
      workspace.discardChanges();
      featured.discardChanges();
    });
    return () => onDiscardReady(() => undefined);
  }, [featured, onDiscardReady, workspace]);

  useEffect(() => {
    if (view !== "projects" || workspace.isLoading) return;
    if (resolvedProjectRoute === null) {
      void navigate("/projects", { replace: true });
      return;
    }

    const routeKey =
      projectRoute.kind === "edit"
        ? `edit:${projectRoute.projectId}`
        : projectRoute.kind;
    if (projectRoute.kind === "list") {
      synchronizedRoute.current = routeKey;
      return;
    }
    if (projectRoute.kind === "new") {
      if (workspace.editor?.mode === "create") {
        synchronizedRoute.current = routeKey;
        return;
      }
      if (workspace.editor?.mode === "edit") {
        void navigate(`/projects/${workspace.editor.project.id}`, {
          replace: true,
        });
        return;
      }
      if (synchronizedRoute.current !== routeKey && workspace.createNew()) {
        synchronizedRoute.current = routeKey;
      }
      return;
    }
    if (
      workspace.editor?.mode === "edit" &&
      workspace.editor.project.id === projectRoute.projectId
    ) {
      synchronizedRoute.current = routeKey;
      return;
    }
    if (synchronizedRoute.current === routeKey) return;
    synchronizedRoute.current = routeKey;
    void workspace.select(projectRoute.projectId);
  }, [navigate, projectRoute, resolvedProjectRoute, view, workspace]);

  function openNewProject() {
    if (workspace.createNew()) void navigate("/projects/new");
  }

  async function openProject(projectId: string) {
    if (await workspace.select(projectId))
      void navigate(`/projects/${projectId}`);
  }

  return (
    <div
      className={`dashboard-shell dashboard-view--${view} projects-mode--${projectRoute.kind}`}
    >
      {view === "overview" && (
        <main className="page-content">
          <div className="page-heading">
            <div>
              <h1>Overview</h1>
              <p>
                Review saved work and continue with the next required action.
              </p>
            </div>
          </div>
          <div className="overview-list" aria-label="Workspace summary">
            <section>
              <span>Project drafts</span>
              <strong>{workspace.projects.length}</strong>
              <p>
                {workspace.isLoading
                  ? "Loading current drafts…"
                  : "Available in the Projects workspace."}
              </p>
            </section>
            <section>
              <span>Featured slots</span>
              <strong>{featured.slots.filter(Boolean).length} of 3</strong>
              <p>
                {featured.dirty
                  ? "Selection has unsaved changes."
                  : "Saved selection is loaded."}
              </p>
            </section>
            <section>
              <span>Unresolved operations</span>
              <strong>
                {
                  [
                    workspace.pendingOperation,
                    featured.pendingOperationId,
                    publication.pendingOperationId,
                  ].filter(Boolean).length
                }
              </strong>
              <p>
                Open the relevant workspace to review or recover an operation.
              </p>
            </section>
          </div>
        </main>
      )}
      <main className="dashboard-main">
        {(view !== "projects" || projectRoute.kind === "list") && (
          <aside className="project-sidebar" aria-labelledby={`${view}-title`}>
            {view === "projects" && projectRoute.kind === "list" && (
              <ProjectsList
                featuredSlots={featured.slots}
                isBusy={
                  workspace.isSaving || workspace.pendingOperation !== null
                }
                isLoading={workspace.isLoading}
                onCreate={openNewProject}
                onEdit={(projectId) => void openProject(projectId)}
                onReload={() => void workspace.reload()}
                projects={workspace.projects}
                selectedProjectId={
                  workspace.editor?.mode === "edit"
                    ? workspace.editor.project.id
                    : undefined
                }
              />
            )}
            {view === "featured" && (
              <Suspense
                fallback={
                  <WorkspaceLoading
                    id="featured-title"
                    label="Featured Projects"
                  />
                }
              >
                <FeaturedProjectsPage
                  dirty={featured.dirty}
                  isLoading={featured.isLoading}
                  isSaving={featured.isSaving}
                  notice={featured.notice}
                  onChange={featured.setAllSlots}
                  onCheckStatus={() => void featured.checkUnresolved()}
                  onSave={() => void featured.save()}
                  pendingOperationId={featured.pendingOperationId}
                  projects={workspace.projects}
                  slots={featured.slots}
                />
              </Suspense>
            )}
            {view === "publish" && (
              <Suspense
                fallback={
                  <WorkspaceLoading
                    id="publish-title"
                    label="Publish Updates"
                  />
                }
              >
                <PublishUpdatesPage
                  featuredDirty={featured.dirty}
                  featuredPending={featured.pendingOperationId !== null}
                  isLoading={workspace.isLoading || featured.isLoading}
                  isPublishing={publication.isPublishing}
                  notice={publication.notice}
                  onCheckStatus={() => void publication.checkUnresolved()}
                  onPublish={() => void publication.publish()}
                  projectDirty={workspace.dirty}
                  projectPending={workspace.pendingOperation !== null}
                  projects={workspace.projects}
                  publicationPending={publication.pendingOperationId !== null}
                  savedFeaturedSlots={featured.savedSlots}
                />
              </Suspense>
            )}
          </aside>
        )}

        {view === "projects" && projectRoute.kind !== "list" && (
          <section className="editor-panel" aria-labelledby="editor-title">
            {workspace.editor === null ? (
              <div className="editor-empty">
                <p className="eyebrow">No draft selected</p>
                <h2 id="editor-title">Create a Project draft</h2>
                <p>
                  Choose <strong>New project</strong> or select an existing
                  draft.
                </p>
              </div>
            ) : (
              <>
                <nav className="editor-breadcrumbs" aria-label="Breadcrumb">
                  <Link to="/projects">Projects</Link>
                  <ChevronRight aria-hidden="true" size={14} />
                  <span aria-current="page">
                    {workspace.editor.mode === "create"
                      ? "New Project"
                      : workspace.editor.project.draft.name}
                  </span>
                </nav>
                <div className="editor-heading">
                  <div>
                    <h2 id="editor-title">
                      {workspace.editor.mode === "create"
                        ? "Create Project"
                        : workspace.editor.project.draft.name}
                    </h2>
                  </div>
                </div>

                <div className="status-region">
                  {workspace.notice && (
                    <OperationAlert
                      kind={workspace.notice.kind}
                      message={workspace.notice.message}
                    />
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

                {workspace.conflict ? (
                  <ConflictPanel
                    attempted={workspace.conflict.attempted}
                    authoritative={workspace.conflict.authoritative}
                    onKeepEdits={workspace.keepConflictEdits}
                    onUseSaved={workspace.useSavedConflict}
                  />
                ) : (
                  <ProjectForm
                    disabled={
                      workspace.isSaving || workspace.pendingOperation !== null
                    }
                    errors={workspace.errors}
                    isSaving={workspace.isSaving}
                    onChange={workspace.setForm}
                    onSubmit={() => void workspace.save()}
                    statusLabel={
                      workspace.pendingOperation !== null
                        ? "Outcome unknown"
                        : workspace.isSaving
                          ? "Saving…"
                          : workspace.dirty
                            ? "Unsaved changes"
                            : workspace.editor.mode === "create"
                              ? "New draft"
                              : "Saved draft"
                    }
                    submitDisabled={workspace.pendingOperation !== null}
                    value={workspace.form}
                  />
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
