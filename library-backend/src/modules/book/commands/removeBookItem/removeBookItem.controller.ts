import { RemoveBookItem } from "@book/commands/removeBookItem/removeBookItem.command";
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";

@Controller("v1/")
@ApiTags("Livros")
export class RemoveBookItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("bookInfos/item/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove um exemplar de um Livro",
    description: `Dado um Livro válido, ele terá um exemplar removido.`,
  })
  @ApiCreatedResponse({
    description: "Exemplar do Livro removido com sucesso.",
  })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  async removeBookItem(@Param("id") bookInfoId: string): Promise<void> {
    return this.commandBus
      .execute<RemoveBookItem>(new RemoveBookItem(bookInfoId))
      .then(noop);
  }
}
