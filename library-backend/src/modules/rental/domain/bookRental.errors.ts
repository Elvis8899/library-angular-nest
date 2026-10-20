import {
  ConflictException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { errorBody } from "@shared/utils/domain/shared.erros";

export class BookRentalNotFoundException extends NotFoundException {
  constructor() {
    super(
      errorBody(
        HttpStatus.NOT_FOUND,
        "rental.notFound",
        "Empréstimo não encontrado.",
      ),
    );
  }
}

export const bookRentalNotFoundException = () =>
  new BookRentalNotFoundException();

export class BookRentalFinishedException extends NotFoundException {
  constructor() {
    super(
      errorBody(
        HttpStatus.NOT_FOUND,
        "rental.finished",
        "Empréstimo finalizado.",
      ),
    );
  }
}

export const bookRentalFinishedException = () =>
  new BookRentalFinishedException();

export class BookRentalNotAvailableException extends ConflictException {
  constructor() {
    super(
      errorBody(
        HttpStatus.CONFLICT,
        "rental.unavailable",
        "Livro indisponível.",
      ),
    );
  }
}

export const bookRentalNotAvailableException = () =>
  new BookRentalNotAvailableException();
