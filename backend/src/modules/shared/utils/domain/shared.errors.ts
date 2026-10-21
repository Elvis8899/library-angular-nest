/**
 * What went wrong, in domain terms. The API's exception filter picks the HTTP
 * status for each kind (`domainError.filter.ts`), so the domain never does.
 */
export enum DomainErrorKindEnum {
  NotFound = "notFound",
  Conflict = "conflict",
  Unauthorized = "unauthorized",
  Unknown = "unknown",
}

/**
 * A domain error: a kind, and a `code` (`user.cpfTaken`) that the frontend
 * translates; the message stays for other clients.
 */
export class DomainError extends Error {
  constructor(
    readonly kind: DomainErrorKindEnum,
    readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

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
