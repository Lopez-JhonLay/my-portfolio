import { describe, expect, it } from "vitest";

import { uploadIntentSchema } from "./media-contract.ts";

describe("media upload contract", () => {
  it("accepts bounded image and résumé uploads", () => {
    expect(
      uploadIntentSchema.safeParse({
        kind: "image",
        originalFilename: "profile.webp",
        mimeType: "image/webp",
        byteSize: 1024,
      }).success,
    ).toBe(true);
    expect(
      uploadIntentSchema.safeParse({
        kind: "resume_pdf",
        originalFilename: "resume.pdf",
        mimeType: "application/pdf",
        byteSize: 2048,
      }).success,
    ).toBe(true);
  });

  it("rejects SVG, mismatched kinds, and oversized files", () => {
    for (const input of [
      {
        kind: "image",
        originalFilename: "icon.svg",
        mimeType: "image/svg+xml",
        byteSize: 100,
      },
      {
        kind: "resume_pdf",
        originalFilename: "resume.png",
        mimeType: "image/png",
        byteSize: 100,
      },
      {
        kind: "image",
        originalFilename: "large.jpg",
        mimeType: "image/jpeg",
        byteSize: 6 * 1024 * 1024,
      },
    ]) {
      expect(uploadIntentSchema.safeParse(input).success).toBe(false);
    }
  });
});
