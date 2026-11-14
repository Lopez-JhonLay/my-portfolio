const REQUEST_TIMEOUT_MS = 30_000;

type ErrorBody = {
  readonly error: {
    readonly code: string;
    readonly details?: unknown;
    readonly message: string;
    readonly requestId: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string" &&
    typeof value.error.requestId === "string"
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AdminApiError({
      code: "INVALID_RESPONSE",
      message: "The server returned an unreadable response.",
      status: response.status,
    });
  }
}

export class AdminApiError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly status: number;

  constructor(options: {
    readonly code: string;
    readonly details?: unknown;
    readonly message: string;
    readonly requestId?: string;
    readonly status: number;
  }) {
    super(options.message);
    this.name = "AdminApiError";
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

export class UncertainMutationError extends Error {
  readonly operationId: string;

  constructor(operationId: string) {
    super(
      "The mutation response was not received. Its outcome must be checked.",
    );
    this.name = "UncertainMutationError";
    this.operationId = operationId;
  }
}

export type AdminRequestOptions = {
  readonly body?: unknown;
  readonly csrfToken?: string;
  readonly method?: "DELETE" | "GET" | "POST" | "PUT";
  readonly operationId?: string;
  readonly signal?: AbortSignal;
};

/** Performs one credentialed Admin request with no automatic retries. */
export async function adminRequest(
  apiOrigin: string,
  path: string,
  options: AdminRequestOptions = {},
): Promise<unknown> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (options.csrfToken !== undefined)
    headers.set("X-CSRF-Token", options.csrfToken);
  if (options.operationId !== undefined)
    headers.set("Idempotency-Key", options.operationId);

  let response: Response;
  try {
    response = await fetch(new URL(path, apiOrigin), {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      headers,
      method: options.method ?? "GET",
      signal,
    });
  } catch (error) {
    if (options.operationId !== undefined)
      throw new UncertainMutationError(options.operationId);
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new AdminApiError({
        code: "REQUEST_TIMEOUT",
        message: "The request timed out after 30 seconds.",
        status: 0,
      });
    }
    throw new AdminApiError({
      code: "NETWORK_ERROR",
      message: "The server could not be reached.",
      status: 0,
    });
  }

  if (response.status === 204) return null;
  const payload = await readJson(response);
  if (!response.ok) {
    if (!isErrorBody(payload)) {
      throw new AdminApiError({
        code: "INVALID_RESPONSE",
        message: "The server returned an unexpected error response.",
        status: response.status,
      });
    }
    throw new AdminApiError({
      code: payload.error.code,
      details: payload.error.details,
      message: payload.error.message,
      requestId: payload.error.requestId,
      status: response.status,
    });
  }

  return payload;
}
