import {
  loggerOnLeftR,
  loggerOnRightR,
} from "@shared/utils/application/handleLog";
import {
  Apply,
  FPF,
  O,
  Predicate,
  RTE,
  TE,
} from "@shared/utils/application/monads";
import { PinoLogger } from "nestjs-pino";

type Env = { logger: PinoLogger };

/** A port's method as a pipeline step: the same arguments, an RTE. */
export type Step<F> = F extends (
  ...args: infer A
) => TE.TaskEither<infer E, infer B>
  ? <U extends Env>(...args: A) => RTE.ReaderTaskEither<U, E, B>
  : never;

/** The methods of a port (a repository, the file storage…) that answer a
 * TaskEither, as steps. */
export type Steps<P> = {
  readonly [
    K in keyof P as P[K] extends (
      ...args: never[]
    ) => TE.TaskEither<Error, unknown>
      ? K
      : never
  ]: Step<P[K]>;
};

// A port's name in the logs: its class's, without the Real or Fake an
// adapter adds (RealWorkerRepository logs as WorkerRepository)
const portName = (port: object): string =>
  port.constructor.name.replace(/^(Real|Fake)/, "");

/**
 * A port's methods as pipeline steps, each logged under its name
 * (`WorkerRepository.findById failed`, or a summary of its value at debug
 * level, `summaryOf`):
 * `perform(this.workerRepository).findById(id)`.
 */
export const perform = <P extends object>(port: P): Steps<P> =>
  FPF.unsafeCoerce<P, Steps<P>>(
    new Proxy(port, {
      get: (target, key) => {
        const name = `${portName(target)}.${String(key)}`;
        const method = FPF.unsafeCoerce<
          unknown,
          (...args: unknown[]) => TE.TaskEither<Error, unknown>
        >(Reflect.get(target, key));
        return (...args: unknown[]) =>
          FPF.pipe(
            RTE.fromTaskEither<Error, unknown, Env>(method.apply(target, args)),
            RTE.tapError(RTE.fromReaderK(loggerOnLeftR(`${name} failed`))),
            RTE.tapReader(loggerOnRightR(`${name} succeeded`)),
          );
      },
    }),
  );

/**
 * A lookup that must find something:
 * `orFail(perform(users).findById(id), userNotFoundException)`.
 */
export const orFail = <U, E, A>(
  found: RTE.ReaderTaskEither<U, E, O.Option<A>>,
  onNone: FPF.LazyArg<Error>,
): RTE.ReaderTaskEither<U, E | Error, A> =>
  FPF.pipe(found, RTE.chainW(RTE.fromOption(onNone)));

/**
 * A lookup that must find nothing, such as a uniqueness check. A found row
 * fails only if `conflicts` holds, so an update can skip its own row:
 * `orConflict(perform(users).findByEmail(email), emailTaken)`.
 */
export const orConflict = <U, E, A>(
  found: RTE.ReaderTaskEither<U, E, O.Option<A>>,
  onFound: FPF.LazyArg<Error>,
  conflicts: Predicate.Predicate<A> = FPF.constTrue,
): RTE.ReaderTaskEither<U, E | Error, void> =>
  FPF.pipe(
    found,
    RTE.chainW(
      FPF.flow(
        O.filter(conflicts),
        O.match(
          () => RTE.right(undefined),
          () => RTE.left(onFound()),
        ),
      ),
    ),
  );

/**
 * Lookups run at once, their values by name; the first to fail is the error:
 * `allRTE({ stock: perform(repo).findStock(id), lines: … })`.
 */
export const allRTE = Apply.sequenceS(RTE.ApplyPar);

type Lookups = Readonly<
  Record<string, RTE.ReaderTaskEither<never, Error, unknown>>
>;
type ValueOf<T> =
  T extends RTE.ReaderTaskEither<never, unknown, infer A> ? A : never;
type ErrorOf<T> =
  T extends RTE.ReaderTaskEither<never, infer E, unknown> ? E : never;
// What a lookup needs from the environment; a port's step, generic in it,
// needs nothing more than the pipeline already has
type NeedsOf<T> =
  T extends RTE.ReaderTaskEither<infer R, unknown, unknown>
    ? [R] extends [never]
      ? unknown
      : R
    : never;
// What every lookup needs: their needs' intersection
type EnvOf<T extends Lookups> = {
  [K in keyof T]: (env: NeedsOf<T[K]>) => void;
}[keyof T] extends (env: infer R) => void
  ? R
  : never;

/**
 * Lookups that don't need each other, run at once and bound by name as
 * `RTE.bind` binds one, never over a name the scope has; the first to fail
 * is the error:
 * `bindAll(({ id }) => ({ item: findItemRTE(repo)(id), editor: … }))`.
 */
export const bindAll =
  <S extends object, R, E, T extends Lookups>(lookups: (scope: S) => T) =>
  (
    scope: RTE.ReaderTaskEither<R, E, S>,
  ): [Extract<keyof S, keyof T>] extends [never]
    ? RTE.ReaderTaskEither<
        R & EnvOf<T>,
        E | ErrorOf<T[keyof T]>,
        {
          readonly [K in keyof S | keyof T]: K extends keyof T
            ? ValueOf<T[K]>
            : K extends keyof S
              ? S[K]
              : never;
        }
      >
    : `bindAll would rebind ${Extract<keyof S, keyof T> & string}` =>
    FPF.unsafeCoerce(
      FPF.pipe(
        scope,
        RTE.chainW((bound) =>
          FPF.pipe(
            allRTE(
              FPF.unsafeCoerce<
                T,
                Record<"lookup", RTE.ReaderTaskEither<R, E, unknown>>
              >(lookups(bound)),
            ),
            RTE.map((found) => ({ ...bound, ...found })),
          ),
        ),
      ),
    );
