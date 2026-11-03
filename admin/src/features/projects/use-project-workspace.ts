import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminApiError, UncertainMutationError } from "../../lib/admin-http";
import {
  EMPTY_PROJECT_FORM,
  type AdminProject,
  type DraftOperation,
  type ProjectDraft,
  type ProjectFormErrors,
  type ProjectFormValue,
  projectToForm,
  validateProjectForm,
} from "./project-contract";
import {
  parseAuthoritativeProject,
  type ProjectClient,
} from "./project-client";

const PENDING_OPERATION_KEY = "portfolio-cms:pending-project-save";
const POLL_INTERVAL_MS = 5_000;
const POLL_ATTEMPTS = 12;

type EditorState =
  | { readonly mode: "create"; readonly project: null }
  | { readonly mode: "edit"; readonly project: AdminProject };

export type SaveNotice = {
  readonly kind: "error" | "info" | "success" | "warning";
  readonly message: string;
};

export type ProjectConflict = {
  readonly attempted: ProjectDraft;
  readonly authoritative: AdminProject;
};

type StoredOperation = {
  readonly operationId: string;
  readonly projectId: string | null;
};

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function readStoredOperation(): StoredOperation | null {
  const raw = sessionStorage.getItem(PENDING_OPERATION_KEY);
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "operationId" in value &&
      "projectId" in value &&
      isUuid(value.operationId) &&
      (value.projectId === null || isUuid(value.projectId))
    ) {
      return { operationId: value.operationId, projectId: value.projectId };
    }
  } catch {
    // Invalid browser state is discarded below.
  }
  sessionStorage.removeItem(PENDING_OPERATION_KEY);
  return null;
}

function storeOperation(operation: StoredOperation): void {
  sessionStorage.setItem(PENDING_OPERATION_KEY, JSON.stringify(operation));
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function friendlyError(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    return error.message;
  }
  return "The Admin API returned an unexpected response.";
}

function isProject(
  value: AdminProject | DraftOperation,
): value is AdminProject {
  return "draft" in value;
}

