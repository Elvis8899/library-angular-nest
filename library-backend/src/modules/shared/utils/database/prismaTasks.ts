import { FPF, TE } from "@shared/utils/application/monads";
import { unknownException } from "@shared/utils/domain/shared.errors";

type Query = (...args: unknown[]) => Promise<unknown>;
type AsyncMethod = (...args: never[]) => Promise<unknown>;

/** A Prisma delegate's query methods, each returning a TaskEither. */
export type PrismaTasks<Delegate> = {
  [
    Method in keyof Delegate as Delegate[Method] extends AsyncMethod
      ? Method
      : never
  ]: Delegate[Method] extends (...args: infer Args) => Promise<infer Result>
    ? (...args: Args) => TE.TaskEither<Error, Result>
    : never;
};

/**
 * Wraps a Prisma delegate's methods as TaskEithers; a rejection becomes a
 * 500: `private users = prismaTasks(() => this.prisma.user)`, then
 * `this.users.findMany({ where })`. The getter reads the client only when a
 * method is used. Results get Prisma's default payload type, whatever the
 * `include` or `select`; rows are validated with Zod anyway.
 */
export const prismaTasks = <Delegate extends object>(
  delegate: () => Delegate,
): PrismaTasks<Delegate> => {
  // Empty: the proxy answers every property
  const target: PrismaTasks<Delegate> = FPF.unsafeCoerce({});
  return new Proxy(target, {
    // Only the delegate's methods: `then` or Node's inspection symbols stay
    // undefined, so the object never looks like a promise
    get: (_, method) => {
      const methods: Partial<Record<PropertyKey, unknown>> =
        FPF.unsafeCoerce(delegate());
      const query = methods[method];
      if (typeof query !== "function") return undefined;
      // A function the delegate calls with its arguments
      const run: Query = FPF.unsafeCoerce(query);
      return (...args: unknown[]) =>
        TE.tryCatch(() => run.apply(methods, args), unknownException);
    },
  });
};
