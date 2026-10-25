import {
  DomainErrorKindEnum,
  domainError,
} from "@shared/utils/domain/shared.errors";

export class BookInfoNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "book.notFound",
  "Livro não encontrado.",
) {}

export const bookInfoNotFoundException = () => new BookInfoNotFoundException();

export class BookItemNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "book.copyNotFound",
  "Exemplar não encontrado.",
) {}

export const bookItemNotFoundException = () => new BookItemNotFoundException();

export class AvailableBookItemNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "book.noAvailableCopy",
  "Exemplar livre do livro não encontrado.",
) {}

export const availableBookItemNotFoundException = () =>
  new AvailableBookItemNotFoundException();

export class BookCoverNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "book.coverNotFound",
  "Livro sem capa.",
) {}

export const bookCoverNotFoundException = () =>
  new BookCoverNotFoundException();

export class BookCoverTypeException extends domainError(
  DomainErrorKindEnum.Invalid,
  "book.coverType",
  "A capa deve ser uma imagem JPG, PNG, WEBP ou GIF.",
) {}

export const bookCoverTypeException = () => new BookCoverTypeException();

export class BookCoverTooLargeException extends domainError(
  DomainErrorKindEnum.Invalid,
  "book.coverTooLarge",
  "A capa deve ter até 5 MB.",
) {}

export const bookCoverTooLargeException = () =>
  new BookCoverTooLargeException();

export class BookCoverChangedException extends domainError(
  DomainErrorKindEnum.Conflict,
  "book.coverChanged",
  "A capa do livro mudou enquanto esta era enviada; recarregue e tente de novo.",
) {}

export const bookCoverChangedException = () => new BookCoverChangedException();
