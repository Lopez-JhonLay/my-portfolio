import { useCallback, useEffect, useRef, useState } from "react";

import { AdminApiError, UncertainMutationError } from "../../lib/admin-http";
import type { PublicationOperation } from "./project-contract";
import type { ProjectClient } from "./project-client";
import type { SaveNotice } from "./use-project-workspace";

const PENDING_PUBLICATION_KEY = "portfolio-cms:pending-project-publication";
const POLL_INTERVAL_MS = 5_000;
const POLL_ATTEMPTS = 12;

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function readStoredOperation(): string | null {
  const operationId = sessionStorage.getItem(PENDING_PUBLICATION_KEY);
  if (operationId === null) return null;
  if (isUuid(operationId)) return operationId;
  sessionStorage.removeItem(PENDING_PUBLICATION_KEY);
  return null;
}

function storeOperation(operationId: string): void {
  sessionStorage.setItem(PENDING_PUBLICATION_KEY, operationId);
}

function clearOperation(): void {
  sessionStorage.removeItem(PENDING_PUBLICATION_KEY);
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

export function useProjectPublication(options: {
  readonly client: ProjectClient;
  readonly csrfToken: string;
  readonly onUnauthorized: () => void;
}) {
  const { client, csrfToken, onUnauthorized } = options;
  const [isPublishing, setIsPublishing] = useState(false);
  const [notice, setNotice] = useState<SaveNotice | null>(null);
  const [pendingOperationId, setPendingOperationId] = useState<string | null>(
    null,
  );
  const startupStarted = useRef(false);

  const handleReadError = useCallback(
    (error: unknown) => {
      if (error instanceof AdminApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setNotice({
        kind: "warning",
        message:
          "Publication status could not be read. The publish operation was not retried.",
      });
    },
    [onUnauthorized],
  );

  const resolveOperation = useCallback(
    (operation: PublicationOperation): boolean => {
      if (operation.status === "pending") return false;
      clearOperation();
      setPendingOperationId(null);
      if (operation.status === "succeeded") {
        setNotice({
          kind: "success",
          message: `Published snapshot ${operation.snapshotRevision}.`,
        });
      } else {
        setNotice({
          kind: "error",
          message:
            "Publish Updates is not ready. Save valid drafts and select exactly three distinct eligible featured Projects.",
        });
      }
      return true;
    },
    [],
  );

  const pollOperation = useCallback(
    async (operationId: string) => {
      storeOperation(operationId);
      setPendingOperationId(operationId);
      setNotice({
        kind: "info",
        message:
          "Publish outcome unknown. Checking status without retrying publication…",
      });
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        await delay(POLL_INTERVAL_MS);
        try {
          const operation = await client.readPublication(operationId);
          if (resolveOperation(operation)) return;
        } catch (error) {
          if (error instanceof AdminApiError && error.status === 401) {
            onUnauthorized();
            return;
          }
          // A failed read cannot establish the publication outcome.
        }
      }
      setNotice({
        kind: "warning",
        message:
          "Publish outcome remains unknown. Nothing was republished. Reload later or check status again.",
      });
    },
    [client, onUnauthorized, resolveOperation],
  );

  useEffect(() => {
    if (startupStarted.current) return;
    startupStarted.current = true;
    const operationId = readStoredOperation();
    if (operationId === null) return;
    setPendingOperationId(operationId);
    void client.readPublication(operationId).then((operation) => {
      if (!resolveOperation(operation)) {
        setNotice({
          kind: "warning",
          message:
            "A previous publication is still unresolved. It was checked once and was not retried.",
        });
      }
    }, handleReadError);
  }, [client, handleReadError, resolveOperation]);

  async function publish() {
    if (isPublishing || pendingOperationId !== null) return;
    const operationId = crypto.randomUUID();
    storeOperation(operationId);
    setPendingOperationId(operationId);
    setIsPublishing(true);
    setNotice({ kind: "info", message: "Publishing saved updates…" });
    try {
      const operation = await client.publish(operationId, csrfToken);
      if (!resolveOperation(operation)) await pollOperation(operationId);
    } catch (error) {
      if (
        error instanceof UncertainMutationError ||
        (error instanceof AdminApiError && error.status >= 500)
      ) {
        await pollOperation(operationId);
      } else {
        clearOperation();
        setPendingOperationId(null);
        if (error instanceof AdminApiError && error.status === 401) {
          onUnauthorized();
        } else if (
          error instanceof AdminApiError &&
          error.code === "PUBLISH_NOT_READY"
        ) {
          setNotice({
            kind: "error",
            message:
              "Publish Updates is not ready. Save valid drafts and select exactly three distinct eligible featured Projects.",
          });
        } else {
          setNotice({
            kind: "error",
            message:
              error instanceof AdminApiError
                ? error.message
                : "The Admin API returned an unexpected response.",
          });
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function checkUnresolved() {
    if (pendingOperationId === null || isPublishing) return;
    setIsPublishing(true);
    setNotice({ kind: "info", message: "Checking publication status…" });
    try {
      const operation = await client.readPublication(pendingOperationId);
      if (!resolveOperation(operation)) {
        setNotice({
          kind: "warning",
          message:
            "Publication is still pending. It was checked without retrying the mutation.",
        });
      }
    } catch (error) {
      handleReadError(error);
    } finally {
      setIsPublishing(false);
    }
  }

  return {
    checkUnresolved,
    isPublishing,
    notice,
    pendingOperationId,
    publish,
  };
}
