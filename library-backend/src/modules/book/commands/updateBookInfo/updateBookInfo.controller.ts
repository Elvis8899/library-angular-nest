import { UpdateBookInfo } from "@book/commands/updateBookInfo/updateBookInfo.command";
import { CreateBookInfoDto } from "@book/dtos/bookInfo.dto";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
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
export class UpdateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Put("bookInfos/:id")
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: "Livro atualizado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiNotFoundResponse({ description: "Livro não encontrado." })
  @ApiOperation({ summary: "Atualizar Livro" })
  async updateBookInfo(
    @Body() updateModuleDto: CreateBookInfoDto,
    @Param("id") id: string,
  ): Promise<void> {
    return this.commandBus
      .execute(new UpdateBookInfo(updateModuleDto, id))
      .then(noop);
  }
}
