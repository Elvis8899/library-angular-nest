import { Controller, HttpCode, HttpStatus, Param, Put } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { ReturnBookCommand } from "./returnBook.command";

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
  async updateBookInfo(@Param("id") id: string): Promise<void> {
    return this.commandBus.execute(new ReturnBookCommand(id)).then(noop);
  }
}
