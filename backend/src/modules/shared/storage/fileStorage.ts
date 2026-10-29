import { O, TE } from "@shared/utils/application/monads";

/** A stored file's content. */
export interface StoredFile {
  body: Buffer;
  contentType: string;
}

/**
 * Object storage for the files users upload (the books' covers): an
 * S3-compatible bucket in the app (S3FileStorage), memory
 * in the unit tests (FakeFileStorage). The caller picks the keys, and
 * checks who may read a file before getting it: the bucket is private.
 */
export abstract class FileStorage {
  put!: (
    key: string,
    body: Buffer,
    contentType: string,
  ) => TE.TaskEither<Error, void>;
  get!: (key: string) => TE.TaskEither<Error, O.Option<StoredFile>>;
  /** Removing a missing key succeeds. */
  remove!: (key: string) => TE.TaskEither<Error, void>;
}
