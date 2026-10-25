import { Global, Module } from "@nestjs/common";
import { FileStorage } from "@shared/storage/fileStorage";
import {
  S3Bucket,
  s3BucketOf,
  S3FileStorage,
} from "@shared/storage/s3FileStorage";
import { storageConfig } from "@shared/storage/storage.config";

/** The bucket from the environment (S3_*), for every module's files. */
@Global()
@Module({
  providers: [
    { provide: S3Bucket, useFactory: () => s3BucketOf(storageConfig()) },
    { provide: FileStorage, useClass: S3FileStorage },
  ],
  exports: [FileStorage],
})
export class StorageModule {}
