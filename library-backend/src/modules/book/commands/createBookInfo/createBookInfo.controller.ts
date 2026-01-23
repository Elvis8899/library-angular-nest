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
import { CreateBookInfoDto } from "../../dtos/bookInfo.dto";
import { CreateBookInfo } from "./createBookInfo.command";

@Controller("v1/")
@ApiTags("Livros")
export class CreateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("bookInfos")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Cria um Livro.",
    description: `Dado um Livro válido, ele será criado.`,
  })
  @ApiCreatedResponse({ description: "Livro criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiConflictResponse({ description: "Livro já existe." })
  async createBookInfo(
    @Body() createBookInfoDto: CreateBookInfoDto,
  ): Promise<void> {
    return this.commandBus
      .execute<CreateBookInfo>(new CreateBookInfo(createBookInfoDto))
      .then(noop);
  }
}
