import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminApiError, UncertainMutationError } from "../../lib/admin-http";
import type {
  DraftOperation,
  FeaturedDraft,
  SaveFeaturedResult,
} from "./project-contract";
import {
  parseAuthoritativeFeatured,
  type ProjectClient,
} from "./project-client";
import type { SaveNotice } from "./use-project-workspace";

const PENDING_FEATURED_SAVE_KEY = "portfolio-cms:pending-featured-save";
const POLL_INTERVAL_MS = 5_000;
const POLL_ATTEMPTS = 12;
const EMPTY_SLOTS = [null, null, null] as const;

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function readStoredOperation(): string | null {
  const operationId = sessionStorage.getItem(PENDING_FEATURED_SAVE_KEY);
  if (operationId === null) return null;
  if (isUuid(operationId)) return operationId;
  sessionStorage.removeItem(PENDING_FEATURED_SAVE_KEY);
  return null;
}

function storeOperation(operationId: string): void {
  sessionStorage.setItem(PENDING_FEATURED_SAVE_KEY, operationId);
}

function clearOperation(): void {
  sessionStorage.removeItem(PENDING_FEATURED_SAVE_KEY);
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function isFeaturedDraft(value: SaveFeaturedResult): value is FeaturedDraft {
  return "slots" in value;
}

export function useFeaturedDraft(options: {
  readonly client: ProjectClient;
  readonly csrfToken: string;
  readonly onUnauthorized: () => void;
}) {
  const { client, csrfToken, onUnauthorized } = options;
  const [revision, setRevision] = useState("1");
  const [slots, setSlots] = useState<FeaturedDraft["slots"]>(EMPTY_SLOTS);
  const [baseline, setBaseline] = useState<FeaturedDraft["slots"]>(EMPTY_SLOTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<SaveNotice | null>(null);
  const [pendingOperationId, setPendingOperationId] = useState<string | null>(
    null,
  );
  const startupStarted = useRef(false);

  const dirty = useMemo(
    () => JSON.stringify(slots) !== JSON.stringify(baseline),
    [baseline, slots],
  );

  const applyFeatured = useCallback((featured: FeaturedDraft) => {
    setRevision(featured.revision);
    setSlots(featured.slots);
    setBaseline(featured.slots);
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof AdminApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setNotice({
        kind: "error",
        message:
          error instanceof AdminApiError
            ? error.message
            : "The Admin API returned an unexpected response.",
      });
    },
    [onUnauthorized],
  );

  const reload = useCallback(async () => {
    const featured = await client.readFeatured();
    applyFeatured(featured);
    return featured;
  }, [applyFeatured, client]);

  const resolveOperation = useCallback(
    async (operation: DraftOperation): Promise<boolean> => {
      if (operation.status === "pending") return false;
      clearOperation();
      setPendingOperationId(null);
      await reload();
      setNotice(
        operation.status === "succeeded"
          ? { kind: "success", message: "Featured selection saved." }
          : {
              kind: "error",
              message:
                "The featured selection was not saved. The latest saved selection was loaded.",
            },
      );
      return true;
    },
    [reload],
  );

  const pollOperation = useCallback(
    async (operationId: string) => {
      storeOperation(operationId);
      setPendingOperationId(operationId);
      setNotice({
        kind: "info",
        message:
          "Featured save outcome unknown. Checking status without retrying it…",
      });
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        await delay(POLL_INTERVAL_MS);
        try {
          if (await resolveOperation(await client.readOperation(operationId))) {
            return;
          }
        } catch (error) {
          if (error instanceof AdminApiError && error.status === 401) {
            onUnauthorized();
            return;
          }
          // A failed status read cannot establish the mutation outcome.
        }
      }
      setNotice({
        kind: "warning",
        message:
          "Featured save outcome remains unknown. The mutation was not retried. Check status again later.",
      });
    },
    [client, onUnauthorized, resolveOperation],
  );

  useEffect(() => {
    if (startupStarted.current) return;
    startupStarted.current = true;
    void (async () => {
      try {
        await reload();
        const operationId = readStoredOperation();
        if (operationId === null) return;
        setPendingOperationId(operationId);
        if (
          !(await resolveOperation(await client.readOperation(operationId)))
        ) {
          setNotice({
            kind: "warning",
            message:
              "A previous featured save is still unresolved. It was checked once and was not retried.",
          });
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [client, handleError, reload, resolveOperation]);

  function setSlot(index: 0 | 1 | 2, projectId: string | null) {
    setSlots((current) => {
      const next: [string | null, string | null, string | null] = [...current];
      next[index] = projectId;
      return next;
    });
    setNotice(null);
  }

  async function save() {
    if (isSaving || pendingOperationId !== null || !dirty) return;
    const operationId = crypto.randomUUID();
    storeOperation(operationId);
    setPendingOperationId(operationId);
    setIsSaving(true);
    setNotice({ kind: "info", message: "Saving featured selection…" });
    try {
      const result = await client.saveFeatured(
        operationId,
        csrfToken,
        revision,
        slots,
      );
      if (isFeaturedDraft(result)) {
        clearOperation();
        setPendingOperationId(null);
        applyFeatured(result);
        setNotice({ kind: "success", message: "Featured selection saved." });
      } else if (!(await resolveOperation(result))) {
        await pollOperation(operationId);
      }
    } catch (error) {
      if (
        error instanceof UncertainMutationError ||
        (error instanceof AdminApiError && error.status >= 500)
      ) {
        await pollOperation(operationId);
      } else {
        clearOperation();
        setPendingOperationId(null);
        if (error instanceof AdminApiError && error.code === "STALE_REVISION") {
          const authoritative = parseAuthoritativeFeatured(error.details);
          if (authoritative !== null) {
            setRevision(authoritative.revision);
            setBaseline(authoritative.slots);
            setNotice({
              kind: "warning",
              message:
                "The featured selection changed elsewhere. Your choices remain unsaved; review and save again.",
            });
          } else {
            handleError(error);
          }
        } else {
          handleError(error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function checkUnresolved() {
    if (pendingOperationId === null || isSaving) return;
    setIsSaving(true);
    setNotice({ kind: "info", message: "Checking featured save status…" });
    try {
      if (
        !(await resolveOperation(
          await client.readOperation(pendingOperationId),
        ))
      ) {
        setNotice({
          kind: "warning",
          message:
            "The featured save is still pending. It was checked without retrying the mutation.",
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    checkUnresolved,
    dirty,
    isLoading,
    isSaving,
    notice,
    pendingOperationId,
    save,
    setSlot,
    slots,
  };
}
