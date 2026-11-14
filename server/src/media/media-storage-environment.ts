import { z } from "zod";

import type { MediaStorageConfig } from "./media-object-store.ts";

const storageSchema = z
  .strictObject({
    AWS_ACCESS_KEY_ID: z.string().trim().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(20),
    AWS_ENDPOINT_URL_S3: z.url().refine((value) => {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.endsWith(".neon.tech");
    }),
    AWS_REGION: z.enum([
      "us-east-2",
      "us-east-1",
      "eu-central-1",
      "ap-southeast-1",
    ]),
    NEON_STORAGE_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  })
  .transform(
    ({
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_ENDPOINT_URL_S3,
      AWS_REGION,
      NEON_STORAGE_BUCKET,
    }): MediaStorageConfig => ({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      endpoint: AWS_ENDPOINT_URL_S3,
      region: AWS_REGION,
      bucket: NEON_STORAGE_BUCKET,
    }),
  );

const STORAGE_FIELDS = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
  "NEON_STORAGE_BUCKET",
] as const;

export type StorageEnvironmentResult =
  | { readonly success: true; readonly config: MediaStorageConfig | null }
  | { readonly success: false; readonly invalidFields: readonly string[] };

export function validateStorageEnvironment(
  environment: NodeJS.ProcessEnv,
): StorageEnvironmentResult {
  const presentFields = STORAGE_FIELDS.filter(
    (field) => environment[field] !== undefined,
  );
  if (presentFields.length === 0) return { success: true, config: null };
  const storageEnvironment = Object.fromEntries(
    STORAGE_FIELDS.map((field) => [field, environment[field]]),
  );
  const result = storageSchema.safeParse(storageEnvironment);
  if (result.success) return { success: true, config: result.data };
  return {
    success: false,
    invalidFields: [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ],
  };
}
