import { NotFoundException, ConflictException } from "@nestjs/common";

export class BookRentalNotFoundException extends NotFoundException {
  constructor() {
    super("Empréstimo não encontrado.");
  }
}

export const bookRentalNotFoundException = () =>
  new BookRentalNotFoundException();

export class BookRentalFinishedException extends NotFoundException {
  constructor() {
    super("Empréstimo finalizado.");
  }
}

export const bookRentalFinishedException = () =>
  new BookRentalFinishedException();

export class BookRentalNotAvailableException extends ConflictException {
  constructor() {
    super("Livro indisponível.");
  }
}

export const bookRentalNotAvailableException = () =>
  new BookRentalNotAvailableException();
