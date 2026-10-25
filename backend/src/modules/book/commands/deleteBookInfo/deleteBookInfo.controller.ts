import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { DeleteBookInfo } from "@modules/book/commands/deleteBookInfo/deleteBookInfo.command";
import { BookInfoNotFoundException } from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Delete, HttpCode, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiDefaultResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class DeleteBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("bookInfos/:id")
  @ApiErrors(BookInfoNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  @ApiDefaultResponse({ description: "Livro excluído com sucesso." })
  @ApiOperation({ summary: "Deletar Livro" })
  async deleteBookInfo(@Param("id") bookInfoId: string): Promise<void> {
    return this.commandBus
      .execute<DeleteBookInfo>(new DeleteBookInfo(bookInfoId))
      .then(noop);
  }
}
