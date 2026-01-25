import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { BookRentalDto } from "../../dtos/bookRental.dto";
import { RentBookCommand } from "./rentBook.command";

@Controller("v1/bookRentals")
@ApiTags("Empréstimos")
export class RentBookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("rent")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Fazer empréstimo de Livro.",
    description: `Dado um Livro válido, ele será emprestado.`,
  })
  @ApiCreatedResponse({ description: "Empréstimo criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiConflictResponse({ description: "Livro já está emprestado." })
  async createBookInfo(@Body() bookRentalInput: BookRentalDto): Promise<void> {
    return this.commandBus
      .execute<RentBookCommand>(new RentBookCommand(bookRentalInput))
      .then(noop);
  }
}
