import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { RemoveBookItem } from "@modules/book/commands/removeBookItem/removeBookItem.command";
import {
  AvailableBookItemNotFoundException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Delete, HttpCode, HttpStatus, Param, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { CommandBus } from "@shared/utils/application/cqrs";
import { ApiErrors } from "@shared/utils/http/apiErrors";

@ApiController("Livros")
export class RemoveBookItemController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete("bookInfos/item/:id")
  @ApiErrors(BookInfoNotFoundException, AvailableBookItemNotFoundException)
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove um exemplar de um Livro",
    description: `Dado um Livro válido, ele terá um exemplar removido.`,
  })
  @ApiCreatedResponse({
    description: "Exemplar do Livro removido com sucesso.",
  })
  @ApiUnprocessableEntityResponse({ description: "Livro inválido." })
  async removeBookItem(@Param("id") bookInfoId: string): Promise<void> {
    return this.commandBus.execute(new RemoveBookItem(bookInfoId));
  }
}
