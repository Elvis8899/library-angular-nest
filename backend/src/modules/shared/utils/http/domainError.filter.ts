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

const statuses: Record<DomainErrorKindEnum, HttpStatus> = {
  [DomainErrorKindEnum.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKindEnum.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKindEnum.Unauthorized]: HttpStatus.UNAUTHORIZED,
  [DomainErrorKindEnum.Unknown]: HttpStatus.INTERNAL_SERVER_ERROR,
};

const reasons: Record<DomainErrorKindEnum, string> = {
  [DomainErrorKindEnum.NotFound]: "Not Found",
  [DomainErrorKindEnum.Conflict]: "Conflict",
  [DomainErrorKindEnum.Unauthorized]: "Unauthorized",
  [DomainErrorKindEnum.Unknown]: "Internal Server Error",
};

/**
 * The response to a domain error: Nest's usual body plus the error's `code`,
 * which the frontend translates.
 */
export const toHttpException = (error: DomainError): HttpException => {
  const status = statuses[error.kind];
  return new HttpException(
    {
      statusCode: status,
      error: reasons[error.kind],
      message: error.message,
      code: error.code,
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
