import { FileStorage } from "@shared/storage/fileStorage";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { PinoLogger } from "nestjs-pino";

/**
 * Removes a file stored for a row whose write then failed: the write's
 * error stands, whether or not the removal works.
 */
export const removeUnsavedRTE =
  (storage: FileStorage, key: string) =>
  <U extends { logger: PinoLogger }>(
    error: Error,
  ): RTE.ReaderTaskEither<U, Error, never> =>
    FPF.pipe(
      perform(storage).remove(key),
      RTE.matchE(
        () => RTE.left(error),
        () => RTE.left(error),
      ),
    );

/**
 * Removes a file nothing points to any more (none for a null key). Its row
 * has already changed, so a failure is only logged: the file is left
 * behind rather than the request failing.
 */
export const removeUnusedRTE = <U extends { logger: PinoLogger }>(
  storage: FileStorage,
  key: string | null,
): RTE.ReaderTaskEither<U, never, void> =>
  key === null
    ? RTE.right(undefined)
    : FPF.pipe(
        perform(storage).remove(key),
        RTE.orElseW(() => RTE.right(undefined)),
      );
