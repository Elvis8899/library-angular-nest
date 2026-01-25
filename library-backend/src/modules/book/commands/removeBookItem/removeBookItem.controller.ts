import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";
import { RemoveBookItem } from "./removeBookItem.command";

@Controller("v1/")
@ApiTags("Livros")
export class RemoveBookItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("bookInfos/:id/item")
  @HttpCode(HttpStatus.CREATED)
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
