import { Injectable } from "@nestjs/common";
import { FileStorage, StoredFile } from "@shared/storage/fileStorage";
import { O, TE } from "@shared/utils/application/monads";

/** Files kept in memory, by key, for the unit tests. */
@Injectable()
export class FakeFileStorage implements FileStorage {
  /** What's stored, for specs to inspect. */
  readonly files = new Map<string, StoredFile>();

  put = (
    key: string,
    body: Buffer,
    contentType: string,
  ): TE.TaskEither<Error, void> => {
    this.files.set(key, { body, contentType });
    return TE.right(undefined);
  };

  get = (key: string): TE.TaskEither<Error, O.Option<StoredFile>> =>
    TE.right(O.fromNullable(this.files.get(key)));

  remove = (key: string): TE.TaskEither<Error, void> => {
    this.files.delete(key);
    return TE.right(undefined);
  };
}
