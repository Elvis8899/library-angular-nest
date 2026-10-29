import { UserRepository } from "@modules/user/database/user.repository.port";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { PinoLogger } from "nestjs-pino";

/**
 * The names of the users some rows name (who changed what, in the audit):
 * each id looked up once, and null ids (no account) skipped.
 */
export const userNamesRTE =
  (users: UserRepository) =>
  <U extends { logger: PinoLogger }>(
    ids: Iterable<string | null>,
  ): RTE.ReaderTaskEither<U, Error, ReadonlyMap<string, string>> =>
    FPF.pipe(
      perform(users).findByIds<U>(
        [...new Set(ids)].filter((id): id is string => id !== null),
      ),
      RTE.map((found) => new Map(found.map(({ id, name }) => [id, name]))),
    );
