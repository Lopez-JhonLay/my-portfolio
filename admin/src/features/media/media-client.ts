import { adminRequest } from "../../lib/admin-http";

export type MediaAsset = {
  readonly id: string;
  readonly kind: "image" | "resume_pdf";
  readonly mimeType:
    "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  readonly byteSize: number;
  readonly originalFilename: string;
  readonly status: "pending" | "ready" | "failed";
  readonly createdAt: string;
  readonly updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAsset(value: unknown): MediaAsset {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    (value.kind !== "image" && value.kind !== "resume_pdf") ||
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      String(value.mimeType),
    ) ||
    !Number.isInteger(value.byteSize) ||
    typeof value.originalFilename !== "string" ||
    !["pending", "ready", "failed"].includes(String(value.status)) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw new Error("Invalid media response");
  }
  return value as MediaAsset;
}

export function createMediaClient(apiOrigin: string) {
  return {
    list: async (signal?: AbortSignal) => {
      const result = await adminRequest(apiOrigin, "/api/admin/media", {
        signal,
      });
      if (!isRecord(result) || !Array.isArray(result.assets)) {
        throw new Error("Invalid media list response");
      }
      return result.assets.map(parseAsset);
    },
    upload: async (file: File, csrfToken: string) => {
      const kind = file.type === "application/pdf" ? "resume_pdf" : "image";
      const intent = await adminRequest(
        apiOrigin,
        "/api/admin/media/upload-intents",
        {
          body: {
            kind,
            originalFilename: file.name,
            mimeType: file.type,
            byteSize: file.size,
          },
          csrfToken,
          method: "POST",
        },
      );
      if (
        !isRecord(intent) ||
        !isRecord(intent.upload) ||
        typeof intent.upload.url !== "string" ||
        !isRecord(intent.upload.headers) ||
        !("asset" in intent)
      ) {
        throw new Error("Invalid upload intent response");
      }
      const asset = parseAsset(intent.asset);
      const uploadResponse = await fetch(intent.upload.url, {
        method: "PUT",
        headers: Object.fromEntries(
          Object.entries(intent.upload.headers).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        ),
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("The file upload failed");
      return parseAsset(
        await adminRequest(apiOrigin, `/api/admin/media/${asset.id}/finalize`, {
          body: {},
          csrfToken,
          method: "POST",
        }),
      );
    },
    delete: (mediaId: string, csrfToken: string) =>
      adminRequest(apiOrigin, `/api/admin/media/${mediaId}`, {
        csrfToken,
        method: "DELETE",
      }),
    fileUrl: (mediaId: string) =>
      `${apiOrigin}/api/admin/media/${mediaId}/file`,
  };
}

export type MediaClient = ReturnType<typeof createMediaClient>;
