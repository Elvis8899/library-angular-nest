import { Controller, HttpCode, HttpStatus, Param, Put } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ReturnBookCommand } from "@rental/commands/returnBook/returnBook.command";
import { noop } from "@shared/utils/noop";

@Controller("v1/bookRentals")
@ApiTags("Empréstimos")
export class ReturnBookController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("return/:id")
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Empréstimo finalizado com sucesso." })
  @ApiNotFoundResponse({ description: "Empréstimo não encontrado." })
  @ApiOperation({ summary: "Retornar Livro" })
  async updateBookInfo(@Param("id") bookRentalId: string): Promise<void> {
    return this.commandBus
      .execute(new ReturnBookCommand(bookRentalId))
      .then(noop);
  }
}
