import { S3ServiceException } from "@aws-sdk/client-s3";
import { FileType } from "@shared/storage/fileType";
import { s3BucketOf, S3FileStorage } from "@shared/storage/s3FileStorage";
import { storageConfig } from "@shared/storage/storage.config";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { deleteBucket } from "@test/util/workerStorage";
import { randomUUID } from "node:crypto";

// Against the dev compose file's storage (S3_ENDPOINT), in a bucket of its
// own, removed first so the start creates it
describe("[Integration] S3FileStorage", () => {
  const config = { ...storageConfig(), bucket: `${storageConfig().bucket}-s3` };
  const bucket = s3BucketOf(config);
  const storage = new S3FileStorage(bucket);

  beforeAll(async () => {
    await deleteBucket(bucket.client, config.bucket);
    await storage.onModuleInit();
  });

  afterAll(() => {
    storage.onModuleDestroy();
  });

  it("Should keep a file and give it back with its type", async () => {
    const key = `spec/${randomUUID()}`;
    const body = Buffer.from("%PDF-1.4 notes");
    await executeTask(storage.put(key, body, FileType.Pdf));

    expect(await executeTask(storage.get(key))).toEqual(
      O.some({ body, contentType: FileType.Pdf }),
    );

    await executeTask(storage.remove(key));
    expect(await executeTask(storage.get(key))).toEqual(O.none);
    // Removing what isn't there succeeds
    await executeTask(storage.remove(key));
  });

  it("Should start on a bucket that already exists", async () => {
    await expect(storage.onModuleInit()).resolves.toBeUndefined();
  });

  it("Should fail when the storage refuses it", async () => {
    const refused = new S3FileStorage(
      s3BucketOf({ ...config, secretAccessKey: "wrong" }),
    );
    await expect(refused.onModuleInit()).rejects.toBeInstanceOf(
      S3ServiceException,
    );
    await expect(
      executeTask(refused.put("a", Buffer.from("x"), FileType.Pdf)),
    ).rejects.toBeInstanceOf(S3ServiceException);
    await expect(executeTask(refused.get("a"))).rejects.toBeInstanceOf(
      S3ServiceException,
    );
    refused.onModuleDestroy();
  });
});
