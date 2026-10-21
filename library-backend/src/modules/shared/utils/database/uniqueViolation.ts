import { FPF, O } from "@shared/utils/application/monads";
import { z } from "zod";

// A Prisma error for a write that broke a unique constraint, as the pg
// adapter reports it: the index name is the reliable part
const UniqueViolation = z.object({
  code: z.literal("P2002"),
  meta: z.object({
    driverAdapterError: z.object({
      cause: z.object({ constraint: z.object({ index: z.string() }) }),
    }),
  }),
});

/** The unique index a failed Prisma write broke, if that's why it failed.
 * Reads the cause unknownException keeps. */
export const violatedUniqueIndex = (error: Error): O.Option<string> => {
  const violation = UniqueViolation.safeParse(error.cause);
  return violation.success
    ? O.some(violation.data.meta.driverAdapterError.cause.constraint.index)
    : O.none;
};

/**
 * Replaces the 500 for a broken unique index with its domain error, e.g.
 * `{ User_email_key: userEmailAlreadyExistsException }`. Commands check
 * uniqueness first; this answers a write that raced another past the check.
 */
export const mapUniqueViolations =
  (conflicts: Partial<Record<string, () => Error>>) =>
  (error: Error): Error =>
    FPF.pipe(
      violatedUniqueIndex(error),
      O.chain((index) => O.fromNullable(conflicts[index])),
      O.match(
        () => error,
        (conflict) => conflict(),
      ),
    );
