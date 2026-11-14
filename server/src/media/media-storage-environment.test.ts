import { describe, expect, it } from "vitest";

import { validateStorageEnvironment } from "./media-storage-environment.ts";

describe("media storage environment", () => {
  it("allows storage to remain unconfigured before provisioning", () => {
    expect(validateStorageEnvironment({})).toEqual({
      success: true,
      config: null,
    });
  });

  it("accepts one complete Neon storage configuration", () => {
    expect(
      validateStorageEnvironment({
        AWS_ACCESS_KEY_ID: "storage-key",
        AWS_SECRET_ACCESS_KEY: "a-strong-storage-secret-value",
        AWS_ENDPOINT_URL_S3:
          "https://branch.storage.c-1.us-east-2.aws.neon.tech",
        AWS_REGION: "us-east-2",
        NEON_STORAGE_BUCKET: "portfolio-media",
        PATH: "C:\\Windows\\System32",
      }).success,
    ).toBe(true);
  });

  it("rejects partial or non-Neon storage configuration", () => {
    expect(
      validateStorageEnvironment({ AWS_ACCESS_KEY_ID: "storage-key" }).success,
    ).toBe(false);
    expect(
      validateStorageEnvironment({
        AWS_ACCESS_KEY_ID: "storage-key",
        AWS_SECRET_ACCESS_KEY: "a-strong-storage-secret-value",
        AWS_ENDPOINT_URL_S3: "https://storage.example.com",
        AWS_REGION: "us-east-2",
        NEON_STORAGE_BUCKET: "portfolio-media",
      }).success,
    ).toBe(false);
  });
});
