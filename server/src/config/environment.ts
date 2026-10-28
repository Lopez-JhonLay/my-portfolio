import { z } from "zod";

const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;
const MAX_PORT = 65_535;

const portSchema = z
  .string()
  .regex(/^[1-9]\d{0,4}$/)
  .transform(Number)
  .refine((port) => port <= MAX_PORT);

const environmentSchema = z
  .object({
    HOST: z
      .literal(LOOPBACK_HOST)
      .optional()
      .transform((host) => host ?? LOOPBACK_HOST),
    PORT: portSchema.optional().transform((port) => port ?? DEFAULT_PORT),
  })
  .transform(({ HOST, PORT }) => ({ host: HOST, port: PORT }))
  .readonly();

type EnvironmentField = "HOST" | "PORT";

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

        return field === "HOST" || field === "PORT" ? [field] : [];
      }),
    ),
  );

  return { success: false, invalidFields };
}
