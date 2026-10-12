import { Roles } from "@auth/decorators/roles.decorator";
import { AuthGuard } from "@auth/guards/auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import { DeleteBookInfo } from "@book/commands/deleteBookInfo/deleteBookInfo.command";
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiDefaultResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { noop } from "@shared/utils/application/noop";
import { UserRoleEnum } from "@user/domain/user.entity";

@Controller("v1/")
@ApiTags("Livros")
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class DeleteBookInfoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Delete("bookInfos/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
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
