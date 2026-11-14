import { randomUUID } from "node:crypto";

import { fileTypeFromBuffer } from "file-type";

import {
  IMAGE_MIME_TYPES,
  RESUME_MIME_TYPE,
  type MediaAsset,
  type MediaAssetId,
  type UploadIntent,
} from "./media-contract.ts";
import type { MediaObjectStore } from "./media-object-store.ts";
import type { MediaRepository } from "./media-repository.ts";

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export type MediaService = {
  list(): Promise<readonly MediaAsset[]>;
  createUploadIntent(input: UploadIntent): Promise<{
    readonly asset: MediaAsset;
    readonly upload: {
      readonly url: string;
      readonly headers: Record<string, string>;
    };
  }>;
  finalize(mediaId: MediaAssetId): Promise<MediaAsset | null>;
  adminDownloadUrl(mediaId: MediaAssetId): Promise<string | null>;
  publicDownloadUrl(mediaId: MediaAssetId): Promise<string | null>;
  delete(
    mediaId: MediaAssetId,
  ): Promise<"deleted" | "not-found" | "referenced">;
};

export function createMediaService(options: {
  readonly repository: MediaRepository;
  readonly objectStore: MediaObjectStore;
}): MediaService {
  async function downloadUrl(
    mediaId: MediaAssetId,
    requirePublished: boolean,
    downloadResume: boolean,
  ): Promise<string | null> {
    const asset = await options.repository.read(mediaId);
    if (
      asset === null ||
      asset.status !== "ready" ||
      (requirePublished && !(await options.repository.isPublished(mediaId)))
    ) {
      return null;
    }
    return options.objectStore.signDownload({
      objectKey: asset.objectKey,
      ...(asset.kind === "resume_pdf" && downloadResume
        ? { downloadFilename: asset.originalFilename }
        : {}),
    });
  }

  return {
    list: () => options.repository.list(),
    createUploadIntent: async (input) => {
      const id = randomUUID();
      const objectKey = `uploads/${input.kind}/${id}.${EXTENSIONS[input.mimeType]}`;
      const now = new Date();
      const asset: MediaAsset = {
        id,
        objectKey,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        ...input,
      };
      await options.repository.insert(asset);
      return {
        asset,
        upload: await options.objectStore.signUpload({
          objectKey,
          mimeType: input.mimeType,
          byteSize: input.byteSize,
        }),
      };
    },
    finalize: async (mediaId) => {
      const asset = await options.repository.read(mediaId);
      if (asset === null) return null;
      if (asset.status === "ready") return asset;
      const metadata = await options.objectStore.readMetadata(asset.objectKey);
      const bytes = await options.objectStore.readBytes(asset.objectKey);
      const detected = await fileTypeFromBuffer(bytes);
      const allowedMimeTypes =
        asset.kind === "image" ? IMAGE_MIME_TYPES : [RESUME_MIME_TYPE];
      const valid =
        metadata.byteSize === asset.byteSize &&
        bytes.byteLength === asset.byteSize &&
        metadata.mimeType === asset.mimeType &&
        detected?.mime === asset.mimeType &&
        allowedMimeTypes.includes(asset.mimeType as never);
      await options.repository.updateStatus(
        mediaId,
        valid ? "ready" : "failed",
      );
      return options.repository.read(mediaId);
    },
    adminDownloadUrl: (mediaId) => downloadUrl(mediaId, false, false),
    publicDownloadUrl: (mediaId) => downloadUrl(mediaId, true, true),
    delete: async (mediaId) => {
      const asset = await options.repository.read(mediaId);
      if (asset === null) return "not-found";
      if (await options.repository.isReferenced(mediaId)) return "referenced";
      await options.objectStore.deleteObject(asset.objectKey);
      return (await options.repository.delete(mediaId))
        ? "deleted"
        : "not-found";
    },
  };
}
