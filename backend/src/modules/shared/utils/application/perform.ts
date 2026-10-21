import {
  loggerOnLeftR,
  loggerOnRightR,
} from "@shared/utils/application/handleLog";
import { FPF, O, Predicate, RTE, TE } from "@shared/utils/application/monads";
import { PinoLogger } from "nestjs-pino";

export const performRTE = <InputLike, OutputLike, ErrorLike extends Error>(
  action: (data: InputLike) => TE.TaskEither<ErrorLike, OutputLike>,
  actionDescription: string,
): (<U extends { logger: PinoLogger }>(
  data: InputLike,
) => RTE.ReaderTaskEither<U, ErrorLike, OutputLike>) =>
  FPF.flow(
    RTE.fromTaskEitherK(action),
    RTE.tapError(
      RTE.fromReaderK(loggerOnLeftR(`Failed to ${actionDescription}`)),
    ),
    RTE.tapReader(
      loggerOnRightR(`Successfully managed to ${actionDescription}`),
    ),
  );

/**
 * A lookup that must find something:
 * `findOrFailRTE(users.findById, "get user by id", userNotFoundException)(id)`.
 */
export const findOrFailRTE =
  <InputLike, OutputLike>(
    find: (data: InputLike) => TE.TaskEither<Error, O.Option<OutputLike>>,
    actionDescription: string,
    onNone: FPF.LazyArg<Error>,
  ) =>
  <U extends { logger: PinoLogger }>(
    data: InputLike,
  ): RTE.ReaderTaskEither<U, Error, OutputLike> =>
    FPF.pipe(
      performRTE(find, actionDescription)<U>(data),
      RTE.chainW(RTE.fromOption(onNone)),
    );

/**
 * A lookup that must find nothing, such as a uniqueness check. A found row
 * fails only if `conflicts` holds, so an update can skip its own row.
 */
export const ensureAbsentRTE =
  <InputLike, OutputLike>(
    find: (data: InputLike) => TE.TaskEither<Error, O.Option<OutputLike>>,
    actionDescription: string,
    onFound: FPF.LazyArg<Error>,
    conflicts: Predicate.Predicate<OutputLike> = FPF.constTrue,
  ) =>
  <U extends { logger: PinoLogger }>(
    data: InputLike,
  ): RTE.ReaderTaskEither<U, Error, void> =>
    FPF.pipe(
      performRTE(find, actionDescription)<U>(data),
      RTE.chain(
        FPF.flow(
          O.filter(conflicts),
          O.match(
            () => RTE.right(undefined),
            () => RTE.left(onFound()),
          ),
        ),
      ),
    );
