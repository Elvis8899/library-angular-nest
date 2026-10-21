import {
  DomainError,
  DomainErrorKindEnum,
} from "@shared/utils/domain/shared.errors";

export class BookInfoNotFoundException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.NotFound,
      "book.notFound",
      "Livro não encontrado.",
    );
  }
}

export const bookInfoNotFoundException = () => new BookInfoNotFoundException();

export class AvailableBookItemNotFoundException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.NotFound,
      "book.noAvailableCopy",
      "Exemplar livre do livro não encontrado.",
    );
  }
}

export const availableBookItemNotFoundException = () =>
  new AvailableBookItemNotFoundException();
