import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminApiError, UncertainMutationError } from "../../lib/admin-http";
import type {
  AdminContentSection,
  ContentFieldErrors,
  ContentSaveOperation,
  EditableContentDocument,
  EditableContentSectionKey,
} from "./content-contract";
import { parseAdminContentSection, type ContentClient } from "./content-client";
import { validateEditableContent } from "./content-validation";

const POLL_INTERVAL_MS = 5_000;
const POLL_ATTEMPTS = 12;

type Notice = {
  readonly kind: "error" | "info" | "success" | "warning";
  readonly message: string;
};
type Conflict = {
  readonly attempted: EditableContentDocument;
  readonly authoritative: AdminContentSection;
};

function operationStorageKey(sectionKey: EditableContentSectionKey) {
  return `portfolio-cms:pending-content-save:${sectionKey}`;
}

function delay(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function readStoredOperation(
  sectionKey: EditableContentSectionKey,
): string | null {
  const value = sessionStorage.getItem(operationStorageKey(sectionKey));
  return value !== null && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function friendlyError(error: unknown): string {
  return error instanceof AdminApiError
    ? error.message
    : "The Admin API returned an unexpected response.";
}

export function useContentEditor(options: {
  readonly client: ContentClient;
  readonly csrfToken: string;
  readonly onUnauthorized: () => void;
  readonly sectionKey: EditableContentSectionKey;
}) {
  const { client, csrfToken, onUnauthorized, sectionKey } = options;
  const [section, setSection] = useState<AdminContentSection | null>(null);
  const [document, setDocument] = useState<EditableContentDocument | null>(
    null,
  );
  const [baseline, setBaseline] = useState<EditableContentDocument | null>(
    null,
  );
  const [errors, setErrors] = useState<ContentFieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [pendingOperationId, setPendingOperationId] = useState<string | null>(
    null,
  );
  const [pendingAttempted, setPendingAttempted] =
    useState<EditableContentDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const startupStarted = useRef(false);
  const dirty = useMemo(
    () =>
      document !== null &&
      baseline !== null &&
      JSON.stringify(document) !== JSON.stringify(baseline),
    [baseline, document],
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

  const applySection = useCallback((next: AdminContentSection) => {
    setSection(next);
    setDocument(next.document);
    setBaseline(next.document);
    setErrors({});
    setConflict(null);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      applySection(await client.read(sectionKey));
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [applySection, client, handleError, sectionKey]);

  const resolveOperation = useCallback(
    async (
      operation: ContentSaveOperation,
      attempted: EditableContentDocument | null,
    ): Promise<boolean> => {
      if (operation.status === "pending") return false;
      sessionStorage.removeItem(operationStorageKey(sectionKey));
      setPendingOperationId(null);
      setPendingAttempted(null);
      const authoritative = await client.read(sectionKey);
      if (operation.status === "succeeded") {
        applySection(authoritative);
        setNotice({ kind: "success", message: "Draft saved." });
        return true;
      }
      if (operation.outcomeCode === "stale_revision" && attempted !== null) {
        setSection(authoritative);
        setBaseline(authoritative.document);
        setConflict({ attempted, authoritative });
        setNotice({
          kind: "warning",
          message:
            "A newer saved draft exists. Choose which version to continue with.",
        });
        return true;
      }
      applySection(authoritative);
      setNotice({
        kind: "error",
        message:
          "The previous save did not succeed. The latest draft was loaded.",
      });
      return true;
    },
    [applySection, client, sectionKey],
  );

  const pollOperation = useCallback(
    async (operationId: string, attempted: EditableContentDocument) => {
      sessionStorage.setItem(operationStorageKey(sectionKey), operationId);
      setPendingOperationId(operationId);
      setPendingAttempted(attempted);
      setNotice({
        kind: "info",
        message:
          "Save outcome unknown. Checking without retrying the mutation…",
      });
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        await delay(POLL_INTERVAL_MS);
        try {
          if (
            await resolveOperation(
              await client.readOperation(operationId),
              attempted,
            )
          )
            return;
        } catch (error) {
          if (error instanceof AdminApiError && error.status === 401) {
            onUnauthorized();
            return;
          }
        }
      }
      setNotice({
        kind: "warning",
        message:
          "Save outcome is still unknown. Check the operation again before another save.",
      });
    },
    [client, onUnauthorized, resolveOperation, sectionKey],
  );

  useEffect(() => {
    if (startupStarted.current) return;
    startupStarted.current = true;
    void (async () => {
      await load();
      const operationId = readStoredOperation(sectionKey);
      if (operationId === null) return;
      setPendingOperationId(operationId);
      try {
        const operation = await client.readOperation(operationId);
        if (!(await resolveOperation(operation, null)))
          setNotice({
            kind: "warning",
            message:
              "A previous Save Draft is still unresolved. It was checked without retrying.",
          });
      } catch (error) {
        handleError(error);
      }
    })();
  }, [client, handleError, load, resolveOperation, sectionKey]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const discardChanges = useCallback(() => {
    if (baseline !== null) setDocument(baseline);
    setErrors({});
    setConflict(null);
    setNotice(null);
  }, [baseline]);

  async function save() {
    if (
      section === null ||
      document === null ||
      isSaving ||
      pendingOperationId !== null
    )
      return;
    const validation = validateEditableContent(sectionKey, document);
    setErrors(validation.errors);
    if (validation.document === undefined) {
      setNotice({
        kind: "error",
        message: "Review the highlighted fields before saving.",
      });
      return;
    }
    const attempted = validation.document;
    const operationId = crypto.randomUUID();
    setIsSaving(true);
    setConflict(null);
    setNotice({ kind: "info", message: "Saving draft…" });
    try {
      const result = await client.save(
        sectionKey,
        operationId,
        csrfToken,
        section.revision,
        attempted,
      );
      if ("document" in result) {
        applySection(result);
        setNotice({ kind: "success", message: "Draft saved." });
      } else if (result.status === "pending")
        await pollOperation(operationId, attempted);
      else await resolveOperation(result, attempted);
    } catch (error) {
      if (error instanceof UncertainMutationError)
        await pollOperation(error.operationId, attempted);
      else if (
        error instanceof AdminApiError &&
        error.code === "STALE_REVISION"
      ) {
        try {
          const details = error.details;
          if (
            typeof details !== "object" ||
            details === null ||
            !("authoritative" in details)
          )
            throw error;
          const authoritative = parseAdminContentSection(details.authoritative);
          setSection(authoritative);
          setBaseline(authoritative.document);
          setConflict({ attempted, authoritative });
          setNotice({
            kind: "warning",
            message:
              "A newer saved draft exists. Choose which version to continue with.",
          });
        } catch {
          handleError(error);
        }
      } else handleError(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function checkUnresolved() {
    if (pendingOperationId === null || isSaving) return;
    setIsSaving(true);
    try {
      if (
        !(await resolveOperation(
          await client.readOperation(pendingOperationId),
          pendingAttempted,
        ))
      )
        setNotice({
          kind: "warning",
          message: "The save is still pending and was not retried.",
        });
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  }

  function keepConflictEdits() {
    if (conflict === null) return;
    setDocument(conflict.attempted);
    setConflict(null);
    setNotice({
      kind: "info",
      message: "Your edits are retained. Review and save as a new intent.",
    });
  }

  function useSavedConflict() {
    if (conflict === null) return;
    applySection(conflict.authoritative);
    setNotice({ kind: "info", message: "The latest saved draft is loaded." });
  }

  return {
    checkUnresolved,
    conflict,
    dirty,
    discardChanges,
    document,
    errors,
    isLoading,
    isSaving,
    keepConflictEdits,
    load,
    notice,
    pendingOperationId,
    save,
    section,
    setDocument,
    useSavedConflict,
  };
}
