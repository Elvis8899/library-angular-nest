import { Prisma } from "@db/generated/client";
import { PrismaService } from "@shared/prisma/prisma.service";
import { TE } from "@shared/utils/application/monads";
import {
  DomainError,
  unknownException,
} from "@shared/utils/domain/shared.errors";

// Domain errors thrown inside a transaction are passed through as-is
const transactionErrorException = (error: unknown): Error =>
  error instanceof DomainError ? error : unknownException(error);

/**
 * Runs writes in one transaction. A domain error the writes throw (a
 * conditional write's `*.changed`) rolls it back and is the task's error;
 * anything else is a 500.
 */
export const transactionTask = <T>(
  prisma: PrismaService,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): TE.TaskEither<Error, T> =>
  TE.tryCatch(() => prisma.$transaction(write), transactionErrorException);

/**
 * A conditional write (`updateMany` where the row still holds what was
 * read) that matched nothing: the row changed meanwhile, so the transaction
 * stops with `changed`.
 */
export const ensureWritten = (
  { count }: { count: number },
  changed: () => Error,
): void => {
  if (count === 0) throw changed();
};
