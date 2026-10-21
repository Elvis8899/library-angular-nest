import {
  DomainError,
  DomainErrorKindEnum,
} from "@shared/utils/domain/shared.errors";

export class BookRentalNotFoundException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.NotFound,
      "rental.notFound",
      "Empréstimo não encontrado.",
    );
  }
}

export const bookRentalNotFoundException = () =>
  new BookRentalNotFoundException();

export class BookRentalFinishedException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Conflict,
      "rental.finished",
      "Empréstimo finalizado.",
    );
  }
}

export const bookRentalFinishedException = () =>
  new BookRentalFinishedException();

export class BookRentalNotAvailableException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Conflict,
      "rental.unavailable",
      "Livro indisponível.",
    );
  }
}

export const bookRentalNotAvailableException = () =>
  new BookRentalNotAvailableException();
