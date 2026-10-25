import {
  DomainErrorKindEnum,
  domainError,
} from "@shared/utils/domain/shared.errors";

export class BookRentalNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "rental.notFound",
  "Empréstimo não encontrado.",
) {}

export const bookRentalNotFoundException = () =>
  new BookRentalNotFoundException();

export class BookRentalFinishedException extends domainError(
  DomainErrorKindEnum.Conflict,
  "rental.finished",
  "Empréstimo finalizado.",
) {}

export const bookRentalFinishedException = () =>
  new BookRentalFinishedException();

export class BookRentalNotAvailableException extends domainError(
  DomainErrorKindEnum.Conflict,
  "rental.unavailable",
  "Livro indisponível.",
) {}

export const bookRentalNotAvailableException = () =>
  new BookRentalNotAvailableException();
