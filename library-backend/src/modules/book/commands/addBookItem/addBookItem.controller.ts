import { AddBookItem } from "@book/commands/addBookItem/addBookItem.command";
import { CreateBookItemDto } from "@book/dtos/bookInfo.dto";
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";

@Controller("v1/")
@ApiTags("Livros")
export class AddBookItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("bookInfos/item")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Adiciona um exemplar de um Livro",
    description: `Dado um Livro válido, ele terá um exemplar adicionado.`,
  })
  @ApiCreatedResponse({ description: "Exemplar do Livro criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  async addBookItem(
    @Body() createBookInfoDto: CreateBookItemDto,
  ): Promise<void> {
    return this.commandBus
      .execute<AddBookItem>(new AddBookItem(createBookInfoDto))
      .then(noop);
  }
}
