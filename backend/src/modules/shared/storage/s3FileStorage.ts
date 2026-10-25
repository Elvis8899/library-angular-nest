import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { FileStorage, StoredFile } from "@shared/storage/fileStorage";
import { StorageConfig } from "@shared/storage/storage.config";
import { E, O, TE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";

/** The client and the bucket S3FileStorage works with. */
export class S3Bucket {
  constructor(
    readonly client: S3Client,
    readonly name: string,
  ) {}
}

export const s3BucketOf = (config: StorageConfig): S3Bucket =>
  new S3Bucket(
    new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    config.bucket,
  );

const octetStream = "application/octet-stream";

@Injectable()
export class S3FileStorage
  implements FileStorage, OnModuleInit, OnModuleDestroy
{
  constructor(private readonly bucket: S3Bucket) {}

  /** Creates the bucket when it's missing, as in a new environment; fails
   * the start when the storage can't be reached. */
  async onModuleInit(): Promise<void> {
    const { client, name } = this.bucket;
    await client
      .send(new HeadBucketCommand({ Bucket: name }))
      .catch(async (error: unknown) => {
        if (!(error instanceof NotFound)) throw error;
        await client.send(new CreateBucketCommand({ Bucket: name }));
      });
  }

  onModuleDestroy(): void {
    this.bucket.client.destroy();
  }

  put = (
    key: string,
    body: Buffer,
    contentType: string,
  ): TE.TaskEither<Error, void> =>
    TE.tryCatch(
      () =>
        this.bucket.client
          .send(
            new PutObjectCommand({
              Bucket: this.bucket.name,
              Key: key,
              Body: body,
              ContentType: contentType,
            }),
          )
          .then(noop),
      E.toError,
    );

  get = (key: string): TE.TaskEither<Error, O.Option<StoredFile>> =>
    TE.tryCatch(async () => {
      try {
        const { Body, ContentType } = await this.bucket.client.send(
          new GetObjectCommand({ Bucket: this.bucket.name, Key: key }),
        );
        if (Body === undefined) return O.none;
        return O.some({
          body: Buffer.from(await Body.transformToByteArray()),
          contentType: ContentType ?? octetStream,
        });
      } catch (error) {
        if (error instanceof NoSuchKey) return O.none;
        throw error;
      }
    }, E.toError);

  remove = (key: string): TE.TaskEither<Error, void> =>
    TE.tryCatch(
      () =>
        this.bucket.client
          .send(new DeleteObjectCommand({ Bucket: this.bucket.name, Key: key }))
          .then(noop),
      E.toError,
    );
}
