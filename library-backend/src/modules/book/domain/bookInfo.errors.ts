import { HttpStatus, NotFoundException } from "@nestjs/common";
import { errorBody } from "@shared/utils/domain/shared.erros";

export class BookInfoNotFoundException extends NotFoundException {
  constructor() {
    super(
      errorBody(HttpStatus.NOT_FOUND, "book.notFound", "Livro não encontrado."),
    );
  }
}

export const bookInfoNotFoundException = () => new BookInfoNotFoundException();

export class AvailableBookItemNotFoundException extends NotFoundException {
  constructor() {
    super(
      errorBody(
        HttpStatus.NOT_FOUND,
        "book.noAvailableCopy",
        "Exemplar livre do livro não encontrado.",
      ),
    );
  }
}

export const availableBookItemNotFoundException = () =>
  new AvailableBookItemNotFoundException();