export function useProjectWorkspace(options: {
  readonly client: ProjectClient;
  readonly csrfToken: string;
  readonly onUnauthorized: () => void;
}) {
  const { client, csrfToken, onUnauthorized } = options;
  const [projects, setProjects] = useState<readonly AdminProject[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<ProjectFormValue>(EMPTY_PROJECT_FORM);
  const [baseline, setBaseline] =
    useState<ProjectFormValue>(EMPTY_PROJECT_FORM);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<SaveNotice | null>(null);
  const [conflict, setConflict] = useState<ProjectConflict | null>(null);
  const [pendingOperation, setPendingOperation] =
    useState<StoredOperation | null>(null);
  const [pendingAttempted, setPendingAttempted] = useState<ProjectDraft | null>(
    null,
  );
  const startupStarted = useRef(false);

  const dirty = useMemo(
    () => editor !== null && JSON.stringify(form) !== JSON.stringify(baseline),
    [baseline, editor, form],
  );

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof AdminApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setNotice({ kind: "error", message: friendlyError(error) });
    },
    [onUnauthorized],
  );

  const applyProject = useCallback((project: AdminProject) => {
    const nextForm = projectToForm(project);
    setProjects((current) => {
      const index = current.findIndex((item) => item.id === project.id);
      if (index < 0) return [...current, project];
      return current.map((item) => (item.id === project.id ? project : item));
    });
    setEditor({ mode: "edit", project });
    setForm(nextForm);
    setBaseline(nextForm);
    setErrors({});
  }, []);

  const resolveOperation = useCallback(
    async (
      operation: DraftOperation,
      attempted: ProjectDraft | null,
    ): Promise<boolean> => {
      if (operation.status === "pending") return false;
      sessionStorage.removeItem(PENDING_OPERATION_KEY);
      setPendingOperation(null);
      setPendingAttempted(null);
      const projectId = operation.projectId;
      if (projectId === null) {
        setNotice({
          kind: "error",
          message: "The save completed without a Project identifier.",
        });
        return true;
      }
      const project = await client.read(projectId);
      if (operation.status === "succeeded") {
        applyProject(project);
        setConflict(null);
        setNotice({ kind: "success", message: "Draft saved." });
        return true;
      }
      if (operation.outcomeCode === "stale_revision" && attempted !== null) {
        setProjects((current) =>
          current.map((item) => (item.id === project.id ? project : item)),
        );
        setEditor({ mode: "edit", project });
        setBaseline(projectToForm(project));
        setConflict({ attempted, authoritative: project });
        setNotice({
          kind: "warning",
          message: "The save was rejected because a newer draft exists.",
        });
        return true;
      }
      applyProject(project);
      setNotice({
        kind: "error",
        message:
          "The previous save did not succeed. The latest draft was loaded.",
      });
      return true;
    },
    [applyProject, client],
  );

  const pollOperation = useCallback(
    async (stored: StoredOperation, attempted: ProjectDraft) => {
      storeOperation(stored);
      setPendingOperation(stored);
      setPendingAttempted(attempted);
      setNotice({
        kind: "info",
        message:
          "Save outcome unknown. Checking the operation without retrying it…",
      });
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        await delay(POLL_INTERVAL_MS);
        try {
          const operation = await client.readOperation(stored.operationId);
          if (await resolveOperation(operation, attempted)) return;
        } catch (error) {
          if (error instanceof AdminApiError && error.status === 401) {
            onUnauthorized();
            return;
          }
          // A failed read does not establish the mutation outcome; keep checking.
        }
      }
      setNotice({
        kind: "warning",
        message:
          "Save outcome is still unknown. The operation was not retried. Reload later to check again.",
      });
    },
    [client, onUnauthorized, resolveOperation],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);
    try {
      const result = await client.list();
      setProjects(result.projects);
      const first = result.projects[0];
      if (first === undefined) {
        setEditor(null);
        setForm(EMPTY_PROJECT_FORM);
        setBaseline(EMPTY_PROJECT_FORM);
      } else {
        const nextForm = projectToForm(first);
        setEditor({ mode: "edit", project: first });
        setForm(nextForm);
        setBaseline(nextForm);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [client, handleError]);

  useEffect(() => {
    if (startupStarted.current) return;
    startupStarted.current = true;
    void (async () => {
      await load();
      const stored = readStoredOperation();
      if (stored === null) return;
      setPendingOperation(stored);
      try {
        const operation = await client.readOperation(stored.operationId);
        if (operation.status === "pending") {
          setNotice({
            kind: "warning",
            message:
              "A previous Save Draft is still unresolved. It was checked once and was not retried.",
          });
          return;
        }
        await resolveOperation(operation, null);
      } catch (error) {
        handleError(error);
      }
    })();
  }, [client, handleError, load, resolveOperation]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  function confirmDiscard(): boolean {
    if (pendingOperation !== null) {
      setNotice({
        kind: "warning",
        message: "Resolve the previous Save Draft outcome before navigating.",
      });
      return false;
    }
    return !dirty || window.confirm("Discard your unsaved Project changes?");
  }

  async function select(projectId: string) {
    if (!confirmDiscard() || isSaving) return;
    setIsLoading(true);
    setConflict(null);
    setNotice(null);
    try {
      applyProject(await client.read(projectId));
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }

  function createNew() {
    if (!confirmDiscard() || isSaving) return;
    setEditor({ mode: "create", project: null });
    setForm(EMPTY_PROJECT_FORM);
    setBaseline(EMPTY_PROJECT_FORM);
    setErrors({});
    setConflict(null);
    setNotice(null);
  }

  async function reload() {
    if (!confirmDiscard() || isSaving) return;
    setConflict(null);
    await load();
  }

  async function save() {
    if (editor === null || isSaving || pendingOperation !== null) {
      if (pendingOperation !== null) {
        setNotice({
          kind: "warning",
          message:
            "Resolve the previous Save Draft outcome before starting another save.",
        });
      }
      return;
    }
    const validation = validateProjectForm(form);
    setErrors(validation.errors);
    if (validation.draft === undefined) {
      setNotice({
        kind: "error",
        message: "Review the highlighted fields before saving.",
      });
      return;
    }

    const attempted = validation.draft;
    const operationId = crypto.randomUUID();
    setIsSaving(true);
    setConflict(null);
    setNotice({ kind: "info", message: "Saving draft…" });
    try {
      const result =
        editor.mode === "create"
          ? await client.create(operationId, csrfToken, attempted)
          : await client.save(
              editor.project.id,
              operationId,
              csrfToken,
              editor.project.revision,
              attempted,
            );
      if (isProject(result)) {
        applyProject(result);
        setNotice({ kind: "success", message: "Draft saved." });
      } else if (result.status === "pending") {
        await pollOperation(
          { operationId, projectId: result.projectId },
          attempted,
        );
      } else {
        await resolveOperation(result, attempted);
      }
    } catch (error) {
      if (error instanceof UncertainMutationError) {
        await pollOperation(
          {
            operationId: error.operationId,
            projectId: editor.mode === "edit" ? editor.project.id : null,
          },
          attempted,
        );
      } else if (
        error instanceof AdminApiError &&
        error.code === "STALE_REVISION"
      ) {
        const authoritative = parseAuthoritativeProject(error.details);
        if (authoritative !== null) {
          setProjects((current) =>
            current.map((item) =>
              item.id === authoritative.id ? authoritative : item,
            ),
          );
          setEditor({ mode: "edit", project: authoritative });
          setBaseline(projectToForm(authoritative));
          setConflict({ attempted, authoritative });
          setNotice({
            kind: "warning",
            message: "The save was rejected because a newer draft exists.",
          });
        } else {
          handleError(error);
        }
      } else {
        handleError(error);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function keepConflictEdits() {
    setConflict(null);
    setNotice({
      kind: "info",
      message:
        "Your edits are retained. Review them, then save as a new intent.",
    });
  }

  function useSavedConflict() {
    if (conflict === null) return;
    applyProject(conflict.authoritative);
    setConflict(null);
    setNotice({ kind: "info", message: "The saved draft is now loaded." });
  }

  async function checkUnresolved() {
    if (pendingOperation === null || isSaving) return;
    setIsSaving(true);
    setNotice({ kind: "info", message: "Checking the unresolved save…" });
    try {
      const operation = await client.readOperation(
        pendingOperation.operationId,
      );
      if (!(await resolveOperation(operation, pendingAttempted))) {
        setNotice({
          kind: "warning",
          message:
            "The save is still pending. It was checked without retrying the mutation.",
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    conflict,
    checkUnresolved,
    createNew,
    dirty,
    editor,
    errors,
    form,
    isLoading,
    isSaving,
    keepConflictEdits,
    notice,
    pendingOperation,
    projects,
    reload,
    save,
    select,
    setForm,
    useSavedConflict,
  };
}
