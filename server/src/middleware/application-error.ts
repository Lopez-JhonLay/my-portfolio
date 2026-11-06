export type ApplicationErrorCode =
  | "BAD_REQUEST"
  | "CSRF_VALIDATION_FAILED"
  | "FORBIDDEN"
  | "INVALID_OAUTH_STATE"
  | "NOT_FOUND"
  | "OPERATION_CONFLICT"
  | "ORIGIN_NOT_ALLOWED"
  | "PUBLISH_NOT_READY"
  | "STALE_REVISION"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly details?: unknown;
  readonly status: number;

  constructor(options: {
    code: ApplicationErrorCode;
    message: string;
    status: number;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "ApplicationError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}
