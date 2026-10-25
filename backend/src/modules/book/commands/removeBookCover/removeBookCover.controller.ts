import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { RemoveBookCover } from "@modules/book/commands/removeBookCover/removeBookCover.command";
import {
  BookCoverChangedException,
  BookCoverNotFoundException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Delete, Param, UseGuards } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class RemoveBookCoverController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete("bookInfos/:id/cover")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({ summary: "Tirar a capa de um Livro" })
  @ApiOkResponse({ description: "Capa removida." })
  @ApiForbiddenResponse({ description: "Só o administrador." })
  @ApiErrors(BookInfoNotFoundException, BookCoverNotFoundException, [
    BookCoverChangedException,
    "outra capa chegou antes",
  ])
  @ApiUnprocessableEntityResponse({ description: "Id inválido." })
  async removeBookCover(@Param("id") id: string): Promise<void> {
    return this.commandBus
      .execute<RemoveBookCover>(new RemoveBookCover(id))
      .then(noop);
  }
}
