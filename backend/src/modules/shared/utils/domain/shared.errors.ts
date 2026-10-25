import { ErrorCode, ErrorDetails } from "@library/contracts";

/**
 * What went wrong, in domain terms. The API's exception filter picks the HTTP
 * status for each kind (`domainError.filter.ts`), so the domain never does.
 */
export enum DomainErrorKindEnum {
  NotFound = "notFound",
  Conflict = "conflict",
  // Input that breaks a business rule (a future date), beyond its shape
  Invalid = "invalid",
  Unauthorized = "unauthorized",
  // An action the user's rights don't allow (an area right in Compras). It
  // carries a code, which tells the frontend not to log out as it does on a
  // guard's 403
  Forbidden = "forbidden",
  Unknown = "unknown",
}

export type DomainErrorOptions<C extends ErrorCode = ErrorCode> =
  ErrorOptions & {
    /** What the client needs to act on the error, sent in the body: the
     * contracts' ErrorDetails of the code. */
    details?: ErrorDetails<C>;
  };

/**
 * A domain error: a kind, and a `code` (`user.emailTaken`, one of the
 * contracts' errorCodes) that the frontend translates; the message stays for
 * other clients.
 */
export class DomainError extends Error {
  // Typed by code where each error is declared (domainError)
  readonly details?: unknown;

  constructor(
    readonly kind: DomainErrorKindEnum,
    readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions & { details?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
    this.details = options?.details;
  }
}

/**
 * The base of one domain error, so each module's error is one class:
 *
 *   export class UserEmailAlreadyExistsException extends domainError(
 *     DomainErrorKindEnum.Conflict, "user.emailTaken", "O Email…",
 *   ) {}
 *
 * built with `new UserEmailAlreadyExistsException()`, or with `{ details }`.
 */
export const domainError = <C extends ErrorCode>(
  kind: DomainErrorKindEnum,
  code: C,
  message: string,
) =>
  class extends DomainError {
    // On the class too, for the routes' documentation (`@ApiErrors`)
    static readonly kind = kind;
    static readonly code = code;

    constructor(options?: DomainErrorOptions<C>) {
      super(kind, code, message, options);
    }
  };

// The original error is kept as the cause, which the logs show. Sent as the
// body, it would show clients the database's messages and constraint names
export class UnknownException extends DomainError {
  constructor(cause: unknown) {
    super(DomainErrorKindEnum.Unknown, "unknown", "Erro interno do servidor.", {
      cause,
    });
  }
}

export const unknownException = (error: unknown): UnknownException =>
  new UnknownException(error);
