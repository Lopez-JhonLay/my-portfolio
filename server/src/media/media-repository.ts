import { asc, eq } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
  TransactionSessionBoundary,
} from "../db/database-session.ts";
import {
  contentSectionDrafts,
  draftProjectMedia,
  mediaAssets,
  publishedContentSections,
  publishedProjectMedia,
} from "../db/schema/project-schema.ts";
import type { MediaAsset, MediaAssetId } from "./media-contract.ts";

function containsMediaId(value: unknown, mediaId: string): boolean {
  if (value === mediaId) return true;
  if (Array.isArray(value)) {
    return value.some((item) => containsMediaId(item, mediaId));
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some((item) => containsMediaId(item, mediaId));
  }
  return false;
}

function mapAsset(row: typeof mediaAssets.$inferSelect): MediaAsset {
  return {
    id: row.id,
    kind: row.kind,
    objectKey: row.objectKey,
    mimeType: row.mimeType as MediaAsset["mimeType"],
    byteSize: Number(row.byteSize),
    originalFilename: row.originalFilename,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type MediaRepository = {
  list(): Promise<readonly MediaAsset[]>;
  read(mediaId: MediaAssetId): Promise<MediaAsset | null>;
  insert(asset: MediaAsset): Promise<void>;
  updateStatus(
    mediaId: MediaAssetId,
    status: "ready" | "failed",
  ): Promise<boolean>;
  isReferenced(mediaId: MediaAssetId): Promise<boolean>;
  isPublished(mediaId: MediaAssetId): Promise<boolean>;
  delete(mediaId: MediaAssetId): Promise<boolean>;
};

export function createDrizzleMediaRepository(options: {
  readonly reads: SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction>;
  readonly writes: TransactionSessionBoundary<ProjectDatabaseTransaction>;
}): MediaRepository {
  async function documentsReference(
    session: ProjectDatabaseTransaction,
    mediaId: string,
    publishedOnly: boolean,
  ): Promise<boolean> {
    const published = await session
      .select({ document: publishedContentSections.document })
      .from(publishedContentSections);
    if (published.some(({ document }) => containsMediaId(document, mediaId))) {
      return true;
    }
    if (publishedOnly) return false;
    const drafts = await session
      .select({ document: contentSectionDrafts.document })
      .from(contentSectionDrafts);
    return drafts.some(({ document }) => containsMediaId(document, mediaId));
  }

  return {
    list: () =>
      options.reads.withSnapshot(async (session) =>
        (
          await session
            .select()
            .from(mediaAssets)
            .orderBy(asc(mediaAssets.createdAt), asc(mediaAssets.id))
        ).map(mapAsset),
      ),
    read: (mediaId) =>
      options.reads.withSnapshot(async (session) => {
        const rows = await session
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.id, mediaId))
          .limit(1);
        return rows[0] === undefined ? null : mapAsset(rows[0]);
      }),
    insert: (asset) =>
      options.writes.withTransaction(async (session) => {
        await session.insert(mediaAssets).values({
          id: asset.id,
          kind: asset.kind,
          objectKey: asset.objectKey,
          mimeType: asset.mimeType,
          byteSize: BigInt(asset.byteSize),
          originalFilename: asset.originalFilename,
          status: asset.status,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        });
      }),
    updateStatus: (mediaId, status) =>
      options.writes.withTransaction(async (session) => {
        const rows = await session
          .update(mediaAssets)
          .set({ status, updatedAt: new Date() })
          .where(eq(mediaAssets.id, mediaId))
          .returning({ id: mediaAssets.id });
        return rows.length === 1;
      }),
    isReferenced: (mediaId) =>
      options.reads.withSnapshot(async (session) => {
        const [draftRows, publishedRows] = await Promise.all([
          session
            .select({ id: draftProjectMedia.mediaId })
            .from(draftProjectMedia)
            .where(eq(draftProjectMedia.mediaId, mediaId))
            .limit(1),
          session
            .select({ id: publishedProjectMedia.mediaId })
            .from(publishedProjectMedia)
            .where(eq(publishedProjectMedia.mediaId, mediaId))
            .limit(1),
        ]);
        return (
          draftRows.length > 0 ||
          publishedRows.length > 0 ||
          (await documentsReference(session, mediaId, false))
        );
      }),
    isPublished: (mediaId) =>
      options.reads.withSnapshot(async (session) => {
        const rows = await session
          .select({ id: publishedProjectMedia.mediaId })
          .from(publishedProjectMedia)
          .where(eq(publishedProjectMedia.mediaId, mediaId))
          .limit(1);
        return (
          rows.length > 0 || (await documentsReference(session, mediaId, true))
        );
      }),
    delete: (mediaId) =>
      options.writes.withTransaction(async (session) => {
        const rows = await session
          .delete(mediaAssets)
          .where(eq(mediaAssets.id, mediaId))
          .returning({ id: mediaAssets.id });
        return rows.length === 1;
      }),
  };
}
