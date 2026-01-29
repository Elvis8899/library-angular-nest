import { DeleteBookInfo } from "@book/commands/deleteBookInfo/deleteBookInfo.command";
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiDefaultResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/noop";

@Controller("v1/")
@ApiTags("Livros")
export class DeleteBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("bookInfos/:id")
  @HttpCode(HttpStatus.OK)
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Livro excluído com sucesso." })
  @ApiOperation({ summary: "Deletar Livro" })
  async deleteBookInfo(@Param("id") bookInfoId: string): Promise<void> {
    return this.commandBus
      .execute<DeleteBookInfo>(new DeleteBookInfo(bookInfoId))
      .then(noop);
  }
}
