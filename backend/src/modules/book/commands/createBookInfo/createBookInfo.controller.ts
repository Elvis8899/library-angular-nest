import {
  BookInfoRequest,
  contractRef,
  Created,
  Sent,
} from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { CreateBookInfo } from "@modules/book/commands/createBookInfo/createBookInfo.command";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Body, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";

@ApiController("Livros")
export class CreateBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("bookInfos")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Cria um Livro.",
    description: `Dado um Livro válido, ele será criado.`,
  })
  @ApiCreatedResponse({
    description: "Livro criado com sucesso.",
    schema: contractRef(Created),
  })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiBody({ schema: contractRef(BookInfoRequest) })
  async createBookInfo(
    @Body() book: BookInfoRequest,
  ): Promise<Sent<typeof Created>> {
    return this.commandBus.execute<CreateBookInfo, Sent<typeof Created>>(
      new CreateBookInfo(book),
    );
  }
}
