import { NotFoundException } from "@nestjs/common";

export class BookInfoNotFoundException extends NotFoundException {
  constructor() {
    super("Livro não encontrado.");
  }
}

export const bookInfoNotFoundException = () => new BookInfoNotFoundException();

export class AvailableBookItemNotFoundException extends NotFoundException {
  constructor() {
    super("Exemplar livre do livro não encontrado.");
  }
}

export const availableBookItemNotFoundException = () =>
  new AvailableBookItemNotFoundException();
