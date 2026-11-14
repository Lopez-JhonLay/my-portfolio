import { z } from "zod";

const LOOPBACK_HOST = "127.0.0.1";
const NEON_HOST_SUFFIX = ".neon.tech";
const DEFAULT_PORT = 3000;
const MAX_PORT = 65_535;
const SESSION_TTL_MS = 8 * 60 * 60 * 1_000;

const portSchema = z
  .string()
  .regex(/^[1-9]\d{0,4}$/)
  .transform(Number)
  .refine((port) => port <= MAX_PORT);

function isLocalUrl(value: string, expectedPath?: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);

  return (
    url.protocol === "http:" &&
    url.hostname === LOOPBACK_HOST &&
    url.username.length === 0 &&
    url.password.length === 0 &&
    url.search.length === 0 &&
    url.hash.length === 0 &&
    (expectedPath === undefined || url.pathname === expectedPath)
  );
}

function hasSingleValue(url: URL, name: string, value: string): boolean {
  const values = url.searchParams.getAll(name);
  return values.length === 1 && values[0] === value;
}

function isDatabaseUrl(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);

  const hasRequiredParts =
    (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
    url.username.length > 0 &&
    url.password.length > 0 &&
    url.pathname.length > 1 &&
    url.hash.length === 0;

  if (!hasRequiredParts) return false;

  if (url.hostname === LOOPBACK_HOST) {
    return url.password.length >= 20 && url.search.length === 0;
  }
  if (!url.hostname.endsWith(NEON_HOST_SUFFIX)) return false;

  const allowedParameters = new Set(["channel_binding", "sslmode"]);
  if (
    Array.from(url.searchParams.keys()).some(
      (name) => !allowedParameters.has(name),
    )
  ) {
    return false;
  }

  const secureSslMode = ["require", "verify-ca", "verify-full"].some((mode) =>
    hasSingleValue(url, "sslmode", mode),
  );
  const channelBindingValues = url.searchParams.getAll("channel_binding");

  return (
    secureSslMode &&
    (channelBindingValues.length === 0 ||
      hasSingleValue(url, "channel_binding", "require"))
  );
}

const environmentSchema = z
  .object({
    ADMIN_ORIGIN: z
      .string()
      .refine((value) => isLocalUrl(value) && new URL(value).pathname === "/"),
    DATABASE_URL: z.string().refine(isDatabaseUrl),
    GITHUB_ADMIN_USER_ID: z.string().regex(/^[1-9]\d*$/),
    GITHUB_CALLBACK_URL: z
      .string()
      .refine((value) => isLocalUrl(value, "/api/auth/github/callback")),
    GITHUB_CLIENT_ID: z.string().trim().min(1).max(255),
    GITHUB_CLIENT_SECRET: z.string().min(20).max(255),
    HOST: z
      .literal(LOOPBACK_HOST)
      .optional()
      .transform((host) => host ?? LOOPBACK_HOST),
    PORT: portSchema.optional().transform((port) => port ?? DEFAULT_PORT),
    PUBLIC_ORIGIN: z
      .string()
      .refine((value) => isLocalUrl(value) && new URL(value).pathname === "/"),
  })
  .transform(
    ({
      ADMIN_ORIGIN,
      DATABASE_URL,
      GITHUB_ADMIN_USER_ID,
      GITHUB_CALLBACK_URL,
      GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET,
      HOST,
      PORT,
      PUBLIC_ORIGIN,
    }) => ({
      adminOrigin: ADMIN_ORIGIN,
      adminUserId: GITHUB_ADMIN_USER_ID,
      databaseUrl: DATABASE_URL,
      githubCallbackUrl: GITHUB_CALLBACK_URL,
      githubClientId: GITHUB_CLIENT_ID,
      githubClientSecret: GITHUB_CLIENT_SECRET,
      host: HOST,
      port: PORT,
      publicOrigin: PUBLIC_ORIGIN,
      sessionTtlMs: SESSION_TTL_MS,
    }),
  )
  .readonly();

type EnvironmentField =
  | "ADMIN_ORIGIN"
  | "DATABASE_URL"
  | "GITHUB_ADMIN_USER_ID"
  | "GITHUB_CALLBACK_URL"
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET"
  | "HOST"
  | "PORT"
  | "PUBLIC_ORIGIN";

const ENVIRONMENT_FIELDS = new Set<EnvironmentField>([
  "ADMIN_ORIGIN",
  "DATABASE_URL",
  "GITHUB_ADMIN_USER_ID",
  "GITHUB_CALLBACK_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "HOST",
  "PORT",
  "PUBLIC_ORIGIN",
]);

export type ServerEnvironment = z.output<typeof environmentSchema>;

export type EnvironmentValidationResult =
  | {
      success: true;
      data: ServerEnvironment;
    }
  | {
      success: false;
      invalidFields: readonly EnvironmentField[];
    };

export function validateEnvironment(
  environment: NodeJS.ProcessEnv,
): EnvironmentValidationResult {
  const result = environmentSchema.safeParse(environment);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const invalidFields = Array.from(
    new Set(
      result.error.issues.flatMap((issue): EnvironmentField[] => {
        const field = issue.path[0];

        return typeof field === "string" &&
          ENVIRONMENT_FIELDS.has(field as EnvironmentField)
          ? [field as EnvironmentField]
          : [];
      }),
    ),
  );

  return { success: false, invalidFields };
}
