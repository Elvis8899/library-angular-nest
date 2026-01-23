import { NotFoundException } from "@nestjs/common";

export class BookInfoNotFoundException extends NotFoundException {
  constructor() {
    super("Usuário não encontrado.");
  }
}

export const bookInfoNotFoundException = () => new BookInfoNotFoundException();
