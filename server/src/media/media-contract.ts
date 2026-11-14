import { z } from "zod";

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const RESUME_MIME_TYPE = "application/pdf" as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;

export const mediaAssetIdSchema = z.uuid();
export const mediaAssetKindSchema = z.enum(["image", "resume_pdf"]);
export const mediaAssetStatusSchema = z.enum(["pending", "ready", "failed"]);
export const mediaMimeTypeSchema = z.enum([
  ...IMAGE_MIME_TYPES,
  RESUME_MIME_TYPE,
]);

export const uploadIntentSchema = z
  .strictObject({
    kind: mediaAssetKindSchema,
    originalFilename: z.string().trim().min(1).max(255),
    mimeType: mediaMimeTypeSchema,
    byteSize: z.number().int().positive().max(RESUME_MAX_BYTES),
  })
  .superRefine((value, context) => {
    if (
      value.kind === "image" &&
      (!IMAGE_MIME_TYPES.includes(
        value.mimeType as (typeof IMAGE_MIME_TYPES)[number],
      ) ||
        value.byteSize > IMAGE_MAX_BYTES)
    ) {
      context.addIssue({
        code: "custom",
        message: "Images must be JPEG, PNG, or WebP and no larger than 5 MiB",
      });
    }
    if (
      value.kind === "resume_pdf" &&
      (value.mimeType !== RESUME_MIME_TYPE || value.byteSize > RESUME_MAX_BYTES)
    ) {
      context.addIssue({
        code: "custom",
        message: "The résumé must be a PDF no larger than 10 MiB",
      });
    }
  })
  .readonly();

export type MediaAssetId = z.output<typeof mediaAssetIdSchema>;
export type MediaAssetKind = z.output<typeof mediaAssetKindSchema>;
export type MediaAssetStatus = z.output<typeof mediaAssetStatusSchema>;
export type MediaMimeType = z.output<typeof mediaMimeTypeSchema>;
export type UploadIntent = z.output<typeof uploadIntentSchema>;

export type MediaAsset = UploadIntent & {
  readonly id: MediaAssetId;
  readonly objectKey: string;
  readonly status: MediaAssetStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
