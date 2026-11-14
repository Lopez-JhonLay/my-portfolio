import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { MediaMimeType } from "./media-contract.ts";

export type StoredObjectMetadata = {
  readonly byteSize: number;
  readonly mimeType: string | undefined;
};

export type MediaObjectStore = {
  signUpload(input: {
    readonly objectKey: string;
    readonly mimeType: MediaMimeType;
    readonly byteSize: number;
  }): Promise<{
    readonly url: string;
    readonly headers: Record<string, string>;
  }>;
  readMetadata(objectKey: string): Promise<StoredObjectMetadata>;
  readBytes(objectKey: string): Promise<Uint8Array>;
  signDownload(input: {
    readonly objectKey: string;
    readonly downloadFilename?: string;
  }): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
};

export type MediaStorageConfig = {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
};

export function createS3MediaObjectStore(
  config: MediaStorageConfig,
): MediaObjectStore {
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
  });

  return {
    signUpload: async ({ objectKey, mimeType, byteSize }) => ({
      url: await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          ContentLength: byteSize,
          ContentType: mimeType,
        }),
        { expiresIn: 5 * 60 },
      ),
      headers: { "content-type": mimeType },
    }),
    readMetadata: async (objectKey) => {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: config.bucket, Key: objectKey }),
      );
      return {
        byteSize: result.ContentLength ?? 0,
        mimeType: result.ContentType,
      };
    },
    readBytes: async (objectKey) => {
      const result = await client.send(
        new GetObjectCommand({ Bucket: config.bucket, Key: objectKey }),
      );
      if (result.Body === undefined)
        throw new Error("Stored object body is missing");
      return result.Body.transformToByteArray();
    },
    signDownload: ({ objectKey, downloadFilename }) =>
      getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          ...(downloadFilename === undefined
            ? {}
            : {
                ResponseContentDisposition: `attachment; filename="${downloadFilename.replaceAll('"', "")}"`,
              }),
        }),
        { expiresIn: 5 * 60 },
      ),
    deleteObject: async (objectKey) => {
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey }),
      );
    },
  };
}
