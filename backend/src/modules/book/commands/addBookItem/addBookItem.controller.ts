import { BookItemRequest, contractRef } from "@library/contracts";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { AddBookItem } from "@modules/book/commands/addBookItem/addBookItem.command";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Body, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class AddBookItemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post("bookInfos/item")
  @ApiErrors(BookInfoNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Adiciona um exemplar de um Livro",
    description: `Dado um Livro válido, ele terá um exemplar adicionado.`,
  })
  @ApiCreatedResponse({ description: "Exemplar do Livro criado com sucesso." })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  @ApiBody({ schema: contractRef(BookItemRequest) })
  async addBookItem(@Body() bookItem: BookItemRequest): Promise<void> {
    return this.commandBus.execute(new AddBookItem(bookItem));
  }
}
