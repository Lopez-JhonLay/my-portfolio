import { describe, expect, it, vi } from "vitest";

import type { MediaAsset, MediaAssetId } from "./media-contract.ts";
import type { MediaObjectStore } from "./media-object-store.ts";
import type { MediaRepository } from "./media-repository.ts";
import { createMediaService } from "./media-service.ts";

const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

function createFixture(
  options: { referenced?: boolean; published?: boolean } = {},
) {
  const assets = new Map<MediaAssetId, MediaAsset>();
  const deleteObject = vi.fn(() => Promise.resolve());
  const signDownload = vi.fn(() =>
    Promise.resolve("https://storage.example/read"),
  );
  const repository: MediaRepository = {
    list: () => Promise.resolve([...assets.values()]),
    read: (id) => Promise.resolve(assets.get(id) ?? null),
    insert: (asset) => {
      assets.set(asset.id, asset);
      return Promise.resolve();
    },
    updateStatus: (id, status) => {
      const asset = assets.get(id);
      if (asset === undefined) return Promise.resolve(false);
      assets.set(id, { ...asset, status, updatedAt: new Date() });
      return Promise.resolve(true);
    },
    isReferenced: () => Promise.resolve(options.referenced ?? false),
    isPublished: () => Promise.resolve(options.published ?? false),
    delete: (id) => Promise.resolve(assets.delete(id)),
  };
  const objectStore: MediaObjectStore = {
    signUpload: vi.fn(() =>
      Promise.resolve({ url: "https://storage.example/upload", headers: {} }),
    ),
    readMetadata: vi.fn(() =>
      Promise.resolve({ byteSize: PNG_BYTES.length, mimeType: "image/png" }),
    ),
    readBytes: vi.fn(() => Promise.resolve(PNG_BYTES)),
    signDownload,
    deleteObject,
  };
  return { assets, deleteObject, objectStore, repository, signDownload };
}

describe("media service", () => {
  it("creates immutable upload keys and verifies the actual file signature", async () => {
    const fixture = createFixture();
    const service = createMediaService(fixture);
    const intent = await service.createUploadIntent({
      kind: "image",
      originalFilename: "profile.png",
      mimeType: "image/png",
      byteSize: PNG_BYTES.length,
    });

    expect(intent.asset.objectKey).toMatch(/^uploads\/image\/[0-9a-f-]+\.png$/);
    expect((await service.finalize(intent.asset.id))?.status).toBe("ready");
  });

  it("refuses public draft access and deletion while referenced", async () => {
    const fixture = createFixture({ referenced: true, published: false });
    const service = createMediaService(fixture);
    const intent = await service.createUploadIntent({
      kind: "image",
      originalFilename: "cover.png",
      mimeType: "image/png",
      byteSize: PNG_BYTES.length,
    });
    await service.finalize(intent.asset.id);

    await expect(
      service.publicDownloadUrl(intent.asset.id),
    ).resolves.toBeNull();
    await expect(service.delete(intent.asset.id)).resolves.toBe("referenced");
    expect(fixture.deleteObject).not.toHaveBeenCalled();
  });

  it("signs only ready published media for public reads", async () => {
    const fixture = createFixture({ published: true });
    const service = createMediaService(fixture);
    const intent = await service.createUploadIntent({
      kind: "image",
      originalFilename: "cover.png",
      mimeType: "image/png",
      byteSize: PNG_BYTES.length,
    });
    await service.finalize(intent.asset.id);

    await expect(service.publicDownloadUrl(intent.asset.id)).resolves.toBe(
      "https://storage.example/read",
    );
  });

  it("previews résumés inline for Admin and downloads them publicly", async () => {
    const fixture = createFixture({ published: true });
    const service = createMediaService(fixture);
    const mediaId = "11111111-1111-4111-8111-111111111111" as MediaAssetId;
    fixture.assets.set(mediaId, {
      id: mediaId,
      kind: "resume_pdf",
      objectKey: `uploads/resume_pdf/${mediaId}.pdf`,
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      byteSize: 1_024,
      status: "ready",
      createdAt: new Date("2026-11-14T00:00:00.000Z"),
      updatedAt: new Date("2026-11-14T00:00:00.000Z"),
    });

    await service.adminDownloadUrl(mediaId);
    expect(fixture.signDownload).toHaveBeenLastCalledWith({
      objectKey: `uploads/resume_pdf/${mediaId}.pdf`,
    });

    await service.publicDownloadUrl(mediaId);
    expect(fixture.signDownload).toHaveBeenLastCalledWith({
      objectKey: `uploads/resume_pdf/${mediaId}.pdf`,
      downloadFilename: "resume.pdf",
    });
  });
});
