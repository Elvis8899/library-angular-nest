import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import {
  DomainError,
  DomainErrorKindEnum,
} from "@shared/utils/domain/shared.errors";

/** The HTTP status of each kind of domain error. */
export const domainErrorStatuses: Record<DomainErrorKindEnum, HttpStatus> = {
  [DomainErrorKindEnum.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKindEnum.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKindEnum.Invalid]: HttpStatus.UNPROCESSABLE_ENTITY,
  [DomainErrorKindEnum.Unauthorized]: HttpStatus.UNAUTHORIZED,
  [DomainErrorKindEnum.Forbidden]: HttpStatus.FORBIDDEN,
  [DomainErrorKindEnum.Unknown]: HttpStatus.INTERNAL_SERVER_ERROR,
};

const reasons: Record<DomainErrorKindEnum, string> = {
  [DomainErrorKindEnum.NotFound]: "Not Found",
  [DomainErrorKindEnum.Conflict]: "Conflict",
  [DomainErrorKindEnum.Invalid]: "Unprocessable Entity",
  [DomainErrorKindEnum.Unauthorized]: "Unauthorized",
  [DomainErrorKindEnum.Forbidden]: "Forbidden",
  [DomainErrorKindEnum.Unknown]: "Internal Server Error",
};

/**
 * The response to a domain error: Nest's usual body plus the error's `code`,
 * which the frontend translates, and its `details` when it has some.
 */
export const toHttpException = (error: DomainError): HttpException => {
  const status = domainErrorStatuses[error.kind];
  return new HttpException(
    {
      statusCode: status,
      error: reasons[error.kind],
      message: error.message,
      code: error.code,
      ...(error.details !== undefined && { details: error.details }),
    },
    status,
    { cause: error },
  );
};

/** Answers domain errors with their status; other errors go to Nest's own. */
@Catch(DomainError)
export class DomainErrorFilter extends BaseExceptionFilter {
  override catch(error: DomainError, host: ArgumentsHost): void {
    super.catch(toHttpException(error), host);
  }
}
