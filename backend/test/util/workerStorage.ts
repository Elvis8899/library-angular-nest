import {
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  NoSuchBucket,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * The bucket of one Vitest worker in one run: library-test-<run>-1… for
 * library-test (S3_BUCKET), so workers never share files. The app creates
 * it when it starts; test/globalSetup.ts deletes the run's buckets after.
 */
export const workerBucket = (
  bucket: string,
  run: string,
  workerId: string | number,
) => `${bucket}-${run}-${String(workerId)}`;

/** Deletes every file in the bucket; a missing bucket is already empty. */
export const emptyBucket = async (
  client: S3Client,
  bucket: string,
): Promise<void> => {
  const listed = await client
    .send(new ListObjectsV2Command({ Bucket: bucket }))
    .catch((error: unknown) => {
      if (error instanceof NoSuchBucket) return undefined;
      throw error;
    });
  const keys = (listed?.Contents ?? []).flatMap(({ Key }) =>
    Key === undefined ? [] : [{ Key }],
  );
  if (keys.length > 0)
    await client.send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }),
    );
  if (listed?.IsTruncated) await emptyBucket(client, bucket);
};

/** Deletes the bucket and its files; a missing bucket is already gone. */
export const deleteBucket = async (
  client: S3Client,
  bucket: string,
): Promise<void> => {
  await emptyBucket(client, bucket);
  await client
    .send(new DeleteBucketCommand({ Bucket: bucket }))
    .catch((error: unknown) => {
      if (!(error instanceof NoSuchBucket)) throw error;
    });
};
